import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET — shows what the cancellation fee would be without actually cancelling
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Auth: shipper or carrier only
    const isShipper = booking.shipperId === decoded.userId
    const isCarrier = booking.listing.carrierId === decoded.userId

    if (!isShipper && !isCarrier) {
      return NextResponse.json({ error: 'Not authorized to view cancellation preview' }, { status: 403 })
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD']
    if (!cancellableStatuses.includes(booking.status)) {
      return NextResponse.json({ error: `Booking with status ${booking.status} cannot be cancelled` }, { status: 400 })
    }

    // Calculate cancellation fee using the same logic as status/route.ts
    let cancellationFee = 0
    let cancellationPercent = '0%'
    const departure = booking.listing.departureDate
    const hoursUntilDeparture = (departure.getTime() - Date.now()) / (1000 * 60 * 60)

    if (booking.paymentStatus === 'PAID' && booking.totalPrice > 0) {
      if (hoursUntilDeparture < 24) {
        cancellationFee = booking.totalPrice * 0.5
        cancellationPercent = '50%'
      } else if (hoursUntilDeparture < 72) {
        cancellationFee = booking.totalPrice * 0.25
        cancellationPercent = '25%'
      } else if (hoursUntilDeparture < 168) {
        cancellationFee = booking.totalPrice * 0.1
        cancellationPercent = '10%'
      }
    }

    const refundAmount = booking.paymentStatus === 'PAID'
      ? booking.totalPrice - cancellationFee
      : 0

    return NextResponse.json({
      cancellationFee: Math.round(cancellationFee * 100) / 100,
      cancellationPercent,
      hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
      refundAmount: Math.round(refundAmount * 100) / 100,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      paymentStatus: booking.paymentStatus,
    })
  } catch (error) {
    console.error('Cancel preview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
