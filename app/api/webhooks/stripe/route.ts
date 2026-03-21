import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { constructWebhookEvent, calculatePlatformFee, calculateCarrierPayout } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'
import { sendEmail, paymentReceiptEmail, carrierPayoutEmail } from '@/lib/email'

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { metadata?: { bookingId?: string }; payment_intent?: string }
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
          const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: 'PAID',
              paidAt: new Date(),
              status: 'CONFIRMED',
              stripePaymentIntentId: session.payment_intent as string,
              platformFee: calculatePlatformFee((await prisma.booking.findUnique({ where: { id: bookingId } }))?.totalPrice ?? 0),
              carrierPayout: calculateCarrierPayout((await prisma.booking.findUnique({ where: { id: bookingId } }))?.totalPrice ?? 0),
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
          const fmtMoney = (n: number) => `€${n.toFixed(2)}`

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
            title: 'Payment Received',
            message: `${booking.shipper.name} paid for ${booking.listing.title}`,
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
            const receiptEmail = paymentReceiptEmail({
              customerName: booking.shipper.name,
              trackingCode: booking.trackingCode || bookingId,
              amount: fmtMoney(booking.totalPrice),
              description: `${booking.listing.originPort} → ${booking.listing.destinationPort}`,
              paidAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              invoiceUrl: `${appUrl}/api/bookings/${booking.id}/invoice/pdf`,
            })
            await sendEmail({ to: booking.shipper.email, ...receiptEmail })
          } catch (e) { console.error('Receipt email error:', e) }

          // Send carrier payout notification email
          try {
            const payoutEmail = carrierPayoutEmail({
              carrierName: booking.listing.carrier.name,
              trackingCode: booking.trackingCode || bookingId,
              bookingTotal: fmtMoney(booking.totalPrice),
              platformFee: fmtMoney(booking.platformFee),
              payoutAmount: fmtMoney(booking.carrierPayout),
              deliveredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            })
            await sendEmail({ to: booking.listing.carrier.email, ...payoutEmail })
          } catch (e) { console.error('Payout email error:', e) }
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
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
