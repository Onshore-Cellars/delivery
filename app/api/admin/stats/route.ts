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
      crew,
      totalListings,
      activeListings,
      twoWayListings,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      inTransitBookings,
      deliveredBookings,
      cancelledBookings,
      revenueResult,
      platformFeeResult,
      pendingDocs,
      totalVehicles,
      recentBookings,
      recentUsers,
      mmsiBookings,
      returnBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CARRIER' } }),
      prisma.user.count({ where: { role: 'SUPPLIER' } }),
      prisma.user.count({ where: { role: 'YACHT_OWNER' } }),
      prisma.user.count({ where: { role: 'CREW' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { routeDirection: 'BOTH' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.booking.count({ where: { status: 'DELIVERED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } }),
      prisma.booking.aggregate({ _sum: { platformFee: true } }),
      prisma.document.count({ where: { status: 'PENDING' } }),
      prisma.vehicle.count(),
      prisma.booking.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: { select: { name: true, company: true, email: true } },
          listing: {
            select: {
              title: true,
              originPort: true,
              destinationPort: true,
              routeDirection: true,
              carrier: { select: { name: true, company: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, company: true, verified: true, createdAt: true },
      }),
      prisma.booking.count({ where: { yachtMMSI: { not: null } } }),
      prisma.booking.count({ where: { routeDirection: 'return' } }),
    ])

    return NextResponse.json({
      stats: {
        users: { total: totalUsers, carriers, suppliers, yachtOwners, crew },
        listings: { total: totalListings, active: activeListings, twoWay: twoWayListings },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          inTransit: inTransitBookings,
          delivered: deliveredBookings,
          cancelled: cancelledBookings,
          withMMSI: mmsiBookings,
          returnLegs: returnBookings,
        },
        revenue: {
          total: revenueResult._sum.totalPrice || 0,
          platformFees: platformFeeResult._sum.platformFee || 0,
        },
        documents: { pending: pendingDocs },
        vehicles: { total: totalVehicles },
      },
      recentBookings,
      recentUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
