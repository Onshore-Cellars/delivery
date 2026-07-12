import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { constructWebhookEvent, calculatePlatformFee, calculateCarrierPayout, currencySymbol } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'
import { paymentReceiptEmail } from '@/lib/email'
import { queueEmail } from '@/lib/email-queue'
import { ensureInvoiceNumber } from '@/lib/invoice'
import { generateInvoiceToken } from '@/lib/auth'
import { recordTransaction } from '@/lib/ledger'
import { getPlatformFeePercent } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event
    try {
      event = constructWebhookEvent(body, signature)
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Idempotency check — skip if we've already processed this event
    const eventId = event.id
    const existingLog = await prisma.auditLog.findFirst({
      where: { action: 'STRIPE_WEBHOOK', targetId: eventId }
    })
    if (existingLog) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { metadata?: { bookingId?: string }; payment_intent?: string }
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
          // Fetch booking first to calculate fees, then update in one query
          const existingBooking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { totalPrice: true, status: true, paymentStatus: true } })
          const totalPrice = existingBooking?.totalPrice ?? 0

          // Only confirm bookings that are still in a valid pre-confirmed state
          if (!existingBooking || !['PENDING', 'CONFIRMED'].includes(existingBooking.status) || existingBooking.paymentStatus === 'PAID') {
            break
          }

          const feePercent = await getPlatformFeePercent()
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: 'PAID',
              paidAt: new Date(),
              status: 'CONFIRMED',
              stripePaymentIntentId: session.payment_intent as string,
              platformFee: calculatePlatformFee(totalPrice, feePercent),
              carrierPayout: calculateCarrierPayout(totalPrice, feePercent),
            },
            include: {
              shipper: { select: { id: true, name: true, email: true } },
              listing: {
                select: {
                  carrierId: true,
                  title: true,
                  originPort: true,
                  destinationPort: true,
                  carrier: { select: { id: true, name: true, email: true } },
                },
              },
            },
          })

          const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const sym = currencySymbol(booking.currency)
          const fmtMoney = (n: number) => `${sym}${n.toFixed(2)}`

          // Assign the stable invoice number now, at payment, so it's fixed on
          // every copy of the document (receipt email, PDF, HTML view) forever.
          try { await ensureInvoiceNumber(booking.id) } catch (e) { console.error('Invoice number error:', e) }
          // Ledger: record the charge (gross = net + VAT).
          await recordTransaction({
            bookingId: booking.id, type: 'CHARGE',
            amount: booking.totalPrice + (booking.vatAmount || 0), currency: booking.currency,
            stripeRef: session.payment_intent as string, note: 'Payment captured',
          })

          // Notify both parties (in-app)
          await createNotification({
            userId: booking.shipperId,
            type: 'PAYMENT_RECEIVED',
            title: 'Payment Successful',
            message: `Payment received for ${booking.listing.title}. Your booking is confirmed.`,
            linkUrl: `/tracking?code=${booking.trackingCode}`,
          })

          await createNotification({
            userId: booking.listing.carrierId,
            type: 'PAYMENT_RECEIVED',
            title: 'Booking Paid',
            message: `${booking.shipper.name} paid for ${booking.listing.title}. Your payout is held and released on delivery confirmation.`,
            linkUrl: '/dashboard',
          })

          // Create tracking event
          await prisma.trackingEvent.create({
            data: {
              bookingId: booking.id,
              status: 'CONFIRMED',
              description: 'Payment received and booking confirmed',
            },
          })

          // Send payment receipt email to shipper
          try {
            const grossPaid = booking.totalPrice + (booking.vatAmount || 0)
            const receiptEmail = paymentReceiptEmail({
              customerName: booking.shipper.name,
              trackingCode: booking.trackingCode || bookingId,
              amount: fmtMoney(grossPaid),
              description: `${booking.listing.originPort} → ${booking.listing.destinationPort}`,
              paidAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              invoiceUrl: `${appUrl}/api/bookings/${booking.id}/invoice/pdf?token=${generateInvoiceToken(booking.id, 'shipper')}`,
            })
            await queueEmail({ to: booking.shipper.email, ...receiptEmail })
          } catch (e) { console.error('Receipt email error:', e) }

          // NB: the carrier payout email is sent later, when the escrowed funds
          // are actually released on delivery (see lib/payout.ts) — not here.
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as { metadata?: { bookingId?: string } }
        const bookingId = intent.metadata?.bookingId

        if (bookingId) {
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'FAILED' },
          })

          await createNotification({
            userId: booking.shipperId,
            type: 'PAYMENT_FAILED',
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please try again.',
            linkUrl: `/dashboard`,
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as { metadata?: { bookingId?: string } }
        const bookingId = charge.metadata?.bookingId

        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'REFUNDED' },
          })
        }
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as { payment_intent?: string; reason?: string; amount?: number }
        // Find booking by payment intent
        if (dispute.payment_intent) {
          const booking = await prisma.booking.findFirst({
            where: { stripePaymentIntentId: dispute.payment_intent as string },
            include: { listing: { select: { carrierId: true } } }
          })
          if (booking) {
            // Only transition to DISPUTED if not already in a terminal state
            if (!['CANCELLED', 'COMPLETED', 'DISPUTED'].includes(booking.status as string)) {
              await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'DISPUTED' }
              })
            }
            // Create dispute record
            await prisma.dispute.create({
              data: {
                bookingId: booking.id,
                raisedById: booking.shipperId,
                againstId: booking.listing.carrierId,
                type: 'OTHER',
                description: `Stripe dispute filed: ${dispute.reason || 'unknown reason'}`,
                status: 'OPEN',
                priority: 'URGENT',
                claimAmount: dispute.amount ? dispute.amount / 100 : null,
              }
            })
            // Notify admin
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
            for (const admin of admins) {
              await createNotification({
                userId: admin.id,
                type: 'SYSTEM',
                title: 'Stripe Dispute Filed',
                message: `A chargeback dispute has been filed for booking ${booking.trackingCode}`,
                linkUrl: `/admin`,
              })
            }
          }
        }
        break
      }

      case 'payment_intent.canceled': {
        const intent = event.data.object as { metadata?: { bookingId?: string } }
        const bookingId = intent.metadata?.bookingId
        if (bookingId) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'FAILED', status: 'CANCELLED' }
          })
        }
        break
      }

      case 'checkout.session.expired': {
        // Stripe session expired (matches our 30-min expires_at) — cancel the booking
        const session = event.data.object as { metadata?: { bookingId?: string } }
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, status: true, paymentStatus: true, weightKg: true, volumeM3: true, listingId: true, routeDirection: true },
          })
          if (booking && booking.status === 'PENDING' && booking.paymentStatus !== 'PAID') {
            await prisma.$transaction(async (tx) => {
              await tx.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
              })
              // Restore listing capacity
              if (booking.routeDirection === 'return') {
                await tx.listing.update({
                  where: { id: booking.listingId },
                  data: {
                    returnAvailableKg: { increment: booking.weightKg },
                    returnAvailableM3: { increment: booking.volumeM3 },
                  },
                })
              } else {
                await tx.listing.update({
                  where: { id: booking.listingId },
                  data: {
                    availableKg: { increment: booking.weightKg },
                    availableM3: { increment: booking.volumeM3 },
                  },
                })
              }
              // Reactivate listing if it was FULL
              const listing = await tx.listing.findUnique({ where: { id: booking.listingId } })
              if (listing && listing.status === 'FULL') {
                await tx.listing.update({ where: { id: booking.listingId }, data: { status: 'ACTIVE' } })
              }
            })
          }
        }
        break
      }

      case 'charge.dispute.closed': {
        // Dispute resolved — update dispute record status
        const dispute = event.data.object as { payment_intent?: string; status?: string }
        if (dispute.payment_intent) {
          const booking = await prisma.booking.findFirst({
            where: { stripePaymentIntentId: dispute.payment_intent as string },
          })
          if (booking) {
            const won = dispute.status === 'won'
            // Update any open disputes for this booking
            await prisma.dispute.updateMany({
              where: { bookingId: booking.id, status: 'OPEN' },
              data: {
                status: won ? 'RESOLVED' : 'ESCALATED',
                resolution: won ? 'Dispute resolved in platform\'s favor' : 'Dispute lost — refund issued by Stripe',
                resolvedAt: new Date(),
              },
            })
            // If we lost the dispute, mark booking accordingly
            if (!won) {
              await prisma.booking.update({
                where: { id: booking.id },
                data: { paymentStatus: 'REFUNDED' },
              })
            } else {
              // Won — restore booking to previous state if it was disputed
              await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'CONFIRMED' },
              })
            }
          }
        }
        break
      }
    }

    // Record the idempotency key ONLY after the handler's work has committed. If
    // any handler above throws, we fall to the catch, return 500, and Stripe
    // retries — this time not short-circuited as a duplicate. (Previously the key
    // was written before handling, so a mid-handler failure permanently dropped
    // the work.)
    await prisma.auditLog.create({
      data: {
        action: 'STRIPE_WEBHOOK',
        targetId: eventId,
        details: JSON.stringify({ eventId, type: event.type }),
      },
    }).catch((e) => { console.error('Webhook idempotency-log write failed:', e) })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
