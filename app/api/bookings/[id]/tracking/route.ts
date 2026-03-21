import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Allow tracking by booking ID or tracking code
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { trackingCode: id }],
      },
      include: {
        listing: {
          select: {
            title: true,
            originPort: true,
            destinationPort: true,
            departureDate: true,
            estimatedArrival: true,
            carrierId: true,
            carrier: { select: { name: true, company: true } },
          },
        },
        shipper: { select: { id: true, name: true, company: true } },
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // If looked up by tracking code, allow public access (limited info)
    // If looked up by booking ID, require auth
    const isTrackingCodeLookup = booking.trackingCode === id

    if (!isTrackingCodeLookup) {
      const token = getTokenFromHeader(request.headers.get('authorization'))
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const decoded = verifyToken(token)
      if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

      const isCarrier = booking.listing.carrierId === decoded.userId
      const isShipper = booking.shipper.id === decoded.userId
      if (!isCarrier && !isShipper && decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        trackingCode: booking.trackingCode,
        status: booking.status,
        cargoDescription: booking.cargoDescription,
        cargoType: booking.cargoType,
        weightKg: booking.weightKg,
        volumeM3: booking.volumeM3,
        // Only expose delivery address to authenticated users
        ...(isTrackingCodeLookup ? {} : { deliveryAddress: booking.deliveryAddress }),
        createdAt: booking.createdAt,
      },
      route: {
        origin: booking.listing.originPort,
        destination: booking.listing.destinationPort,
        departure: booking.listing.departureDate,
        estimatedArrival: booking.listing.estimatedArrival,
        carrier: booking.listing.carrier,
      },
      events: booking.trackingEvents,
    })
  } catch (error) {
    console.error('Tracking fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
