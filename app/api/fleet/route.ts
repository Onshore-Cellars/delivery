import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// Fleet management API — for fleet managers and carriers to see analytics
// across all their vehicles, routes, and bookings
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)
    const since = new Date()
    since.setDate(since.getDate() - periodDays)

    // Get all carrier listings and their bookings
    const [listings, bookings, vehicles, reviews] = await Promise.all([
      prisma.listing.findMany({
        where: { carrierId: decoded.userId },
        select: {
          id: true,
          title: true,
          status: true,
          originPort: true,
          destinationPort: true,
          routeDirection: true,
          totalCapacityKg: true,
          availableKg: true,
          totalCapacityM3: true,
          availableM3: true,
          departureDate: true,
          returnTotalKg: true,
          returnAvailableKg: true,
          returnTotalM3: true,
          returnAvailableM3: true,
          _count: { select: { bookings: true } },
        },
      }),
      prisma.booking.findMany({
        where: {
          listing: { carrierId: decoded.userId },
          createdAt: { gte: since },
        },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          carrierPayout: true,
          platformFee: true,
          weightKg: true,
          volumeM3: true,
          routeDirection: true,
          createdAt: true,
        },
      }),
      prisma.vehicle.findMany({
        where: { ownerId: decoded.userId },
        select: {
          id: true,
          make: true,
          model: true,
          vehicleType: true,
          maxPayloadKg: true,
          cargoVolumeM3: true,
          active: true,
          verified: true,
          insuranceExpiry: true,
          motExpiry: true,
          _count: { select: { listings: true } },
        },
      }),
      prisma.review.findMany({
        where: { targetId: decoded.userId },
        select: { rating: true, communicationRating: true, timelinessRating: true, conditionRating: true },
      }),
    ])

    // Calculate analytics
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
    const totalPayout = bookings.reduce((sum, b) => sum + b.carrierPayout, 0)
    const totalWeight = bookings.reduce((sum, b) => sum + b.weightKg, 0)
    const totalVolume = bookings.reduce((sum, b) => sum + b.volumeM3, 0)

    const outboundBookings = bookings.filter(b => b.routeDirection !== 'return')
    const returnBookings = bookings.filter(b => b.routeDirection === 'return')

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Fill rate across all active listings
    const activeListings = listings.filter(l => ['ACTIVE', 'IN_TRANSIT', 'FULL'].includes(l.status))
    const avgFillRate = activeListings.length > 0
      ? activeListings.reduce((sum, l) => {
          const used = l.totalCapacityKg - l.availableKg
          return sum + (used / l.totalCapacityKg * 100)
        }, 0) / activeListings.length
      : 0

    // Return fill rate for two-way routes
    const twoWayListings = listings.filter(l => l.routeDirection === 'BOTH' && l.returnTotalKg)
    const returnFillRate = twoWayListings.length > 0
      ? twoWayListings.reduce((sum, l) => {
          const used = (l.returnTotalKg || 0) - (l.returnAvailableKg || 0)
          return sum + (used / (l.returnTotalKg || 1) * 100)
        }, 0) / twoWayListings.length
      : 0

    // Popular routes
    const routeCounts: Record<string, number> = {}
    listings.forEach(l => {
      const route = `${l.originPort} → ${l.destinationPort}`
      routeCounts[route] = (routeCounts[route] || 0) + (l._count.bookings || 0)
    })
    const popularRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([route, count]) => ({ route, bookings: count }))

    // Vehicles needing attention (insurance/MOT expiring within 30 days)
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    const vehicleAlerts = vehicles.filter(v =>
      (v.insuranceExpiry && new Date(v.insuranceExpiry) < soon) ||
      (v.motExpiry && new Date(v.motExpiry) < soon) ||
      !v.verified
    )

    return NextResponse.json({
      period: periodDays,
      overview: {
        totalListings: listings.length,
        activeListings: activeListings.length,
        totalBookings: bookings.length,
        completedBookings: bookings.filter(b => b.status === 'DELIVERED').length,
        cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length,
        totalRevenue,
        totalPayout,
        avgFillRate: Math.round(avgFillRate),
        returnFillRate: Math.round(returnFillRate),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      },
      twoWayStats: {
        twoWayListings: twoWayListings.length,
        outboundBookings: outboundBookings.length,
        returnBookings: returnBookings.length,
        returnRevenue: returnBookings.reduce((sum, b) => sum + b.totalPrice, 0),
      },
      cargo: {
        totalWeightKg: Math.round(totalWeight),
        totalVolumeM3: Math.round(totalVolume * 10) / 10,
      },
      vehicles: {
        total: vehicles.length,
        active: vehicles.filter(v => v.active).length,
        verified: vehicles.filter(v => v.verified).length,
        alerts: vehicleAlerts.length,
      },
      popularRoutes,
    })
  } catch (error) {
    console.error('Fleet analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
