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

    // Core stats — these use only columns from the init migration
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
      inTransitBookings,
      deliveredBookings,
      cancelledBookings,
      revenueResult,
      platformFeeResult,
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
      prisma.booking.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.booking.count({ where: { status: 'DELIVERED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } }),
      prisma.booking.aggregate({ _sum: { platformFee: true } }),
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
    ])

    // Extended stats — these use columns/tables from the second migration
    // Wrapped in try/catch so the admin page still loads if migration hasn't run
    let crew = 0
    let twoWayListings = 0
    let pendingDocs = 0
    let totalVehicles = 0
    let mmsiBookings = 0
    let returnBookings = 0

    try {
      const extendedResults = await Promise.all([
        prisma.user.count({ where: { role: 'CREW' } }),
        prisma.listing.count({ where: { routeDirection: 'BOTH' } }),
        prisma.document.count({ where: { status: 'PENDING' } }),
        prisma.vehicle.count(),
        prisma.booking.count({ where: { yachtMMSI: { not: null } } }),
        prisma.booking.count({ where: { routeDirection: 'return' } }),
      ])
      crew = extendedResults[0]
      twoWayListings = extendedResults[1]
      pendingDocs = extendedResults[2]
      totalVehicles = extendedResults[3]
      mmsiBookings = extendedResults[4]
      returnBookings = extendedResults[5]
    } catch {
      // Migration hasn't run yet — extended stats will be 0
    }

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
