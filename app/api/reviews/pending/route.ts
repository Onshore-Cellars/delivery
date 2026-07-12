import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/reviews/pending — the current user's delivered bookings that they
// haven't reviewed yet (shipper → carrier), so we can prompt for a review.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const bookings = await prisma.booking.findMany({
      where: {
        shipperId: decoded.userId,
        status: 'DELIVERED',
        review: null, // no review linked yet
      },
      select: {
        id: true, trackingCode: true,
        listing: { select: { originPort: true, destinationPort: true, carrier: { select: { name: true, company: true } } } },
        actualDelivery: true,
      },
      orderBy: { actualDelivery: 'desc' },
      take: 20,
    })

    const pending = bookings.map(b => ({
      id: b.id,
      trackingCode: b.trackingCode,
      route: `${b.listing.originPort} → ${b.listing.destinationPort}`,
      carrier: b.listing.carrier?.company || b.listing.carrier?.name || 'the carrier',
    }))

    return NextResponse.json({ pending, count: pending.length })
  } catch (error) {
    console.error('Pending reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
