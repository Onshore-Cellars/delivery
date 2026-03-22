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

    // Find all expired pending checkouts
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        checkoutExpiresAt: { lt: now },
      },
      include: { listing: true },
    })

    // Cancel each and restore listing capacity (idempotent — skip if already cancelled)
    for (const booking of expiredBookings) {
      await prisma.$transaction(async (tx) => {
        // Re-check status inside transaction to prevent double-processing
        // (the booking creation transaction also expires stale checkouts)
        const current = await tx.booking.findUnique({ where: { id: booking.id }, select: { status: true } })
        if (!current || current.status !== 'PENDING') return

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED' },
        })

        // Restore capacity on the listing
        if (booking.routeDirection === 'return') {
          await tx.listing.update({
            where: { id: booking.listingId },
            data: {
              returnAvailableKg: { increment: booking.weightKg },
              returnAvailableM3: { increment: booking.volumeM3 },
            },
          })
        } else {
          await tx.listing.update({
            where: { id: booking.listingId },
            data: {
              availableKg: { increment: booking.weightKg },
              availableM3: { increment: booking.volumeM3 },
            },
          })
        }

        // If listing was FULL, reactivate it now that capacity is restored
        const restoredListing = await tx.listing.findUnique({ where: { id: booking.listingId } })
        if (restoredListing && restoredListing.status === 'FULL') {
          await tx.listing.update({
            where: { id: booking.listingId },
            data: { status: 'ACTIVE' },
          })
        }
      }, { isolationLevel: 'Serializable' })
    }

    return NextResponse.json({ expired: expiredBookings.length })
  } catch (error) {
    console.error('Expire checkouts cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
