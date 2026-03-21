import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST — clean up stale bookings
// Secured with x-cron-secret header
export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      staleQuotes: 0,
      unpaidAccepted: 0,
      capacityRestored: 0,
    }

    // 1. Cancel QUOTE_REQUESTED bookings older than 72 hours
    const staleQuoteCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000)
    const staleQuotes = await prisma.booking.findMany({
      where: {
        status: 'QUOTE_REQUESTED',
        createdAt: { lt: staleQuoteCutoff },
      },
      include: { listing: true },
    })

    for (const booking of staleQuotes) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      })

      // Restore capacity
      if (booking.routeDirection === 'return') {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: {
            returnAvailableKg: { increment: booking.weightKg },
            returnAvailableM3: { increment: booking.volumeM3 },
          },
        })
      } else {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: {
            availableKg: { increment: booking.weightKg },
            availableM3: { increment: booking.volumeM3 },
          },
        })
      }

      // Reactivate listing if it was FULL
      const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } })
      if (listing && listing.status === 'FULL') {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: 'ACTIVE' },
        })
      }

      results.staleQuotes++
      results.capacityRestored++
    }

    // 2. Cancel ACCEPTED bookings that haven't been paid within 48 hours
    const unpaidCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const unpaidAccepted = await prisma.booking.findMany({
      where: {
        status: 'ACCEPTED',
        paymentStatus: 'PENDING',
        createdAt: { lt: unpaidCutoff },
      },
      include: { listing: true },
    })

    for (const booking of unpaidAccepted) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      })

      // Restore capacity
      if (booking.routeDirection === 'return') {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: {
            returnAvailableKg: { increment: booking.weightKg },
            returnAvailableM3: { increment: booking.volumeM3 },
          },
        })
      } else {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: {
            availableKg: { increment: booking.weightKg },
            availableM3: { increment: booking.volumeM3 },
          },
        })
      }

      // Reactivate listing if it was FULL
      const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } })
      if (listing && listing.status === 'FULL') {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: 'ACTIVE' },
        })
      }

      // Notify the shipper
      try {
        await prisma.notification.create({
          data: {
            userId: booking.shipperId,
            type: 'BOOKING_CANCELLED',
            title: 'Booking Expired',
            message: `Your booking #${booking.trackingCode} was cancelled because payment was not received within 48 hours.`,
            metadata: JSON.stringify({ bookingId: booking.id }),
          },
        })
      } catch (notifErr) {
        console.error('Stale booking notification error:', notifErr)
      }

      results.unpaidAccepted++
      results.capacityRestored++
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Cleaned up ${results.staleQuotes} stale quotes, ${results.unpaidAccepted} unpaid bookings. Restored capacity for ${results.capacityRestored} bookings.`,
    })
  } catch (error) {
    console.error('Stale booking cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
