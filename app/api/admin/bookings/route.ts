import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET: Full booking list with all details for admin
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          shipper: {
            select: { id: true, name: true, email: true, phone: true, company: true, yachtName: true, yachtMMSI: true },
          },
          listing: {
            include: {
              carrier: { select: { id: true, name: true, email: true, phone: true, company: true } },
            },
          },
          liveTracking: {
            where: { isActive: true },
            select: { id: true, shareToken: true, lat: true, lng: true, speed: true, etaMinutes: true, lastUpdated: true },
          },
          trackingEvents: {
            orderBy: { timestamp: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Admin can update any booking field
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { bookingId, updates } = body

    if (!bookingId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'bookingId and updates object required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const allowed = [
      'status', 'paymentStatus', 'cargoDescription', 'cargoType', 'weightKg', 'volumeM3',
      'itemCount', 'declaredValue', 'specialHandling', 'temperatureReq', 'isFragile', 'isDangerous',
      'customsRequired', 'pickupAddress', 'pickupContact', 'pickupPhone', 'pickupEmail',
      'deliveryAddress', 'deliveryContact', 'deliveryPhone', 'deliveryEmail', 'deliveryNotes',
      'deliveryTimeWindow', 'yachtName', 'yachtMMSI', 'berthNumber', 'marinaName',
      'totalPrice', 'platformFee', 'carrierPayout', 'estimatedDelivery', 'adminNotes',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) {
        updateData[key] = updates[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        shipper: { select: { id: true, name: true, email: true, company: true } },
        listing: { select: { title: true, originPort: true, destinationPort: true } },
      },
    })

    return NextResponse.json({ booking: updated, message: 'Booking updated successfully' })
  } catch (error) {
    console.error('Admin booking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
