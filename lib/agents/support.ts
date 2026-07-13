import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'
import { llmJson, aiEnabled } from './llm'

// Append `addition` to a dispute's free-text adminNotes, capping length but
// NEVER dropping the customer-reply "sent" marker (the reply de-dupe relies on
// it). Both triageDispute and draftCustomerReply write here, so truncation must
// preserve the marker regardless of which wrote it.
const REPLY_SENT_MARKER = '[cs-reply-sent]'
function mergeNotes(existing: string | null | undefined, addition: string): string {
  const base = existing ? `${existing}\n${addition}` : addition
  let out = base.slice(-1900)
  if ((existing || '').includes(REPLY_SENT_MARKER) && !out.includes(REPLY_SENT_MARKER)) {
    out = `${REPLY_SENT_MARKER}\n${out}`.slice(0, 2000)
  }
  return out
}

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
      // Append to (never overwrite) existing notes — overwriting would erase the
      // customer-reply "sent" marker and cause the reply to be re-proposed/sent twice.
      const existing = await prisma.dispute.findUnique({ where: { id: disputeId }, select: { adminNotes: true } })
      await prisma.dispute.update({ where: { id: disputeId }, data: { priority, status: 'UNDER_REVIEW', adminNotes: mergeNotes(existing?.adminNotes, note) } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Dispute triaged by AI', message: 'A dispute has an AI-recommended resolution ready for your review.', linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: `Triaged (${priority}) with recommendation recorded` }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Triage failed' } }
  },
}

// Find an existing 1:1 conversation between two users (either ordering) or
// create one. The @@unique is on the ordered pair, so we probe both.
async function findOrCreateConversation(aId: string, bId: string, subject: string, bookingRef?: string) {
  const existing = await prisma.conversation.findFirst({
    where: { OR: [{ user1Id: aId, user2Id: bId }, { user1Id: bId, user2Id: aId }] },
    select: { id: true },
  })
  if (existing) return existing.id
  const created = await prisma.conversation.create({
    data: { user1Id: aId, user2Id: bId, subject, bookingRef: bookingRef || null },
    select: { id: true },
  })
  return created.id
}

// LLM customer-service reply: draft the ACTUAL message to send the customer on
// an open dispute, and — once approved — send it (posts a real message + emails
// the customer). This is the "one-click reply" that removes the human writing
// step while keeping a human approval gate. A sent marker on the dispute stops
// it being re-proposed after the reply goes out.
const draftCustomerReply: Agent = {
  team: 'SUPPORT',
  kind: 'dispute-reply',
  label: 'AI customer-service reply',
  description: 'Draft (and on approval, send) a reply to the customer on an open dispute.',
  guarded: true, // messages a real customer — human approval only, never auto-approved
  async run(ctx) {
    if (!aiEnabled()) return []
    const disputes = await prisma.dispute.findMany({
      where: {
        status: { in: ['OPEN', 'UNDER_REVIEW'] },
        NOT: { adminNotes: { contains: REPLY_SENT_MARKER } },
      },
      select: {
        id: true, type: true, description: true, raisedById: true,
        raisedBy: { select: { name: true } },
        booking: { select: { trackingCode: true, status: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })
    const out: ProposedTask[] = []
    for (const d of disputes) {
      const first = (d.raisedBy?.name || 'there').split(' ')[0]
      const rec = await llmJson<{ message: string; tone: string; confidence: number }>({
        system: `You are Onshore's customer-service agent replying directly to a customer about their delivery dispute. Warm, professional, concrete. Acknowledge the issue, state the next step, set a realistic expectation. Cargo is insured and payment is held until delivery, so reassure without over-promising a specific refund (a human sets any refund). Sign off as "The Onshore team". Address the customer as ${first}.`,
        prompt: `Dispute type: ${d.type}. Booking ${d.booking?.trackingCode || ''} status ${d.booking?.status}. The customer wrote: "${(d.description || '').slice(0, 800)}".
Return JSON: { "message": string (the reply to send, plain text, 3-6 sentences), "tone": string (one word), "confidence": number 0..1 }.`,
        decisions: ctx.recentDecisions,
        maxTokens: 600,
        smart: true,
      })
      if (!rec?.message) continue
      out.push({
        team: 'SUPPORT', kind: 'dispute-reply',
        title: `Reply to ${first} · ${d.type.replace('_', ' ').toLowerCase()} on ${d.booking?.trackingCode || '—'}`,
        summary: `Send a ${rec.tone || 'measured'} reply to the customer about their dispute. Approving posts the message and emails them.`,
        reasoning: `Draft: "${rec.message.slice(0, 280)}"`,
        confidence: Math.max(0, Math.min(1, rec.confidence ?? 0.6)),
        payload: { disputeId: d.id, raisedById: d.raisedById, message: rec.message, trackingCode: d.booking?.trackingCode },
        relatedType: 'dispute', relatedId: d.id,
        dedupeKey: `dispute-reply:${d.id}`,
      })
    }
    return out
  },
  async execute(payload) {
    const disputeId = String(payload.disputeId || '')
    const raisedById = String(payload.raisedById || '')
    const message = String(payload.message || '').trim()
    if (!disputeId || !raisedById || !message) return { ok: false, error: 'Missing dispute, recipient, or message' }
    try {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' }, select: { id: true } })
      if (!admin) return { ok: false, error: 'No admin account to send from' }
      if (admin.id === raisedById) return { ok: false, error: 'Recipient is the admin — nothing to send' }

      const convId = await findOrCreateConversation(admin.id, raisedById, `Dispute update — ${payload.trackingCode || ''}`.trim(), String(payload.trackingCode || '') || undefined)
      await prisma.message.create({ data: { conversationId: convId, senderId: admin.id, content: message, type: 'TEXT' } })
      await prisma.conversation.update({ where: { id: convId }, data: { lastMessageAt: new Date() } })
      await createNotification({
        userId: raisedById, type: 'MESSAGE_RECEIVED', title: 'Reply about your dispute',
        message: 'The Onshore team has replied about your dispute.', linkUrl: '/messages',
      }).catch(() => {})
      // Mark the dispute so this reply isn't proposed again.
      const disp = await prisma.dispute.findUnique({ where: { id: disputeId }, select: { adminNotes: true } })
      await prisma.dispute.update({ where: { id: disputeId }, data: { adminNotes: mergeNotes(disp?.adminNotes, `${REPLY_SENT_MARKER} ${new Date().toISOString()}`) } })
      return { ok: true, result: 'Reply sent to customer + they were notified' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Send failed' } }
  },
}

export const supportAgents = [escalateDispute, nudgeUnpaid, triageDispute, draftCustomerReply]

