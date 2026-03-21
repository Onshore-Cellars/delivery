import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// GET: Get active route for a driver (all their in-transit bookings with tracking)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Get all active listings for this carrier with confirmed/in-transit bookings
    const listings = await prisma.listing.findMany({
      where: {
        carrierId: decoded.userId,
        status: { in: ['ACTIVE', 'IN_TRANSIT'] },
      },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] } },
          select: {
            id: true,
            trackingCode: true,
            status: true,
            cargoDescription: true,
            weightKg: true,
            volumeM3: true,
            deliveryAddress: true,
            deliveryCity: true,
            yachtName: true,
            yachtMMSI: true,
            marinaName: true,
            berthNumber: true,
            pickupAddress: true,
            pickupCity: true,
            deliveryTimeWindow: true,
            routeDirection: true,
            shipper: {
              select: { id: true, name: true, phone: true },
            },
            liveTracking: {
              where: { isActive: true },
              select: {
                id: true,
                shareToken: true,
                lat: true,
                lng: true,
                heading: true,
                speed: true,
                etaMinutes: true,
                stopsTotal: true,
                stopsCompleted: true,
                lastUpdated: true,
              },
            },
          },
        },
      },
    })

    // Flatten into active route stops
    const stops = listings.flatMap(listing =>
      listing.bookings.map(booking => ({
        ...booking,
        listingId: listing.id,
        listingTitle: listing.title,
        originPort: listing.originPort,
        destinationPort: listing.destinationPort,
        departureDate: listing.departureDate,
        routeDirection: booking.routeDirection || listing.routeDirection,
      }))
    )

    return NextResponse.json({ stops, listingsCount: listings.length })
  } catch (error) {
    console.error('Active route fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Start a route — driver activates tracking for a listing
// This creates live tracking for all confirmed bookings on that listing
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Missing required field: listingId' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] } },
          include: {
            shipper: { select: { id: true, name: true, email: true, phone: true, smsNotifications: true, emailNotifications: true } },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.carrierId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the carrier can start a route' }, { status: 403 })
    }

    // Update listing status to IN_TRANSIT
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'IN_TRANSIT' },
    })

    // Create tracking sessions for all confirmed bookings
    const trackingSessions = []
    for (const booking of listing.bookings) {
      // Deactivate existing sessions
      await prisma.liveTracking.updateMany({
        where: { bookingId: booking.id, isActive: true },
        data: { isActive: false, endedAt: new Date() },
      })

      // Create new tracking session
      const session = await prisma.liveTracking.create({
        data: {
          bookingId: booking.id,
          stopsTotal: listing.bookings.length,
        },
      })
      trackingSessions.push(session)

      // Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'IN_TRANSIT' },
      })

      // Add tracking event
      await prisma.trackingEvent.create({
        data: {
          bookingId: booking.id,
          status: 'IN_TRANSIT',
          description: 'Driver has started the route. Live tracking is now active.',
        },
      })

      // Notify the shipper
      await createNotification({
        userId: booking.shipper.id,
        type: 'ROUTE_STARTED',
        title: 'Driver En Route',
        message: `Your delivery is on the way! Track live: ${booking.trackingCode}`,
        linkUrl: `/tracking?code=${booking.trackingCode}`,
        metadata: { shareToken: session.shareToken, trackingCode: booking.trackingCode },
      })
    }

    return NextResponse.json({
      message: 'Route started',
      trackingSessions,
      bookingsActivated: listing.bookings.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Route start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
