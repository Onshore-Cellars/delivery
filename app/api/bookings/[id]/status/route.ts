import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { notifyStatusUpdate } from '@/lib/notifications'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { status, location, description } = body

    const validStatuses = ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED', 'CANCELLED', 'DISPUTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      QUOTE_REQUESTED: ['QUOTED', 'CANCELLED'],
      QUOTED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PICKED_UP', 'CANCELLED', 'DISPUTED'],
      PICKED_UP: ['IN_TRANSIT', 'CANCELLED', 'DISPUTED'],
      IN_TRANSIT: ['CUSTOMS_HOLD', 'DELIVERED', 'CANCELLED', 'DISPUTED'],
      CUSTOMS_HOLD: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISPUTED'],
      DELIVERED: ['DISPUTED'],
      CANCELLED: [],
      DISPUTED: ['CANCELLED', 'DELIVERED'], // Resolve dispute by cancelling or confirming delivery
    }
    const allowed = validTransitions[booking.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${booking.status} to ${status}` }, { status: 400 })
    }

    // Only the carrier or the shipper (for cancellation/dispute) can update status
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isShipper && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this booking' }, { status: 403 })
    }

    // Shippers can only cancel or dispute
    if (isShipper && !['CANCELLED', 'DISPUTED'].includes(status)) {
      return NextResponse.json({ error: 'Shippers can only cancel or dispute bookings' }, { status: 403 })
    }

    // Require payment before confirmation (unless admin overrides)
    if (status === 'CONFIRMED' && booking.paymentStatus !== 'PAID' && !isAdmin) {
      return NextResponse.json({ error: 'Payment required before confirming booking' }, { status: 400 })
    }

    const statusDescriptions: Record<string, string> = {
      CONFIRMED: 'Booking confirmed by carrier',
      PICKED_UP: 'Cargo picked up',
      IN_TRANSIT: 'Cargo in transit',
      CUSTOMS_HOLD: 'Cargo held at customs',
      DELIVERED: 'Cargo delivered successfully',
      CANCELLED: `Booking cancelled by ${isCarrier ? 'carrier' : isAdmin ? 'admin' : 'shipper'}`,
      DISPUTED: `Dispute raised by ${isShipper ? 'shipper' : isCarrier ? 'carrier' : 'admin'}`,
    }

    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status },
      }),
      prisma.trackingEvent.create({
        data: {
          bookingId: id,
          status,
          location: location || null,
          description: description || statusDescriptions[status],
        },
      }),
    ])

    // If cancelled, restore listing capacity with cancellation fee logic
    if (status === 'CANCELLED') {
      const isReturnLeg = booking.routeDirection === 'return'

      // Calculate cancellation fee based on time until departure
      let cancellationFee = 0
      let cancellationPercent = ''
      if (booking.paymentStatus === 'PAID' && booking.totalPrice > 0) {
        const departure = booking.listing.departureDate
        const hoursUntilDeparture = (departure.getTime() - Date.now()) / (1000 * 60 * 60)
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

      // Restore capacity
      if (isReturnLeg) {
        const updateData: Record<string, unknown> = {
          returnAvailableKg: { increment: booking.weightKg },
          returnAvailableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      } else {
        const updateData: Record<string, unknown> = {
          availableKg: { increment: booking.weightKg },
          availableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      }

      // Record cancellation fee as a tracking event (don't overwrite platformFee)
      if (cancellationFee > 0) {
        await prisma.trackingEvent.create({
          data: {
            bookingId: id,
            status: 'CANCELLED',
            description: `Cancellation fee: €${cancellationFee.toFixed(2)} (${cancellationPercent} of booking total)`,
          },
        })
      }
    }

    // If delivered, complete the listing if all bookings delivered
    if (status === 'DELIVERED') {
      const remaining = await prisma.booking.count({
        where: {
          listingId: booking.listingId,
          status: { notIn: ['DELIVERED', 'CANCELLED', 'QUOTE_REQUESTED', 'QUOTED'] },
        },
      })
      if (remaining === 0) {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: 'COMPLETED' },
        })
      }
    }

    // Send notification
    try {
      await notifyStatusUpdate({
        bookingId: id,
        status,
        description: description || statusDescriptions[status],
        location,
      })
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
