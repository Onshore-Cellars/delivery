import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET a single booking
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: { carrier: { select: { id: true, name: true, company: true, avatarUrl: true, phone: true, email: true } } },
        },
        shipper: { select: { id: true, name: true, company: true, avatarUrl: true, phone: true, email: true } },
        trackingEvents: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isShipper && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — modify booking details (before pickup)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isShipper = booking.shipperId === decoded.userId
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isShipper && !isCarrier && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Only allow modifications on bookings that haven't been picked up yet
    const modifiableStatuses = ['PENDING', 'CONFIRMED', 'QUOTE_REQUESTED', 'QUOTED']
    if (!modifiableStatuses.includes(booking.status)) {
      return NextResponse.json({ error: 'Booking can only be modified before pickup' }, { status: 400 })
    }

    const body = await request.json()
    const allowedFields = [
      'pickupAddress', 'pickupContact', 'pickupPhone', 'pickupEmail',
      'deliveryAddress', 'deliveryContact', 'deliveryPhone', 'deliveryEmail',
      'deliveryNotes', 'deliveryTimeWindow',
      'yachtName', 'yachtMMSI', 'berthNumber', 'marinaName',
      'specialHandling', 'cargoDescription',
      'cargoLengthCm', 'cargoWidthCm', 'cargoHeightCm', 'cargoImages',
    ]

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field] || null
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data,
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
