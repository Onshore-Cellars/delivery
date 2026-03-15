import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
            carrier: { select: { name: true, company: true } },
          },
        },
        shipper: { select: { name: true, company: true } },
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
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
        deliveryAddress: booking.deliveryAddress,
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
