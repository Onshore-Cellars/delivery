import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { BookingStatus } from '@/app/generated/prisma'

// GET user's bookings
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        shipperId: decoded.userId,
      },
      include: {
        listing: {
          include: {
            carrier: {
              select: {
                id: true,
                name: true,
                company: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching bookings' },
      { status: 500 }
    )
  }
}

// POST create a new booking
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== 'SHIPPER' && decoded.role !== 'YACHT_CLIENT')) {
      return NextResponse.json(
        { error: 'Only shippers and yacht clients can create bookings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      listingId,
      weightBooked,
      volumeBooked,
      itemDescription,
      pickupAddress,
      deliveryAddress,
    } = body

    // Validate required fields
    if (!listingId || !weightBooked || !volumeBooked || !itemDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if listing exists and has enough capacity
    const listing = await prisma.vanListing.findUnique({
      where: { id: listingId },
    })

    if (!listing || !listing.isActive) {
      return NextResponse.json(
        { error: 'Listing not found or inactive' },
        { status: 404 }
      )
    }

    if (listing.availableWeight < parseFloat(weightBooked)) {
      return NextResponse.json(
        { error: 'Insufficient weight capacity' },
        { status: 400 }
      )
    }

    if (listing.availableVolume < parseFloat(volumeBooked)) {
      return NextResponse.json(
        { error: 'Insufficient volume capacity' },
        { status: 400 }
      )
    }

    // Calculate total price
    let totalPrice = 0
    if (listing.fixedPrice) {
      totalPrice = listing.fixedPrice
    } else {
      if (listing.pricePerKg) {
        totalPrice += listing.pricePerKg * parseFloat(weightBooked)
      }
      if (listing.pricePerCubicMeter) {
        totalPrice += listing.pricePerCubicMeter * parseFloat(volumeBooked)
      }
    }

    // Create booking and update listing in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          listingId,
          shipperId: decoded.userId,
          weightBooked: parseFloat(weightBooked),
          volumeBooked: parseFloat(volumeBooked),
          itemDescription,
          pickupAddress,
          deliveryAddress,
          totalPrice,
          status: BookingStatus.PENDING,
        },
        include: {
          listing: {
            include: {
              carrier: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      })

      // Update listing capacity
      await tx.vanListing.update({
        where: { id: listingId },
        data: {
          availableWeight: listing.availableWeight - parseFloat(weightBooked),
          availableVolume: listing.availableVolume - parseFloat(volumeBooked),
        },
      })

      return newBooking
    })

    return NextResponse.json(
      { message: 'Booking created successfully', booking },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the booking' },
      { status: 500 }
    )
  }
}
