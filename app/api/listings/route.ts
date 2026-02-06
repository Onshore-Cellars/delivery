import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET all listings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minWeight = searchParams.get('minWeight')
    const minVolume = searchParams.get('minVolume')
    const carrierId = searchParams.get('carrierId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true }

    if (carrierId) {
      where.carrierId = carrierId
      delete where.isActive
    }

    if (origin) {
      where.originAddress = { contains: origin }
    }

    if (destination) {
      where.destinationAddress = { contains: destination }
    }

    if (dateFrom) {
      where.departureDate = { gte: new Date(dateFrom) }
    }

    if (dateTo && where.departureDate) {
      where.departureDate = { ...where.departureDate, lte: new Date(dateTo) }
    }

    if (minWeight) {
      where.availableWeight = { gte: parseFloat(minWeight) }
    }

    if (minVolume) {
      where.availableVolume = { gte: parseFloat(minVolume) }
    }

    const listings = await prisma.vanListing.findMany({
      where,
      include: {
        carrier: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { departureDate: 'asc' },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'An error occurred while fetching listings' }, { status: 500 })
  }
}

// POST create a new listing
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded || decoded.role !== 'CARRIER') {
      return NextResponse.json({ error: 'Only carriers can create listings' }, { status: 403 })
    }

    const body = await request.json()
    const {
      vehicleType, licensePlate, originAddress, destinationAddress,
      departureDate, arrivalDate, totalWeight, totalVolume,
      pricePerKg, pricePerCubicMeter, fixedPrice,
    } = body

    if (!vehicleType || !originAddress || !destinationAddress || !departureDate || !totalWeight || !totalVolume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const listing = await prisma.vanListing.create({
      data: {
        carrierId: decoded.userId,
        vehicleType,
        licensePlate: licensePlate || null,
        originAddress,
        destinationAddress,
        departureDate: new Date(departureDate),
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        totalWeight: parseFloat(totalWeight),
        totalVolume: parseFloat(totalVolume),
        availableWeight: parseFloat(totalWeight),
        availableVolume: parseFloat(totalVolume),
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerCubicMeter: pricePerCubicMeter ? parseFloat(pricePerCubicMeter) : null,
        fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
      },
      include: {
        carrier: { select: { id: true, name: true, company: true, email: true, phone: true } },
      },
    })

    return NextResponse.json({ message: 'Listing created successfully', listing }, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'An error occurred while creating the listing' }, { status: 500 })
  }
}

// PATCH update a listing
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { id, isActive } = body

    if (!id) return NextResponse.json({ error: 'Listing id is required' }, { status: 400 })

    const listing = await prisma.vanListing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updated = await prisma.vanListing.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : listing.isActive },
    })

    return NextResponse.json({ listing: updated })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE a listing
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Listing id is required' }, { status: 400 })

    const listing = await prisma.vanListing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    if (listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.vanListing.delete({ where: { id } })
    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
