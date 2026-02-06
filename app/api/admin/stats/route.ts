import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [
      totalUsers, totalCarriers, totalCustomers,
      totalListings, activeListings,
      totalBookings, pendingBookings, confirmedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CARRIER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.vanListing.count(),
      prisma.vanListing.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } }),
    ])

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      include: {
        listing: {
          select: {
            originAddress: true,
            destinationAddress: true,
            carrier: { select: { name: true, company: true } },
          },
        },
        shipper: { select: { name: true, company: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      stats: {
        users: { total: totalUsers, carriers: totalCarriers, customers: totalCustomers },
        listings: { total: totalListings, active: activeListings },
        bookings: { total: totalBookings, pending: pendingBookings, confirmed: confirmedBookings },
        revenue: { total: totalRevenue._sum.totalPrice || 0 },
      },
      recentBookings,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'An error occurred while fetching statistics' }, { status: 500 })
  }
}
