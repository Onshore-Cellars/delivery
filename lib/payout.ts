import prisma from './prisma'
import { createTransfer, reverseTransfer, currencySymbol, calculateCarrierPayout } from './stripe'
import { createNotification } from './notifications'
import { carrierPayoutEmail } from './email'
import { queueEmail } from './email-queue'
import { generateInvoiceToken } from './auth'

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

  const transfer = await createTransfer({
    amount,
    currency: booking.currency,
    destination: account,
    bookingId: booking.id,
  })

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeTransferId: transfer.id, payoutTransferredAt: new Date() },
  })

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
    select: { stripeTransferId: true, payoutTransferredAt: true, carrierPayout: true },
  })
  if (!booking?.stripeTransferId || !booking.payoutTransferredAt) return

  const reversalAmount = amount != null ? Math.min(amount, booking.carrierPayout) : undefined
  await reverseTransfer(booking.stripeTransferId, reversalAmount)
}
