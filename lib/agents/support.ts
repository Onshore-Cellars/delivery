import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'
import { llmJson, aiEnabled } from './llm'

// Escalate disputes that have been open too long without resolution.
const escalateDispute: Agent = {
  team: 'SUPPORT',
  kind: 'escalate-dispute',
  label: 'Escalate ageing disputes',
  description: 'Open disputes older than 48h not yet marked high priority.',
  async run() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const disputes = await prisma.dispute.findMany({
      where: { status: { in: ['OPEN', 'UNDER_REVIEW'] }, priority: { notIn: ['HIGH', 'URGENT'] }, createdAt: { lte: cutoff } },
      select: { id: true, type: true, createdAt: true, booking: { select: { trackingCode: true } } },
      take: 25,
    })
    return disputes.map((d): ProposedTask => {
      const days = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000)
      return {
        team: 'SUPPORT', kind: 'escalate-dispute',
        title: `Escalate ${d.type.replace('_', ' ').toLowerCase()} dispute on ${d.booking?.trackingCode || '—'}`,
        summary: `Open for ${days} day(s) with no resolution. Raise priority to HIGH and alert the admin team.`,
        confidence: 0.88,
        payload: { disputeId: d.id },
        relatedType: 'dispute', relatedId: d.id,
        dedupeKey: `escalate-dispute:${d.id}`,
      }
    })
  },
  async execute(payload) {
    const disputeId = String(payload.disputeId || '')
    if (!disputeId) return { ok: false, error: 'Missing disputeId' }
    try {
      await prisma.dispute.update({ where: { id: disputeId }, data: { priority: 'HIGH', status: 'UNDER_REVIEW' } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Dispute escalated', message: `A dispute was auto-escalated to HIGH priority and needs review.`, linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: 'Escalated to HIGH + admins notified' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Escalation failed' } }
  },
}

// Remind shippers who created a booking but never completed payment.
const nudgeUnpaid: Agent = {
  team: 'SUPPORT',
  kind: 'nudge-unpaid-booking',
  label: 'Nudge unpaid bookings',
  description: 'Bookings awaiting payment for over an hour.',
  async run() {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000)
    const bookings = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['PENDING', 'PROCESSING'] }, status: 'PENDING', createdAt: { lte: cutoff } },
      select: { id: true, trackingCode: true, shipperId: true, totalPrice: true, currency: true, listing: { select: { title: true } } },
      take: 25,
    })
    return bookings.map((b): ProposedTask => ({
      team: 'SUPPORT', kind: 'nudge-unpaid-booking',
      title: `Remind shipper to pay ${b.trackingCode || b.id.slice(-6)}`,
      summary: `Booking on "${b.listing.title}" (${b.currency} ${b.totalPrice.toFixed(2)}) has been awaiting payment for 1h+.`,
      confidence: 0.8,
      payload: { bookingId: b.id, shipperId: b.shipperId, trackingCode: b.trackingCode },
      relatedType: 'booking', relatedId: b.id,
      dedupeKey: `nudge-unpaid:${b.id}`,
    }))
  },
  async execute(payload) {
    const shipperId = String(payload.shipperId || '')
    if (!shipperId) return { ok: false, error: 'Missing shipperId' }
    try {
      await createNotification({
        userId: shipperId, type: 'SYSTEM', title: 'Complete your booking payment',
        message: `Your booking ${payload.trackingCode || ''} is still awaiting payment. Pay now to confirm your space before it's released.`,
        linkUrl: '/dashboard',
      })
      return { ok: true, result: 'Reminder sent' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Reminder failed' } }
  },
}

// LLM triage: read an open dispute and propose a priority + recommended
// resolution (and a draft response the human can send). Internal only — the
// execute step records the analysis and alerts admins; it never messages the
// customer automatically.
const triageDispute: Agent = {
  team: 'SUPPORT',
  kind: 'triage-dispute',
  label: 'AI dispute triage',
  description: 'Read a new dispute and recommend a priority + resolution.',
  async run(ctx) {
    if (!aiEnabled()) return [] // rule-based escalateDispute covers the no-AI case
    const disputes = await prisma.dispute.findMany({
      where: { status: 'OPEN', adminNotes: null },
      select: {
        id: true, type: true, description: true, claimAmount: true,
        booking: { select: { trackingCode: true, totalPrice: true, vatAmount: true, currency: true, status: true } },
      },
      take: 8,
    })
    const out: ProposedTask[] = []
    for (const d of disputes) {
      const gross = (d.booking?.totalPrice || 0) + (d.booking?.vatAmount || 0)
      const rec = await llmJson<{ priority: string; recommendation: string; suggestedRefund: number; draftResponse: string; confidence: number }>({
        system: `You are Onshore's customer-service lead triaging a delivery dispute. Be fair, concise and policy-aware: cargo is insured, payment is held until delivery, refunds can be partial. Never promise more than the booking gross (${d.booking?.currency} ${gross.toFixed(2)}).`,
        prompt: `Dispute type: ${d.type}. Booking status: ${d.booking?.status}. Claim amount: ${d.claimAmount ?? 'n/a'}. Customer says: "${(d.description || '').slice(0, 800)}".
Return JSON: { "priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT", "recommendation": string (what the team should do), "suggestedRefund": number (0 if none), "draftResponse": string (a short reply the agent could send the customer), "confidence": number 0..1 }.`,
        decisions: ctx.recentDecisions,
        maxTokens: 700,
        smart: true,
      })
      if (!rec?.recommendation) continue
      out.push({
        team: 'SUPPORT', kind: 'triage-dispute',
        title: `Triage ${d.type.replace('_', ' ').toLowerCase()} dispute · ${d.booking?.trackingCode || '—'}`,
        summary: `Recommend ${rec.priority} priority. ${rec.recommendation}${rec.suggestedRefund > 0 ? ` Suggested refund: ${d.booking?.currency} ${rec.suggestedRefund.toFixed(2)}.` : ''}`,
        reasoning: rec.draftResponse ? `Draft reply: "${rec.draftResponse.slice(0, 240)}"` : '',
        confidence: Math.max(0, Math.min(1, rec.confidence ?? 0.6)),
        payload: { disputeId: d.id, priority: rec.priority, analysis: rec.recommendation, suggestedRefund: rec.suggestedRefund, draftResponse: rec.draftResponse },
        relatedType: 'dispute', relatedId: d.id,
        dedupeKey: `triage-dispute:${d.id}`,
      })
    }
    return out
  },
  async execute(payload) {
    const disputeId = String(payload.disputeId || '')
    if (!disputeId) return { ok: false, error: 'Missing disputeId' }
    try {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      const priority = validPriorities.includes(String(payload.priority)) ? String(payload.priority) : 'MEDIUM'
      const note = `AI triage: ${payload.analysis || ''}${payload.suggestedRefund ? ` · suggested refund ${payload.suggestedRefund}` : ''}${payload.draftResponse ? `\nDraft reply: ${payload.draftResponse}` : ''}`
      await prisma.dispute.update({ where: { id: disputeId }, data: { priority, status: 'UNDER_REVIEW', adminNotes: note.slice(0, 2000) } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Dispute triaged by AI', message: 'A dispute has an AI-recommended resolution ready for your review.', linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: `Triaged (${priority}) with recommendation recorded` }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Triage failed' } }
  },
}

export const supportAgents = [escalateDispute, nudgeUnpaid, triageDispute]

