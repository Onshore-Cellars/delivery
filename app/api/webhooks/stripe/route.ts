import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'

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
            },
            include: {
              shipper: { select: { id: true, name: true } },
              listing: { select: { carrierId: true, title: true } },
            },
          })

          // Notify both parties
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
