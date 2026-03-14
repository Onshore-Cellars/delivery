import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const dateFrom = searchParams.get('dateFrom')
    const minWeight = searchParams.get('minWeight')
    const minVolume = searchParams.get('minVolume')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
    }

    if (origin) {
      where.OR = [
        { originPort: { contains: origin, mode: 'insensitive' } },
        { originRegion: { contains: origin, mode: 'insensitive' } },
      ]
    }

    if (destination) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { destinationPort: { contains: destination, mode: 'insensitive' } },
            { destinationRegion: { contains: destination, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (dateFrom) {
      where.departureDate = { gte: new Date(dateFrom) }
    }

    if (minWeight) {
      where.availableKg = { gte: parseFloat(minWeight) }
    }

    if (minVolume) {
      where.availableM3 = { gte: parseFloat(minVolume) }
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          carrier: {
            select: { id: true, name: true, company: true, avatarUrl: true },
          },
          _count: { select: { bookings: true } },
        },
        orderBy: [{ featured: 'desc' }, { departureDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
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

    if (decoded.role !== 'CARRIER' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only carriers can create listings' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, description, vehicleType, vehicleName,
      originPort, originRegion, destinationPort, destinationRegion,
      departureDate, estimatedArrival,
      totalCapacityKg, totalCapacityM3,
      pricePerKg, pricePerM3, flatRate, currency,
    } = body

    if (!title || !vehicleType || !originPort || !destinationPort || !departureDate || !totalCapacityKg || !totalCapacityM3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const listing = await prisma.listing.create({
      data: {
        carrierId: decoded.userId,
        title,
        description: description || null,
        vehicleType,
        vehicleName: vehicleName || null,
        originPort,
        originRegion: originRegion || null,
        destinationPort,
        destinationRegion: destinationRegion || null,
        departureDate: new Date(departureDate),
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        totalCapacityKg: parseFloat(totalCapacityKg),
        totalCapacityM3: parseFloat(totalCapacityM3),
        availableKg: parseFloat(totalCapacityKg),
        availableM3: parseFloat(totalCapacityM3),
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerM3: pricePerM3 ? parseFloat(pricePerM3) : null,
        flatRate: flatRate ? parseFloat(flatRate) : null,
        currency: currency || 'EUR',
      },
      include: {
        carrier: {
          select: { id: true, name: true, company: true },
        },
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
