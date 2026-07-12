import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createCheckoutSession, calculatePlatformFee, calculateCarrierPayout } from '@/lib/stripe'
import { snapshotBookingVat } from '@/lib/vat'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const checkoutLimiter = createRateLimiter({ interval: 15 * 60_000, limit: 10 })

export async function POST(request: NextRequest) {
  try {
    // Rate limit checkout
    const ip = getClientIP(request)
    const rl = await checkoutLimiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 })
    }

    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        shipper: { select: { email: true, name: true, country: true, vatNumber: true, vatNumberValid: true, isBusiness: true } },
        listing: {
          select: {
            title: true,
            originPort: true,
            destinationPort: true,
            carrier: { select: { stripeAccountId: true } },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.shipperId !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PROCESSING') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    if (['CANCELLED', 'DISPUTED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot pay for a cancelled or disputed booking' }, { status: 400 })
    }

    // Enforce checkout expiry — prevent payment for expired bookings
    if (booking.checkoutExpiresAt && new Date(booking.checkoutExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'This booking has expired. Please create a new booking.' }, { status: 400 })
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Determine VAT for this supply (platform → shipper). net = booking.totalPrice.
    const vat = snapshotBookingVat(booking.totalPrice, {
      country: booking.shipper.country,
      vatNumber: booking.shipper.vatNumber,
      vatValid: booking.shipper.vatNumberValid,
      isBusiness: booking.shipper.isBusiness,
    })

    const session = await createCheckoutSession({
      bookingId: booking.id,
      amount: booking.totalPrice,
      currency: booking.currency,
      customerEmail: booking.shipper.email,
      customerName: booking.shipper.name,
      description: `Shipment: ${booking.listing.title}`,
      origin: booking.listing.originPort,
      destination: booking.listing.destinationPort,
      successUrl: `${appUrl}/dashboard?payment=success&booking=${booking.id}`,
      cancelUrl: `${appUrl}/dashboard?payment=cancelled&booking=${booking.id}`,
      carrierStripeAccountId: booking.listing.carrier.stripeAccountId || undefined,
      vatAmount: vat.vatAmount,
      vatRate: vat.vatRate,
    })

    // Update booking with payment info. Note: session.payment_intent is null at
    // session-creation time for mode:'payment' — the checkout.session.completed
    // webhook populates stripePaymentIntentId once the customer actually pays.
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentId: session.id,
        paymentStatus: 'PROCESSING',
        platformFee: calculatePlatformFee(booking.totalPrice),
        carrierPayout: calculateCarrierPayout(booking.totalPrice),
        // Persist the VAT snapshot so the invoice is stable regardless of later changes.
        vatAmount: vat.vatAmount,
        vatRate: vat.vatRate,
        vatTreatment: vat.treatment,
        vatNote: vat.note,
        vatSupplierNumber: vat.vatSupplierNumber,
        vatCustomerNumber: vat.vatCustomerNumber,
        vatCustomerCountry: vat.vatCustomerCountry,
      },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
