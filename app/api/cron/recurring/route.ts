import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateTrackingCode } from '@/lib/auth'
import { calculatePlatformFee, calculateCarrierPayout } from '@/lib/stripe'
import { getPlatformFeePercent } from '@/lib/settings'
import { createNotification } from '@/lib/notifications'
import { advanceRun, Frequency } from '@/lib/recurring'

export const runtime = 'nodejs'

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) return true
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.role === 'ADMIN') return true
  }
  return false
}

function priceFor(listing: { flatRate: number | null; pricePerKg: number | null; pricePerM3: number | null }, weightKg: number, volumeM3: number): number {
  if (listing.flatRate) return listing.flatRate
  return Math.round(((listing.pricePerKg ? listing.pricePerKg * weightKg : 0) + (listing.pricePerM3 ? listing.pricePerM3 * volumeM3 : 0)) * 100) / 100
}

// POST /api/cron/recurring — generate due bookings from active schedules.
// Each occurrence creates a PENDING booking (30-min checkout window) and
// notifies the shipper to pay via the normal secure checkout.
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const due = await prisma.recurringBooking.findMany({
      where: { active: true, nextRunAt: { lte: now } },
      include: { listing: { select: { id: true, title: true, availableKg: true, availableM3: true, currency: true, flatRate: true, pricePerKg: true, pricePerM3: true, status: true } } },
      take: 200,
    })

    let generated = 0, skipped = 0, deactivated = 0

    for (const r of due) {
      const schedule = { frequency: r.frequency as Frequency, dayOfWeek: r.dayOfWeek, dayOfMonth: r.dayOfMonth }

      // End conditions.
      if (r.endDate && now > r.endDate) {
        await prisma.recurringBooking.update({ where: { id: r.id }, data: { active: false } })
        deactivated++; continue
      }

      const listing = r.listing
      const capacityOk = listing.status === 'ACTIVE' && r.weightKg <= listing.availableKg && r.volumeM3 <= listing.availableM3

      if (capacityOk) {
        const totalPrice = priceFor(listing, r.weightKg, r.volumeM3)
        const feePercent = await getPlatformFeePercent()
        try {
          await prisma.$transaction(async (tx) => {
            const fresh = await tx.listing.findUnique({ where: { id: listing.id }, select: { availableKg: true, availableM3: true } })
            if (!fresh || r.weightKg > fresh.availableKg || r.volumeM3 > fresh.availableM3) throw new Error('CAPACITY')
            await tx.booking.create({
              data: {
                listingId: listing.id,
                shipperId: r.shipperId,
                cargoDescription: r.cargoDescription,
                cargoType: r.cargoType,
                weightKg: r.weightKg,
                volumeM3: r.volumeM3,
                deliveryTimeWindow: r.timeWindow,
                totalPrice,
                platformFee: calculatePlatformFee(totalPrice, feePercent),
                carrierPayout: calculateCarrierPayout(totalPrice, feePercent),
                currency: listing.currency,
                trackingCode: generateTrackingCode(),
                status: 'PENDING',
                checkoutExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
              },
            })
            await tx.listing.update({ where: { id: listing.id }, data: { availableKg: { decrement: r.weightKg }, availableM3: { decrement: r.volumeM3 } } })
          }, { isolationLevel: 'Serializable' })

          await createNotification({
            userId: r.shipperId,
            type: 'BOOKING_CREATED',
            title: 'Recurring shipment ready to pay',
            message: `Your scheduled shipment on "${listing.title}" has been created. Complete payment to confirm it.`,
            linkUrl: '/dashboard',
          }).catch(() => {})
          generated++
        } catch { skipped++ }
      } else {
        // No capacity this cycle — let the shipper know, don't create a booking.
        await createNotification({
          userId: r.shipperId,
          type: 'BOOKING_CREATED',
          title: 'Recurring shipment skipped',
          message: `This cycle for "${listing.title}" was skipped — the carrier has no space or the listing is closed. We'll try again next time.`,
          linkUrl: '/marketplace',
        }).catch(() => {})
        skipped++
      }

      // Advance the schedule regardless (so we don't loop on the same due date).
      const next = advanceRun(schedule, r.nextRunAt < now ? now : r.nextRunAt)
      const remaining = r.remainingCount != null ? r.remainingCount - 1 : null
      const stop = (remaining != null && remaining <= 0) || (r.endDate != null && next > r.endDate)
      await prisma.recurringBooking.update({
        where: { id: r.id },
        data: { lastGeneratedAt: now, nextRunAt: next, remainingCount: remaining, active: !stop },
      })
      if (stop) deactivated++
    }

    return NextResponse.json({ due: due.length, generated, skipped, deactivated })
  } catch (error) {
    console.error('Recurring cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
