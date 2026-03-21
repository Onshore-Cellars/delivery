import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET single listing with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        carrier: {
          select: {
            id: true, name: true, company: true, avatarUrl: true,
            bio: true, city: true, country: true,
            createdAt: true,
            receivedReviews: {
              select: { rating: true },
            },
            _count: { select: { listings: true, receivedReviews: true } },
          },
        },
        bookings: {
          select: { id: true, status: true, weightKg: true, volumeM3: true },
        },
        bids: {
          where: { status: 'PENDING' },
          select: { id: true, amount: true, createdAt: true },
          orderBy: { amount: 'desc' },
        },
        _count: { select: { bookings: true, bids: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Calculate carrier rating
    const ratings = listing.carrier.receivedReviews
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

    return NextResponse.json({
      listing: {
        ...listing,
        carrier: {
          ...listing.carrier,
          receivedReviews: undefined,
          avgRating,
          reviewCount: ratings.length,
        },
      },
    })
  } catch (error) {
    console.error('Listing detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH update listing (carrier only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const allowedFields = [
      'title', 'description', 'vehicleType', 'vehicleName',
      'hasRefrigeration', 'hasTailLift', 'hasGPS', 'insuranceValue',
      'originPort', 'originRegion', 'originCountry',
      'destinationPort', 'destinationRegion', 'destinationCountry',
      'departureDate', 'estimatedArrival',
      'totalCapacityKg', 'totalCapacityM3',
      'pricePerKg', 'pricePerM3', 'flatRate', 'currency', 'minimumCharge',
      'biddingEnabled', 'minBidPrice', 'acceptedCargo', 'restrictedItems',
    ]

    const numericFields = [
      'totalCapacityKg', 'totalCapacityM3', 'pricePerKg', 'pricePerM3',
      'flatRate', 'insuranceValue', 'minimumCharge', 'minBidPrice',
    ]

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'departureDate' || field === 'estimatedArrival') {
          data[field] = new Date(body[field])
        } else if (numericFields.includes(field)) {
          const val = body[field]
          if (val === null || val === '') {
            data[field] = null
          } else {
            const parsed = parseFloat(val)
            if (isNaN(parsed)) {
              return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 })
            }
            data[field] = parsed
          }
        } else {
          data[field] = body[field]
        }
      }
    }

    const updated = await prisma.listing.update({ where: { id }, data })
    return NextResponse.json({ listing: updated })
  } catch (error) {
    console.error('Listing update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE listing (carrier only, only if no active bookings)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: { listingId: id, status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] } },
    })
    if (activeBookings > 0) {
      return NextResponse.json({ error: 'Cannot delete listing with active bookings' }, { status: 400 })
    }

    await prisma.listing.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listing delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
