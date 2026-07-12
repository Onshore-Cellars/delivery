import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'

// Infrastructure / data-integrity watchdogs. These surface operational health
// problems that would otherwise silently strand money or bookings.

// Carriers who have money waiting but no connected Stripe account to receive it.
const payoutBlocker: Agent = {
  team: 'IT',
  kind: 'carrier-onboarding-blocker',
  label: 'Unblock stuck carrier payouts',
  description: 'Carriers with delivered, paid bookings but no connected Stripe account.',
  async run() {
    const stuck = await prisma.booking.findMany({
      where: { status: 'DELIVERED', paymentStatus: 'PAID', payoutTransferredAt: null },
      select: {
        carrierPayout: true, currency: true,
        listing: { select: { carrier: { select: { id: true, name: true, company: true, email: true, stripeAccountId: true } } } },
      },
      take: 300,
    })
    // Group unpaid, un-onboarded carriers and sum what they're owed.
    const byCarrier = new Map<string, { name: string; email: string | null; total: number; currency: string; count: number }>()
    for (const b of stuck) {
      const c = b.listing.carrier
      if (c.stripeAccountId) continue // Ops release-payout handles those
      const cur = byCarrier.get(c.id) || { name: c.company || c.name, email: c.email, total: 0, currency: b.currency, count: 0 }
      cur.total += b.carrierPayout; cur.count++
      byCarrier.set(c.id, cur)
    }
    return [...byCarrier.entries()].slice(0, 25).map(([carrierId, v]): ProposedTask => ({
      team: 'IT', kind: 'carrier-onboarding-blocker',
      title: `Nudge ${v.name} to connect payouts`,
      summary: `${v.count} delivered booking(s) worth ${v.currency} ${v.total.toFixed(2)} can't pay out — carrier has no connected Stripe account. Prompt them to finish onboarding.`,
      reasoning: 'Payouts fail until the carrier onboards. A reminder unblocks the money without any manual intervention.',
      confidence: 0.85,
      payload: { carrierId, amount: v.total, currency: v.currency, count: v.count },
      relatedType: 'user', relatedId: carrierId,
      dedupeKey: `carrier-onboarding-blocker:${carrierId}`,
    }))
  },
  async execute(payload) {
    const carrierId = String(payload.carrierId || '')
    if (!carrierId) return { ok: false, error: 'Missing carrierId' }
    try {
      await createNotification({
        userId: carrierId, type: 'SYSTEM', title: 'Connect your account to get paid',
        message: `You have delivered bookings ready to pay out (${payload.currency} ${Number(payload.amount || 0).toFixed(2)}). Finish Stripe onboarding from your dashboard to release the funds.`,
        linkUrl: '/dashboard',
      })
      return { ok: true, result: 'Carrier prompted to complete onboarding' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Notify failed' } }
  },
}

// Bookings that took payment but never advanced past PENDING — a sign of a
// stuck fulfilment step that should be looked at.
const stuckPaidPending: Agent = {
  team: 'IT',
  kind: 'stuck-paid-pending',
  label: 'Flag stuck paid bookings',
  description: 'Bookings paid over 24h ago but still in PENDING status.',
  async run() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const stuck = await prisma.booking.findMany({
      where: { paymentStatus: 'PAID', status: 'PENDING', paidAt: { lte: cutoff } },
      select: { id: true, trackingCode: true, paidAt: true, currency: true, totalPrice: true },
      take: 25,
    })
    return stuck.map((b): ProposedTask => {
      const hrs = b.paidAt ? Math.floor((Date.now() - new Date(b.paidAt).getTime()) / 3600000) : 24
      return {
        team: 'IT', kind: 'stuck-paid-pending',
        title: `Paid booking stuck: ${b.trackingCode || b.id.slice(-6)}`,
        summary: `Paid ${hrs}h ago but still PENDING (not confirmed). A carrier or webhook step may have failed. Alert the admin team to check.`,
        confidence: 0.8,
        payload: { bookingId: b.id },
        relatedType: 'booking', relatedId: b.id,
        dedupeKey: `stuck-paid-pending:${b.id}`,
      }
    })
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Stuck paid booking', message: `A paid booking is still PENDING after 24h+ and may need a manual status check.`, linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: 'Admins alerted' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Alert failed' } }
  },
}

// Listings whose remaining capacity went negative — an oversell that must be
// corrected before more cargo is booked against space that doesn't exist.
const negativeCapacity: Agent = {
  team: 'IT',
  kind: 'negative-capacity',
  label: 'Fix oversold listings',
  description: 'Active listings whose available capacity dropped below zero.',
  async run() {
    const bad = await prisma.listing.findMany({
      where: { status: 'ACTIVE', availableKg: { lt: 0 } },
      select: { id: true, title: true, availableKg: true, originPort: true, destinationPort: true },
      take: 25,
    })
    return bad.map((l): ProposedTask => ({
      team: 'IT', kind: 'negative-capacity',
      title: `Oversold listing: "${l.title}"`,
      summary: `${l.originPort} → ${l.destinationPort} shows ${l.availableKg.toFixed(1)}kg available (negative). Clamp to 0 and mark FULL so it can't take more cargo.`,
      reasoning: 'Negative capacity means more was booked than offered. Clamping to zero and closing the listing stops further oversell.',
      confidence: 0.9,
      payload: { listingId: l.id },
      relatedType: 'listing', relatedId: l.id,
      dedupeKey: `negative-capacity:${l.id}`,
    }))
  },
  async execute(payload) {
    const listingId = String(payload.listingId || '')
    if (!listingId) return { ok: false, error: 'Missing listingId' }
    try {
      await prisma.listing.update({ where: { id: listingId }, data: { availableKg: 0, status: 'FULL' } })
      return { ok: true, result: 'Capacity clamped to 0 and listing marked FULL' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Fix failed' } }
  },
}

export const itAgents = [payoutBlocker, stuckPaidPending, negativeCapacity]
