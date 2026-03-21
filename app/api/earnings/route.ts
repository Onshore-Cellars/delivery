import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET — returns carrier's earnings summary
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

    if (decoded.role !== 'CARRIER') {
      return NextResponse.json({ error: 'Carrier access required' }, { status: 403 })
    }

    // Get all bookings for this carrier's listings
    const [deliveredEarnings, pendingEarnings, recentBookings] = await Promise.all([
      // Total earnings from DELIVERED bookings (completed payouts)
      prisma.booking.aggregate({
        where: {
          listing: { carrierId: decoded.userId },
          status: 'DELIVERED',
        },
        _sum: { carrierPayout: true },
        _count: true,
      }),
      // Pending payouts from CONFIRMED/IN_TRANSIT bookings
      prisma.booking.aggregate({
        where: {
          listing: { carrierId: decoded.userId },
          status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD'] },
        },
        _sum: { carrierPayout: true },
        _count: true,
      }),
      // Recent bookings with earnings details
      prisma.booking.findMany({
        where: {
          listing: { carrierId: decoded.userId },
          status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED'] },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          trackingCode: true,
          cargoDescription: true,
          status: true,
          totalPrice: true,
          carrierPayout: true,
          platformFee: true,
          currency: true,
          paymentStatus: true,
          createdAt: true,
          actualDelivery: true,
          listing: {
            select: {
              title: true,
              originPort: true,
              destinationPort: true,
            },
          },
          shipper: {
            select: { name: true, company: true },
          },
        },
      }),
    ])

    const totalEarnings = deliveredEarnings._sum.carrierPayout || 0
    const pendingPayouts = pendingEarnings._sum.carrierPayout || 0
    const completedPayouts = totalEarnings

    return NextResponse.json({
      totalEarnings,
      pendingPayouts,
      completedPayouts,
      completedCount: deliveredEarnings._count,
      pendingCount: pendingEarnings._count,
      recentBookings,
    })
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
