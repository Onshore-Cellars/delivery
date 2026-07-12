import prisma from '@/lib/prisma'
import { releaseCarrierPayout } from '@/lib/payout'
import type { Agent, ProposedTask } from './types'

// Release carrier payouts for delivered bookings that haven't paid out yet.
const releasePayout: Agent = {
  team: 'OPS',
  kind: 'release-payout',
  label: 'Release stuck payouts',
  description: 'Delivered & paid bookings whose carrier payout has not been released.',
  async run() {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000) // delivered ≥ 6h ago
    const stuck = await prisma.booking.findMany({
      where: { status: 'DELIVERED', paymentStatus: 'PAID', payoutTransferredAt: null, actualDelivery: { lte: cutoff } },
      select: {
        id: true, trackingCode: true, carrierPayout: true, currency: true,
        listing: { select: { carrier: { select: { name: true, company: true, stripeAccountId: true } } } },
      },
      take: 25,
    })
    return stuck.map((b): ProposedTask => ({
      team: 'OPS', kind: 'release-payout',
      title: `Release payout for ${b.trackingCode || b.id.slice(-6)}`,
      summary: `${b.currency} ${b.carrierPayout.toFixed(2)} to ${b.listing.carrier.company || b.listing.carrier.name}. Delivered ≥6h ago, not yet paid out.`,
      reasoning: b.listing.carrier.stripeAccountId ? 'Carrier has a connected Stripe account; payout can be released.' : 'Carrier has NO connected Stripe account — releasing will fail until they onboard.',
      confidence: b.listing.carrier.stripeAccountId ? 0.9 : 0.4,
      payload: { bookingId: b.id },
      relatedType: 'booking', relatedId: b.id,
      dedupeKey: `release-payout:${b.id}`,
    }))
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try { await releaseCarrierPayout(bookingId); return { ok: true, result: 'Payout released' } }
    catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Release failed' } }
  },
}

// Mark listings with no remaining capacity as FULL so they stop showing as bookable.
const closeFullListing: Agent = {
  team: 'OPS',
  kind: 'close-full-listing',
  label: 'Close sold-out listings',
  description: 'Active listings with no remaining capacity.',
  async run() {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE', availableKg: { lte: 0 } },
      select: { id: true, title: true, originPort: true, destinationPort: true },
      take: 25,
    })
    return listings.map((l): ProposedTask => ({
      team: 'OPS', kind: 'close-full-listing',
      title: `Mark "${l.title}" as full`,
      summary: `${l.originPort} → ${l.destinationPort} has no remaining capacity but is still ACTIVE.`,
      confidence: 0.92,
      payload: { listingId: l.id },
      relatedType: 'listing', relatedId: l.id,
      dedupeKey: `close-full-listing:${l.id}`,
    }))
  },
  async execute(payload) {
    const listingId = String(payload.listingId || '')
    if (!listingId) return { ok: false, error: 'Missing listingId' }
    try { await prisma.listing.update({ where: { id: listingId }, data: { status: 'FULL' } }); return { ok: true, result: 'Listing marked FULL' } }
    catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Update failed' } }
  },
}

export const opsAgents = [releasePayout, closeFullListing]
