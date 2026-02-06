import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET user's bookings (or carrier's bookings on their listings)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {}

    if (decoded.role === 'CARRIER') {
      where = { listing: { carrierId: decoded.userId } }
    } else if (decoded.role === 'ADMIN') {
      where = {}
    } else {
      where = { shipperId: decoded.userId }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          include: {
            carrier: { select: { id: true, name: true, company: true, email: true, phone: true } },
          },
        },
        shipper: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'An error occurred while fetching bookings' }, { status: 500 })
  }
}

// POST create a new booking
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded || decoded.role === 'CARRIER') {
      return NextResponse.json({ error: 'Carriers cannot book. Sign up as a Customer.' }, { status: 403 })
    }

    const body = await request.json()
    const { listingId, weightBooked, volumeBooked, itemDescription, pickupAddress, deliveryAddress } = body

    if (!listingId || !weightBooked || !volumeBooked || !itemDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const listing = await prisma.vanListing.findUnique({ where: { id: listingId } })

    if (!listing || !listing.isActive) {
      return NextResponse.json({ error: 'Listing not found or inactive' }, { status: 404 })
    }

    const weight = parseFloat(weightBooked)
    const volume = parseFloat(volumeBooked)

    if (listing.availableWeight < weight) {
      return NextResponse.json({ error: 'Insufficient weight capacity' }, { status: 400 })
    }
    if (listing.availableVolume < volume) {
      return NextResponse.json({ error: 'Insufficient volume capacity' }, { status: 400 })
    }

    let totalPrice = 0
    if (listing.fixedPrice) {
      totalPrice = listing.fixedPrice
    } else {
      if (listing.pricePerKg) totalPrice += listing.pricePerKg * weight
      if (listing.pricePerCubicMeter) totalPrice += listing.pricePerCubicMeter * volume
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          listingId,
          shipperId: decoded.userId,
          weightBooked: weight,
          volumeBooked: volume,
          itemDescription,
          pickupAddress: pickupAddress || listing.originAddress,
          deliveryAddress: deliveryAddress || listing.destinationAddress,
          totalPrice,
          status: 'PENDING',
        },
        include: {
          listing: {
            include: {
              carrier: { select: { id: true, name: true, company: true, email: true, phone: true } },
            },
          },
        },
      })

      await tx.vanListing.update({
        where: { id: listingId },
        data: {
          availableWeight: listing.availableWeight - weight,
          availableVolume: listing.availableVolume - volume,
        },
      })

      return newBooking
    })

    return NextResponse.json({ message: 'Booking created successfully', booking }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'An error occurred while creating the booking' }, { status: 500 })
  }
}

// PATCH update booking status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { id, status } = body

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Valid booking id and status required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrierId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'
    const isCustomer = booking.shipperId === decoded.userId

    if (!isCarrier && !isAdmin && !isCustomer) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (isCustomer && !isCarrier && !isAdmin && status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Customers can only cancel bookings' }, { status: 403 })
    }

    // If cancelling, restore capacity
    if (status === 'CANCELLED' && booking.status !== 'CANCELLED') {
      await prisma.vanListing.update({
        where: { id: booking.listingId },
        data: {
          availableWeight: booking.listing.availableWeight + booking.weightBooked,
          availableVolume: booking.listing.availableVolume + booking.volumeBooked,
        },
      })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        listing: {
          include: { carrier: { select: { id: true, name: true, company: true } } },
        },
        shipper: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
