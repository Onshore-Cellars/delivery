import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function isAuthorized(request: NextRequest): boolean {
  // Check x-cron-secret header
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return true
  }

  // Check admin JWT
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.role === 'ADMIN') {
      return true
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all active listings whose departure date has passed
    const expiredListings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        departureDate: { lt: now },
      },
      select: { id: true },
    })

    if (expiredListings.length === 0) {
      return NextResponse.json({ expired: 0, bookingsCancelled: 0 })
    }

    const expiredListingIds = expiredListings.map((l) => l.id)

    // Update listings to COMPLETED
    await prisma.listing.updateMany({
      where: { id: { in: expiredListingIds } },
      data: { status: 'COMPLETED' },
    })

    // Cancel PENDING bookings on those listings (no capacity restore since the
    // listing is done) — but NEVER a paid one whose webhook simply hasn't flipped
    // status off PENDING yet, or we'd kill a booking the customer already paid for.
    const cancelledBookings = await prisma.booking.updateMany({
      where: {
        listingId: { in: expiredListingIds },
        status: 'PENDING',
        paymentStatus: { notIn: ['PAID', 'PARTIALLY_REFUNDED'] },
      },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({
      expired: expiredListings.length,
      bookingsCancelled: cancelledBookings.count,
    })
  } catch (error) {
    console.error('Expire listings cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
