import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createRefund } from '@/lib/stripe'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Admin only
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { reason, amount } = body as { reason?: string; amount?: number }

    // Look up booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        shipper: { select: { id: true, name: true, email: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.stripePaymentIntentId) {
      return NextResponse.json({ error: 'No payment intent found for this booking' }, { status: 400 })
    }

    if (booking.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Booking payment status is not PAID' }, { status: 400 })
    }

    // Validate partial refund amount
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Refund amount must be a positive number' }, { status: 400 })
      }
      if (amount > booking.totalPrice) {
        return NextResponse.json({ error: 'Refund amount cannot exceed booking total' }, { status: 400 })
      }
    }

    // Call Stripe refund
    await createRefund(booking.stripePaymentIntentId, amount)

    const isPartial = amount !== undefined && amount < booking.totalPrice
    const refundAmount = amount ?? booking.totalPrice

    // Update booking payment status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: isPartial ? 'PROCESSING' : 'REFUNDED',
      },
      include: {
        shipper: { select: { id: true, name: true, email: true } },
        listing: {
          select: {
            title: true,
            originPort: true,
            destinationPort: true,
            carrierId: true,
            carrier: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    // Notify shipper
    await createNotification({
      userId: booking.shipperId,
      type: 'PAYMENT_RECEIVED',
      title: 'Refund Processed',
      message: `Refund of \u20AC${refundAmount.toFixed(2)} processed for booking ${booking.trackingCode || id}`,
      linkUrl: `/tracking?code=${booking.trackingCode}`,
    })

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        bookingId: id,
        status: updatedBooking.status,
        description: `Refund processed${reason ? `: ${reason}` : ''}`,
      },
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
