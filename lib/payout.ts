import prisma from './prisma'
import { createTransfer, reverseTransfer, currencySymbol, calculateCarrierPayout } from './stripe'
import { createNotification } from './notifications'
import { carrierPayoutEmail } from './email'
import { queueEmail } from './email-queue'
import { generateInvoiceToken } from './auth'
import { recordTransaction } from './ledger'

/**
 * The carrier's share of a refund. On a FULL refund the whole payout is
 * reversed (return undefined = full reversal). On a partial refund, reverse
 * only the carrier's proportional share of the gross — VAT is the platform's
 * liability, not the carrier's, so it is excluded.
 *
 *   refundAmount : amount being refunded to the customer (gross basis)
 *   carrierPayout: the carrier's net payout for the booking
 *   gross        : booking gross actually charged (net + VAT)
 * Returns the amount to claw back, or undefined for a full reversal.
 */
export function carrierRefundShare(refundAmount: number, carrierPayout: number, gross: number): number | undefined {
  if (!(gross > 0)) return undefined
  if (refundAmount >= gross) return undefined // full refund → full reversal
  return Math.round((refundAmount * (carrierPayout / gross)) * 100) / 100
}

/**
 * Release a carrier's escrowed payout for a DELIVERED booking.
 *
 * With separate charges & transfers, the shipper's payment sits on the platform
 * balance until delivery is confirmed; this transfers the carrier's share to
 * their connected account. Idempotent — safe to call from both the status route
 * and the POD route, and a no-op if already paid out, not yet paid, or the
 * carrier hasn't finished Stripe Connect onboarding (payout stays pending).
 */
export async function releaseCarrierPayout(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      paymentStatus: true,
      payoutTransferredAt: true,
      carrierPayout: true,
      totalPrice: true,
      platformFee: true,
      currency: true,
      trackingCode: true,
      listing: {
        select: {
          carrierId: true,
          carrier: { select: { stripeAccountId: true, name: true, email: true } },
        },
      },
    },
  })

  if (!booking) return
  if (booking.payoutTransferredAt) return          // already released
  if (booking.paymentStatus !== 'PAID') return     // only pay out captured funds
  const account = booking.listing.carrier?.stripeAccountId
  if (!account) return                             // carrier not onboarded — stays pending

  const amount = booking.carrierPayout || calculateCarrierPayout(booking.totalPrice)
  if (amount <= 0) return

  // Atomically CLAIM the payout before moving any money. This is the guard that
  // makes the function genuinely idempotent under concurrency: the status route,
  // the POD route and the ops agent can all fire for the same booking at once —
  // only the first updateMany that flips payoutTransferredAt from null wins
  // (count === 1); the losers see count 0 and return without transferring.
  const claim = await prisma.booking.updateMany({
    where: { id: booking.id, payoutTransferredAt: null, paymentStatus: 'PAID' },
    data: { payoutTransferredAt: new Date() },
  })
  if (claim.count !== 1) return                    // someone else already claimed it

  let transfer: Awaited<ReturnType<typeof createTransfer>>
  try {
    // Idempotency key keyed on the booking makes a retried transfer a no-op at
    // Stripe (belt-and-braces with the DB claim above).
    transfer = await createTransfer({
      amount,
      currency: booking.currency,
      destination: account,
      bookingId: booking.id,
      idempotencyKey: `payout:${booking.id}`,
    })
  } catch (err) {
    // Transfer failed — release the claim so it can be retried later.
    await prisma.booking.updateMany({
      where: { id: booking.id, payoutTransferredAt: { not: null }, stripeTransferId: null },
      data: { payoutTransferredAt: null },
    }).catch(() => {})
    throw err
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeTransferId: transfer.id },
  })
  await recordTransaction({ bookingId: booking.id, type: 'PAYOUT', amount, currency: booking.currency, stripeRef: transfer.id, note: 'Carrier payout released' })

  // Notify + email the carrier that funds are on the way.
  const sym = currencySymbol(booking.currency)
  await createNotification({
    userId: booking.listing.carrierId,
    type: 'PAYMENT_RECEIVED',
    title: 'Payout Released',
    message: `Your payout of ${sym}${amount.toFixed(2)} for ${booking.trackingCode} has been sent to your account.`,
    linkUrl: '/earnings',
  }).catch(() => {})

  if (booking.listing.carrier?.email) {
    try {
      const email = carrierPayoutEmail({
        carrierName: booking.listing.carrier.name || 'there',
        trackingCode: booking.trackingCode || booking.id,
        bookingTotal: `${sym}${booking.totalPrice.toFixed(2)}`,
        platformFee: `${sym}${booking.platformFee.toFixed(2)}`,
        payoutAmount: `${sym}${amount.toFixed(2)}`,
        deliveredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        statementUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bookings/${booking.id}/invoice/pdf?token=${generateInvoiceToken(booking.id, 'carrier')}`,
      })
      await queueEmail({ to: booking.listing.carrier.email, ...email })
    } catch (e) {
      console.error('Payout email error:', e)
    }
  }
}

/**
 * Reverse a carrier payout (fully or up to `amount`) when a delivered booking is
 * later refunded. No-op if the payout was never transferred (the common case:
 * cancellations happen before delivery, so funds are still on the platform).
 */
export async function reverseCarrierPayout(bookingId: string, amount?: number): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { stripeTransferId: true, payoutTransferredAt: true, carrierPayout: true, currency: true },
  })
  if (!booking?.stripeTransferId || !booking.payoutTransferredAt) return

  const reversalAmount = amount != null ? Math.min(amount, booking.carrierPayout) : undefined
  const reversal = await reverseTransfer(booking.stripeTransferId, reversalAmount)
  await recordTransaction({ bookingId, type: 'PAYOUT_REVERSAL', amount: reversalAmount ?? booking.carrierPayout, currency: booking.currency, stripeRef: reversal.id, note: 'Carrier payout clawed back on refund' })
}
