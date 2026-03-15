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

    const body = await request.json()
    const { status, location, description } = body

    const validStatuses = ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Only the carrier or the shipper (for cancellation) can update status
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isShipper && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this booking' }, { status: 403 })
    }

    if (isShipper && status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Shippers can only cancel bookings' }, { status: 403 })
    }

    const statusDescriptions: Record<string, string> = {
      CONFIRMED: 'Booking confirmed by carrier',
      PICKED_UP: 'Cargo picked up',
      IN_TRANSIT: 'Cargo in transit',
      DELIVERED: 'Cargo delivered successfully',
      CANCELLED: `Booking cancelled by ${isCarrier ? 'carrier' : 'shipper'}`,
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

    // If cancelled, restore listing capacity
    if (status === 'CANCELLED') {
      await prisma.listing.update({
        where: { id: booking.listingId },
        data: {
          availableKg: { increment: booking.weightKg },
          availableM3: { increment: booking.volumeM3 },
          status: 'ACTIVE',
        },
      })
    }

    // If delivered, complete the listing if all bookings delivered
    if (status === 'DELIVERED') {
      const remaining = await prisma.booking.count({
        where: {
          listingId: booking.listingId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] },
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
