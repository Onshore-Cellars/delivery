import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateAdminInsights } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersThisWeek,
      activeListings,
      bookingsThisWeek,
      bookingsLastWeek,
      revenueThisWeekResult,
      revenueLastWeekResult,
      topRoutesRaw,
      openDisputes,
      avgRatingResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.listing.groupBy({
        by: ['originPort', 'destinationPort'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ])

    const revenueThisWeek = revenueThisWeekResult._sum.totalPrice ?? 0
    const revenueLastWeek = revenueLastWeekResult._sum.totalPrice ?? 0

    const topRoutes = topRoutesRaw.map((r) => ({
      origin: r.originPort,
      destination: r.destinationPort,
      count: r._count.id,
    }))

    const avgRating = avgRatingResult._avg.rating ?? 0

    const stats = {
      totalUsers,
      newUsersThisWeek,
      activeListings,
      bookingsThisWeek,
      bookingsLastWeek,
      revenueThisWeek,
      revenueLastWeek,
      topRoutes,
      openDisputes,
      avgRating,
    }

    const insights = await generateAdminInsights(stats)

    if (!insights) {
      return NextResponse.json({ error: 'Could not generate insights' }, { status: 500 })
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Admin insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
