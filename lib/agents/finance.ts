import prisma from '@/lib/prisma'
import { recordTransaction } from '@/lib/ledger'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'

// Reconcile the money ledger against actual booking state. The ledger is
// best-effort at write time (a failed ledger write never blocks a real charge),
// so entries can be missing after an outage. These agents detect the gaps and
// backfill the row from the booking's own captured figures — idempotent, and
// re-checked at execute time so a race can't double-write.

// Charges that were captured but never landed a CHARGE ledger row.
const reconcileCharges: Agent = {
  team: 'FINANCE',
  kind: 'reconcile-charge',
  label: 'Backfill missing charges',
  description: 'Paid bookings with no CHARGE row in the ledger.',
  async run() {
    const paid = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] }, paidAt: { not: null } },
      select: {
        id: true, trackingCode: true, totalPrice: true, vatAmount: true, currency: true,
        stripePaymentIntentId: true, transactions: { where: { type: 'CHARGE' }, select: { id: true }, take: 1 },
      },
      orderBy: { paidAt: 'desc' },
      take: 200,
    })
    const missing = paid.filter(b => b.transactions.length === 0)
    return missing.slice(0, 25).map((b): ProposedTask => {
      const gross = b.totalPrice + (b.vatAmount || 0)
      return {
        team: 'FINANCE', kind: 'reconcile-charge',
        title: `Backfill charge for ${b.trackingCode || b.id.slice(-6)}`,
        summary: `Booking is paid but has no CHARGE ledger entry. Record ${b.currency} ${gross.toFixed(2)} (net + VAT) so reports and reconciliation balance.`,
        reasoning: 'Ledger writes are best-effort; this row was likely lost to a transient error. Backfill uses the booking’s own captured gross.',
        confidence: 0.9,
        payload: { bookingId: b.id, amount: gross, currency: b.currency, stripeRef: b.stripePaymentIntentId },
        relatedType: 'booking', relatedId: b.id,
        dedupeKey: `reconcile-charge:${b.id}`,
      }
    })
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try {
      // Re-check under execute so an intervening write can't cause a duplicate.
      const existing = await prisma.transaction.findFirst({ where: { bookingId, type: 'CHARGE' }, select: { id: true } })
      if (existing) return { ok: true, result: 'CHARGE already present — nothing to backfill' }
      await recordTransaction({
        bookingId, type: 'CHARGE', amount: Number(payload.amount) || 0,
        currency: String(payload.currency || 'EUR'), stripeRef: (payload.stripeRef as string) || null,
        note: 'Backfilled by Finance reconciliation',
      })
      return { ok: true, result: 'CHARGE row backfilled' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Backfill failed' } }
  },
}

// Payouts that were transferred but never landed a PAYOUT ledger row.
const reconcilePayouts: Agent = {
  team: 'FINANCE',
  kind: 'reconcile-payout',
  label: 'Backfill missing payouts',
  description: 'Transferred carrier payouts with no PAYOUT row in the ledger.',
  async run() {
    const transferred = await prisma.booking.findMany({
      where: { payoutTransferredAt: { not: null }, carrierPayout: { gt: 0 } },
      select: {
        id: true, trackingCode: true, carrierPayout: true, currency: true, stripeTransferId: true,
        transactions: { where: { type: 'PAYOUT' }, select: { id: true }, take: 1 },
      },
      orderBy: { payoutTransferredAt: 'desc' },
      take: 200,
    })
    const missing = transferred.filter(b => b.transactions.length === 0)
    return missing.slice(0, 25).map((b): ProposedTask => ({
      team: 'FINANCE', kind: 'reconcile-payout',
      title: `Backfill payout for ${b.trackingCode || b.id.slice(-6)}`,
      summary: `Carrier payout was transferred but has no PAYOUT ledger entry. Record ${b.currency} ${b.carrierPayout.toFixed(2)}.`,
      reasoning: 'The transfer exists (payoutTransferredAt is set); only the ledger row is missing.',
      confidence: 0.9,
      payload: { bookingId: b.id, amount: b.carrierPayout, currency: b.currency, stripeRef: b.stripeTransferId },
      relatedType: 'booking', relatedId: b.id,
      dedupeKey: `reconcile-payout:${b.id}`,
    }))
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try {
      const existing = await prisma.transaction.findFirst({ where: { bookingId, type: 'PAYOUT' }, select: { id: true } })
      if (existing) return { ok: true, result: 'PAYOUT already present — nothing to backfill' }
      await recordTransaction({
        bookingId, type: 'PAYOUT', amount: Number(payload.amount) || 0,
        currency: String(payload.currency || 'EUR'), stripeRef: (payload.stripeRef as string) || null,
        note: 'Backfilled by Finance reconciliation',
      })
      return { ok: true, result: 'PAYOUT row backfilled' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Backfill failed' } }
  },
}

// Flag bookings whose cumulative refunds exceed the gross charged — a data
// integrity alarm that should never fire, but if it does, an admin must look.
const refundOverage: Agent = {
  team: 'FINANCE',
  kind: 'flag-refund-overage',
  label: 'Flag over-refunds',
  description: 'Bookings refunded beyond the gross charged.',
  async run() {
    const rows = await prisma.booking.findMany({
      where: { refundedAmount: { gt: 0 } },
      select: { id: true, trackingCode: true, totalPrice: true, vatAmount: true, refundedAmount: true, currency: true },
      take: 200,
    })
    const over = rows.filter(b => b.refundedAmount > b.totalPrice + (b.vatAmount || 0) + 0.01)
    return over.slice(0, 25).map((b): ProposedTask => {
      const gross = b.totalPrice + (b.vatAmount || 0)
      return {
        team: 'FINANCE', kind: 'flag-refund-overage',
        title: `Over-refund on ${b.trackingCode || b.id.slice(-6)}`,
        summary: `Refunded ${b.currency} ${b.refundedAmount.toFixed(2)} against a gross of ${b.currency} ${gross.toFixed(2)}. Needs a human to investigate.`,
        reasoning: 'This should be impossible via the refund path; it may indicate a manual DB edit or a bug. Alerts admins, changes nothing.',
        confidence: 0.95,
        payload: { bookingId: b.id },
        relatedType: 'booking', relatedId: b.id,
        dedupeKey: `flag-refund-overage:${b.id}`,
      }
    })
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Finance alert: over-refund', message: `A booking appears refunded beyond its gross. Review it in Admin → Transactions.`, linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: 'Admins alerted to over-refund' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Alert failed' } }
  },
}

export const financeAgents = [reconcileCharges, reconcilePayouts, refundOverage]
