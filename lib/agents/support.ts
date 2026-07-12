import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'

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

export const supportAgents = [escalateDispute, nudgeUnpaid]
