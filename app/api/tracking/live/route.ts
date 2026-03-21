import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('shareToken')

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Missing required query parameter: shareToken' },
        { status: 400 }
      )
    }

    const tracking = await prisma.liveTracking.findUnique({
      where: { shareToken },
      include: {
        booking: {
          select: {
            id: true,
            trackingCode: true,
            status: true,
            cargoDescription: true,
            pickupCity: true,
            pickupCountry: true,
            deliveryCity: true,
            deliveryCountry: true,
            yachtName: true,
            marinaName: true,
            estimatedDelivery: true,
          },
        },
      },
    })

    if (!tracking) {
      return NextResponse.json({ error: 'Tracking session not found' }, { status: 404 })
    }

    if (!tracking.isActive) {
      return NextResponse.json({ error: 'Tracking session has ended' }, { status: 410 })
    }

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Live tracking fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing required field: bookingId' },
        { status: 400 }
      )
    }

    // Verify the booking exists and the user is the carrier
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: { carrierId: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Only the carrier can start a tracking session' },
        { status: 403 }
      )
    }

    // Deactivate any existing active tracking for this booking
    await prisma.liveTracking.updateMany({
      where: { bookingId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    })

    const tracking = await prisma.liveTracking.create({
      data: {
        bookingId,
      },
    })

    return NextResponse.json({ tracking }, { status: 201 })
  } catch (error) {
    console.error('Live tracking creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, lat, lng, heading, speed, stopsCompleted, etaMinutes } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing required field: bookingId' },
        { status: 400 }
      )
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: lat and lng are required' },
        { status: 400 }
      )
    }

    // Verify the booking exists and the user is the carrier
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: { carrierId: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Only the carrier can update tracking' },
        { status: 403 }
      )
    }

    // Find the active tracking session for this booking
    const activeTracking = await prisma.liveTracking.findFirst({
      where: { bookingId, isActive: true },
    })

    if (!activeTracking) {
      return NextResponse.json(
        { error: 'No active tracking session found for this booking' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      lat: parseFloat(String(lat)),
      lng: parseFloat(String(lng)),
      heading: heading !== undefined ? parseFloat(String(heading)) : undefined,
      speed: speed !== undefined ? parseFloat(String(speed)) : undefined,
      stopsCompleted: stopsCompleted !== undefined ? parseInt(String(stopsCompleted)) : undefined,
      etaMinutes: etaMinutes !== undefined ? parseInt(String(etaMinutes)) : undefined,
      lastUpdated: new Date(),
    }

    // Recalculate ETA based on current position and destination
    // Simple formula: remaining distance / current speed
    if (body.lat && body.lng && body.speed && body.speed > 0) {
      const destBooking = await prisma.booking.findUnique({
        where: { id: activeTracking.bookingId },
        select: {
          deliveryAddress: true,
          listing: { select: { destinationLat: true, destinationLng: true } },
        },
      })

      if (destBooking?.listing?.destinationLat && destBooking?.listing?.destinationLng) {
        const R = 6371 // Earth radius km
        const dLat = (destBooking.listing.destinationLat - body.lat) * Math.PI / 180
        const dLng = (destBooking.listing.destinationLng - body.lng) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(body.lat * Math.PI / 180) *
            Math.cos(destBooking.listing.destinationLat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
        const remainingKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        // ETA in minutes (distance / speed * 60, with 1.3x factor for road vs straight line)
        const calculatedEta = Math.round((remainingKm / body.speed) * 60 * 1.3)
        updateData.etaMinutes = calculatedEta
      }
    }

    const tracking = await prisma.liveTracking.update({
      where: { id: activeTracking.id },
      data: updateData,
    })

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Live tracking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
