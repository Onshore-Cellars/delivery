import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateTrackingCode } from '@/lib/auth'
import { notifyBookingCreated } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (decoded.role === 'CARRIER') {
      where.listing = { carrierId: decoded.userId }
    } else {
      where.shipperId = decoded.userId
    }

    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          include: {
            carrier: { select: { id: true, name: true, company: true } },
          },
        },
        shipper: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Bookings fetch error:', error)
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
    const {
      listingId, cargoDescription, cargoType, weightKg, volumeM3,
      specialHandling, pickupAddress, pickupContact,
      deliveryAddress, deliveryContact, deliveryNotes,
    } = body

    if (!listingId || !cargoDescription || !weightKg || !volumeM3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing not found or no longer available' }, { status: 404 })
    }

    if (listing.carrierId === decoded.userId) {
      return NextResponse.json({ error: 'You cannot book your own listing' }, { status: 400 })
    }

    const weight = parseFloat(weightKg)
    const volume = parseFloat(volumeM3)

    if (weight > listing.availableKg || volume > listing.availableM3) {
      return NextResponse.json({ error: 'Requested capacity exceeds available space' }, { status: 400 })
    }

    let totalPrice = 0
    if (listing.flatRate) {
      totalPrice = listing.flatRate
    } else {
      if (listing.pricePerKg) totalPrice += weight * listing.pricePerKg
      if (listing.pricePerM3) totalPrice += volume * listing.pricePerM3
    }

    const trackingCode = generateTrackingCode()

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          listingId,
          shipperId: decoded.userId,
          cargoDescription,
          cargoType: cargoType || null,
          weightKg: weight,
          volumeM3: volume,
          specialHandling: specialHandling || null,
          pickupAddress: pickupAddress || null,
          pickupContact: pickupContact || null,
          deliveryAddress: deliveryAddress || null,
          deliveryContact: deliveryContact || null,
          deliveryNotes: deliveryNotes || null,
          totalPrice,
          trackingCode,
          currency: listing.currency,
        },
        include: {
          listing: {
            include: {
              carrier: { select: { id: true, name: true, company: true } },
            },
          },
        },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: {
          availableKg: { decrement: weight },
          availableM3: { decrement: volume },
        },
      }),
    ])

    const updatedListing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (updatedListing && (updatedListing.availableKg <= 0 || updatedListing.availableM3 <= 0)) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'FULL' },
      })
    }

    // Send notifications
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          shipper: { select: { id: true, name: true, email: true, emailNotifications: true } },
          listing: {
            include: {
              carrier: { select: { id: true, name: true, email: true, emailNotifications: true } },
            },
          },
        },
      })
      if (fullBooking) {
        await notifyBookingCreated({
          id: fullBooking.id,
          trackingCode: fullBooking.trackingCode || trackingCode,
          cargoDescription: fullBooking.cargoDescription,
          totalPrice: fullBooking.totalPrice,
          currency: fullBooking.currency,
          shipperId: fullBooking.shipperId,
          listing: {
            title: fullBooking.listing.title,
            originPort: fullBooking.listing.originPort,
            destinationPort: fullBooking.listing.destinationPort,
            departureDate: fullBooking.listing.departureDate,
            carrierId: fullBooking.listing.carrierId,
            carrier: fullBooking.listing.carrier,
          },
          shipper: fullBooking.shipper,
        })
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
