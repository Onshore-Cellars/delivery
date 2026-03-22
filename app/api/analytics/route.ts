import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/analytics — user-facing analytics for carriers and shippers
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get user's bookings (as carrier and shipper)
    const [carrierBookings, shipperBookings, listings, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: { listing: { carrierId: decoded.userId } },
        select: {
          id: true, totalPrice: true, carrierPayout: true, platformFee: true,
          currency: true, status: true, createdAt: true, weightKg: true, volumeM3: true,
          listing: { select: { originPort: true, destinationPort: true, originCountry: true, destinationCountry: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: { shipperId: decoded.userId },
        select: {
          id: true, totalPrice: true, currency: true, status: true, createdAt: true,
          weightKg: true, volumeM3: true,
          listing: { select: { originPort: true, destinationPort: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.listing.findMany({
        where: { carrierId: decoded.userId },
        select: { id: true, status: true, viewCount: true, createdAt: true, featured: true },
      }),
      prisma.review.findMany({
        where: { targetId: decoded.userId },
        select: { rating: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ─── CARRIER ANALYTICS ──────────────────────────────────────────
    const carrierDelivered = carrierBookings.filter(b => b.status === 'DELIVERED')
    const carrierRecent30d = carrierBookings.filter(b => new Date(b.createdAt) >= thirtyDaysAgo)
    const carrierRecent90d = carrierBookings.filter(b => new Date(b.createdAt) >= ninetyDaysAgo)
    const carrierDelivered30d = carrierDelivered.filter(b => new Date(b.createdAt) >= thirtyDaysAgo)

    const totalRevenue = carrierDelivered.reduce((s, b) => s + (b.carrierPayout || 0), 0)
    const revenue30d = carrierDelivered30d.reduce((s, b) => s + (b.carrierPayout || 0), 0)
    const avgBookingValue = carrierDelivered.length > 0
      ? carrierDelivered.reduce((s, b) => s + b.totalPrice, 0) / carrierDelivered.length
      : 0

    // Monthly revenue breakdown (last 6 months)
    const monthlyRevenue: { month: string; revenue: number; bookings: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthBookings = carrierDelivered.filter(b => {
        const d = new Date(b.createdAt)
        return d >= monthStart && d <= monthEnd
      })
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        revenue: monthBookings.reduce((s, b) => s + (b.carrierPayout || 0), 0),
        bookings: monthBookings.length,
      })
    }

    // Route popularity
    const routeCounts: Record<string, { count: number; revenue: number }> = {}
    carrierBookings.forEach(b => {
      const route = `${b.listing.originPort} → ${b.listing.destinationPort}`
      if (!routeCounts[route]) routeCounts[route] = { count: 0, revenue: 0 }
      routeCounts[route].count++
      routeCounts[route].revenue += b.carrierPayout || 0
    })
    const topRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([route, data]) => ({ route, ...data }))

    // Cargo volume stats
    const totalWeightKg = carrierDelivered.reduce((s, b) => s + (b.weightKg || 0), 0)
    const totalVolumeM3 = carrierDelivered.reduce((s, b) => s + (b.volumeM3 || 0), 0)

    // Listing performance
    const activeListings = listings.filter(l => l.status === 'ACTIVE').length
    const totalViews = listings.reduce((s, l) => s + (l.viewCount || 0), 0)
    const conversionRate = totalViews > 0
      ? (carrierBookings.length / totalViews * 100)
      : 0

    // ─── SHIPPER ANALYTICS ──────────────────────────────────────────
    const shipperCompleted = shipperBookings.filter(b => b.status === 'DELIVERED')
    const totalSpent = shipperCompleted.reduce((s, b) => s + b.totalPrice, 0)
    const spent30d = shipperCompleted
      .filter(b => new Date(b.createdAt) >= thirtyDaysAgo)
      .reduce((s, b) => s + b.totalPrice, 0)

    // Monthly spending (last 6 months)
    const monthlySpending: { month: string; spent: number; shipments: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthShipments = shipperCompleted.filter(b => {
        const d = new Date(b.createdAt)
        return d >= monthStart && d <= monthEnd
      })
      monthlySpending.push({
        month: monthStart.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
        spent: monthShipments.reduce((s, b) => s + b.totalPrice, 0),
        shipments: monthShipments.length,
      })
    }

    // ─── RATING TREND ────────────────────────────────────────────────
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0
    const recent30dRating = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
    const avgRating30d = recent30dRating.length > 0
      ? recent30dRating.reduce((s, r) => s + r.rating, 0) / recent30dRating.length
      : avgRating

    // Booking status distribution
    const statusDistribution: Record<string, number> = {}
    const allBookings = [...carrierBookings, ...shipperBookings]
    allBookings.forEach(b => {
      statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1
    })

    return NextResponse.json({
      carrier: {
        totalRevenue,
        revenue30d,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        totalDeliveries: carrierDelivered.length,
        bookings30d: carrierRecent30d.length,
        bookings90d: carrierRecent90d.length,
        totalWeightKg: Math.round(totalWeightKg),
        totalVolumeM3: Math.round(totalVolumeM3 * 10) / 10,
        monthlyRevenue,
        topRoutes,
        activeListings,
        totalListings: listings.length,
        totalViews,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      shipper: {
        totalSpent,
        spent30d,
        totalShipments: shipperCompleted.length,
        activeShipments: shipperBookings.filter(b => ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'].includes(b.status)).length,
        monthlySpending,
      },
      rating: {
        average: Math.round(avgRating * 10) / 10,
        average30d: Math.round(avgRating30d * 10) / 10,
        totalReviews: reviews.length,
        trend: avgRating30d > avgRating ? 'up' : avgRating30d < avgRating ? 'down' : 'stable',
      },
      statusDistribution,
      currency: allBookings[0]?.currency || 'EUR',
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
