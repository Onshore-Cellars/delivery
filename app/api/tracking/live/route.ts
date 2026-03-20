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

    const tracking = await prisma.liveTracking.update({
      where: { id: activeTracking.id },
      data: {
        lat: parseFloat(String(lat)),
        lng: parseFloat(String(lng)),
        heading: heading !== undefined ? parseFloat(String(heading)) : undefined,
        speed: speed !== undefined ? parseFloat(String(speed)) : undefined,
        stopsCompleted: stopsCompleted !== undefined ? parseInt(String(stopsCompleted)) : undefined,
        etaMinutes: etaMinutes !== undefined ? parseInt(String(etaMinutes)) : undefined,
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Live tracking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
