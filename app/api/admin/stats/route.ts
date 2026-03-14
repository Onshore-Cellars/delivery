import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [
      totalUsers,
      carriers,
      suppliers,
      yachtOwners,
      totalListings,
      activeListings,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      revenueResult,
      recentBookings,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CARRIER' } }),
      prisma.user.count({ where: { role: 'SUPPLIER' } }),
      prisma.user.count({ where: { role: 'YACHT_OWNER' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: { select: { name: true, company: true } },
          listing: { select: { title: true, originPort: true, destinationPort: true } },
        },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, company: true, createdAt: true },
      }),
    ])

    return NextResponse.json({
      stats: {
        users: { total: totalUsers, carriers, suppliers, yachtOwners },
        listings: { total: totalListings, active: activeListings },
        bookings: { total: totalBookings, pending: pendingBookings, confirmed: confirmedBookings },
        revenue: { total: revenueResult._sum.totalPrice || 0 },
      },
      recentBookings,
      recentUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
