import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export const runtime = 'nodejs'

const round = (n: number) => Math.round(n * 100) / 100

// GET /api/admin/analytics — platform-wide business analytics for the admin.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const now = new Date()
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

    // Captured bookings (payment received) in the last ~12 months for trends.
    const captured = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] }, paidAt: { gte: yearAgo } },
      select: {
        totalPrice: true, vatAmount: true, platformFee: true, currency: true, paidAt: true,
        listing: { select: { originPort: true, destinationPort: true, carrierId: true, carrier: { select: { name: true, company: true } } } },
      },
    })

    // All bookings for fill/conversion metrics (lightweight).
    const [totalBookings, deliveredBookings, activeCarriers, activeListings] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'DELIVERED' } }),
      prisma.user.count({ where: { canCarry: true } }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ])

    // Monthly GMV (gross) + platform fees, last 12 months.
    const months: { month: string; gmv: number; fees: number; bookings: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      const inMonth = captured.filter(b => b.paidAt && new Date(b.paidAt).getFullYear() === d.getFullYear() && new Date(b.paidAt).getMonth() === d.getMonth())
      months.push({
        month: key,
        gmv: round(inMonth.reduce((s, b) => s + b.totalPrice + (b.vatAmount || 0), 0)),
        fees: round(inMonth.reduce((s, b) => s + b.platformFee, 0)),
        bookings: inMonth.length,
      })
    }

    // Top routes by GMV.
    const routeMap: Record<string, { count: number; gmv: number }> = {}
    for (const b of captured) {
      const r = `${b.listing.originPort} → ${b.listing.destinationPort}`
      const g = routeMap[r] || { count: 0, gmv: 0 }
      g.count++; g.gmv += b.totalPrice + (b.vatAmount || 0)
      routeMap[r] = g
    }
    const topRoutes = Object.entries(routeMap).map(([route, v]) => ({ route, count: v.count, gmv: round(v.gmv) }))
      .sort((a, b) => b.gmv - a.gmv).slice(0, 8)

    // Carrier leaderboard by GMV handled.
    const carrierMap: Record<string, { name: string; count: number; gmv: number }> = {}
    for (const b of captured) {
      const id = b.listing.carrierId
      const name = b.listing.carrier?.company || b.listing.carrier?.name || '—'
      const g = carrierMap[id] || { name, count: 0, gmv: 0 }
      g.count++; g.gmv += b.totalPrice + (b.vatAmount || 0)
      carrierMap[id] = g
    }
    const topCarriers = Object.values(carrierMap).map(v => ({ ...v, gmv: round(v.gmv) }))
      .sort((a, b) => b.gmv - a.gmv).slice(0, 8)

    const gmv12mo = round(captured.reduce((s, b) => s + b.totalPrice + (b.vatAmount || 0), 0))
    const fees12mo = round(captured.reduce((s, b) => s + b.platformFee, 0))
    const currencies = Array.from(new Set(captured.map(b => b.currency)))

    return NextResponse.json({
      headline: {
        gmv12mo, fees12mo,
        bookings12mo: captured.length,
        avgBookingValue: captured.length ? round(gmv12mo / captured.length) : 0,
        deliveryRate: totalBookings ? round((deliveredBookings / totalBookings) * 100) : 0,
        activeCarriers, activeListings, totalBookings,
        multiCurrency: currencies.length > 1,
        currencies,
      },
      months,
      topRoutes,
      topCarriers,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
