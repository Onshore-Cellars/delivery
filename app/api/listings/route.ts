import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

interface ListingFilter {
  isActive: boolean
  originAddress?: {
    contains: string
    mode: 'insensitive'
  }
  destinationAddress?: {
    contains: string
    mode: 'insensitive'
  }
  departureDate?: {
    gte?: Date
    lte?: Date
  }
  availableWeight?: {
    gte: number
  }
  availableVolume?: {
    gte: number
  }
}

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

    const where: ListingFilter = {
      isActive: true,
    }

    if (origin) {
      where.originAddress = {
        contains: origin,
        mode: 'insensitive',
      }
    }

    if (destination) {
      where.destinationAddress = {
        contains: destination,
        mode: 'insensitive',
      }
    }

    if (dateFrom) {
      where.departureDate = {
        gte: new Date(dateFrom),
      }
    }

    if (dateTo && where.departureDate) {
      where.departureDate = {
        ...where.departureDate,
        lte: new Date(dateTo),
      }
    }

    if (minWeight) {
      where.availableWeight = {
        gte: parseFloat(minWeight),
      }
    }

    if (minVolume) {
      where.availableVolume = {
        gte: parseFloat(minVolume),
      }
    }

    const listings = await prisma.vanListing.findMany({
      where,
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
      orderBy: {
        departureDate: 'asc',
      },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching listings' },
      { status: 500 }
    )
  }
}

// POST create a new listing
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

    if (!decoded || decoded.role !== 'CARRIER') {
      return NextResponse.json(
        { error: 'Only carriers can create listings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      vehicleType,
      licensePlate,
      originAddress,
      destinationAddress,
      departureDate,
      arrivalDate,
      totalWeight,
      totalVolume,
      availableWeight,
      availableVolume,
      pricePerKg,
      pricePerCubicMeter,
      fixedPrice,
    } = body

    // Validate required fields
    if (
      !vehicleType ||
      !originAddress ||
      !destinationAddress ||
      !departureDate ||
      !totalWeight ||
      !totalVolume ||
      availableWeight === undefined ||
      availableVolume === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create listing
    const listing = await prisma.vanListing.create({
      data: {
        carrierId: decoded.userId,
        vehicleType,
        licensePlate,
        originAddress,
        destinationAddress,
        departureDate: new Date(departureDate),
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        totalWeight: parseFloat(totalWeight),
        totalVolume: parseFloat(totalVolume),
        availableWeight: parseFloat(availableWeight),
        availableVolume: parseFloat(availableVolume),
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerCubicMeter: pricePerCubicMeter ? parseFloat(pricePerCubicMeter) : null,
        fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
      },
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
    })

    return NextResponse.json(
      { message: 'Listing created successfully', listing },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the listing' },
      { status: 500 }
    )
  }
}
