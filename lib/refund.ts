import prisma from './prisma'
import { createRefund } from './stripe'
import { reverseCarrierPayout, carrierRefundShare } from './payout'

export type RefundResult =
  | { ok: true; refundAmount: number; cumulativeRefunded: number; fullyRefunded: boolean }
  | { ok: false; error: string; status: number }

const round = (n: number) => Math.round(n * 100) / 100
const EPS = 0.005

/**
 * Process a refund for a booking — atomically, idempotently, and correctly for
 * partial refunds. Shared by the shipper refund route and admin dispute
 * resolution so the money logic lives in exactly one place.
 *
 *  - Guards against double refunds via a conditional DB claim (a concurrent
 *    second request sees the changed refundedAmount and is rejected) plus a
 *    Stripe idempotency key.
 *  - Tracks cumulative refundedAmount; only marks the booking REFUNDED when
 *    refunds reach the gross charged, otherwise PARTIALLY_REFUNDED.
 *  - Reverses only the carrier's proportional (VAT-excluded) share.
 *  - `amount` omitted = refund the entire remaining balance.
 */
export async function processRefund(bookingId: string, amount?: number): Promise<RefundResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true, totalPrice: true, vatAmount: true, carrierPayout: true,
      paymentStatus: true, stripePaymentIntentId: true, refundedAmount: true, routeDirection: true,
      weightKg: true, volumeM3: true, listingId: true,
    },
  })
  if (!booking) return { ok: false, error: 'Booking not found', status: 404 }
  if (!booking.stripePaymentIntentId) return { ok: false, error: 'No payment intent on this booking', status: 400 }
  if (booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'PARTIALLY_REFUNDED') {
    return { ok: false, error: 'Booking is not in a refundable state', status: 400 }
  }

  const gross = round(booking.totalPrice + (booking.vatAmount || 0))
  const already = booking.refundedAmount || 0
  const remaining = round(gross - already)
  if (remaining <= 0) return { ok: false, error: 'Booking is already fully refunded', status: 400 }

  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0) return { ok: false, error: 'Refund amount must be positive', status: 400 }
    if (amount > remaining + EPS) return { ok: false, error: `Refund exceeds the remaining balance (${remaining.toFixed(2)})`, status: 400 }
  }
  const refundAmount = amount !== undefined ? round(amount) : remaining
  const newTotal = round(already + refundAmount)
  const fullyRefunded = newTotal >= gross - EPS

  // 1) Atomically CLAIM the refund: the conditional update only succeeds if
  //    refundedAmount + paymentStatus are still what we read. A racing second
  //    request will match count 0 and be rejected — no double refund.
  const claim = await prisma.booking.updateMany({
    where: { id: booking.id, refundedAmount: already, paymentStatus: booking.paymentStatus },
    data: { refundedAmount: newTotal, paymentStatus: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
  })
  if (claim.count !== 1) return { ok: false, error: 'Refund already in progress or state changed', status: 409 }

  try {
    // 2) Refund at Stripe (idempotency key keyed on the cumulative amount).
    await createRefund(booking.stripePaymentIntentId, fullyRefunded && amount === undefined ? undefined : refundAmount, {
      idempotencyKey: `refund:${booking.id}:${newTotal.toFixed(2)}`,
    })
    // 3) Reverse the carrier's share (VAT excluded); undefined = full reversal.
    const carrierClaw = carrierRefundShare(refundAmount, booking.carrierPayout, gross)
    await reverseCarrierPayout(booking.id, carrierClaw).catch(e => console.error('Payout reversal error:', e))

    // 4) On the FINAL refund, cancel the booking. Listing-capacity restore is
    //    left to the caller (it varies by route: return-leg, FULL→ACTIVE, clamp).
    if (fullyRefunded) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }).catch(() => {})
    }

    return { ok: true, refundAmount, cumulativeRefunded: newTotal, fullyRefunded }
  } catch (err) {
    // Stripe failed after the claim — roll the claim back so it can be retried.
    await prisma.booking.updateMany({
      where: { id: booking.id, refundedAmount: newTotal },
      data: { refundedAmount: already, paymentStatus: booking.paymentStatus },
    }).catch(() => {})
    console.error('Refund failed, claim rolled back:', err)
    return { ok: false, error: 'Refund failed at the payment provider', status: 502 }
  }
}
