import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createRefund, currencySymbol } from '@/lib/stripe'
import { reverseCarrierPayout } from '@/lib/payout'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Admin only
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { reason, amount } = body as { reason?: string; amount?: number }

    // Look up booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        shipper: { select: { id: true, name: true, email: true } },
        listing: { select: { carrier: { select: { stripeAccountId: true } } } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.stripePaymentIntentId) {
      return NextResponse.json({ error: 'No payment intent found for this booking' }, { status: 400 })
    }

    if (booking.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Booking payment status is not PAID' }, { status: 400 })
    }

    // The customer paid the GROSS (net + VAT), so a full refund returns the
    // gross and a partial refund may be up to the gross.
    const gross = Math.round((booking.totalPrice + (booking.vatAmount || 0)) * 100) / 100

    // Validate partial refund amount
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Refund amount must be a positive number' }, { status: 400 })
      }
      if (amount > gross) {
        return NextResponse.json({ error: 'Refund amount cannot exceed booking total (incl. VAT)' }, { status: 400 })
      }
    }

    const isPartial = amount !== undefined && amount < gross
    const refundAmount = amount ?? gross

    // Escrow: the charge is on the platform balance, so refund it directly
    // (undefined amount = full gross refund by Stripe). If the payout was
    // already released to the carrier, claw back only the carrier's share of
    // the refund — VAT is the platform's liability, not the carrier's, so it is
    // excluded from the payout reversal.
    const carrierClaw = isPartial && gross > 0
      ? Math.round((refundAmount * (booking.carrierPayout / gross)) * 100) / 100
      : undefined // full reversal
    await createRefund(booking.stripePaymentIntentId, amount)
    await reverseCarrierPayout(id, carrierClaw).catch(e => console.error('Payout reversal error:', e))

    // Update booking payment status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: 'REFUNDED',
        ...(isPartial ? {} : { status: 'CANCELLED' }),
      },
      include: {
        shipper: { select: { id: true, name: true, email: true } },
        listing: {
          select: {
            title: true,
            originPort: true,
            destinationPort: true,
            carrierId: true,
            carrier: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    // Restore listing capacity on full refund (booking cancelled)
    if (!isPartial) {
      const isReturnLeg = booking.routeDirection === 'return'
      if (isReturnLeg) {
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
      // Reopen listing if it was FULL
      await prisma.listing.update({
        where: { id: booking.listingId, status: 'FULL' },
        data: { status: 'ACTIVE' },
      }).catch(() => {})

      // Clamp capacity so a double-restore can never push available above total.
      const restored = await prisma.listing.findUnique({
        where: { id: booking.listingId },
        select: { totalCapacityKg: true, totalCapacityM3: true, availableKg: true, availableM3: true, returnAvailableKg: true, returnAvailableM3: true, returnTotalKg: true, returnTotalM3: true },
      })
      if (restored) {
        const clamp: Record<string, number> = {}
        if (restored.availableKg > restored.totalCapacityKg) clamp.availableKg = restored.totalCapacityKg
        if (restored.availableM3 > restored.totalCapacityM3) clamp.availableM3 = restored.totalCapacityM3
        if (restored.returnAvailableKg != null && restored.returnTotalKg != null && restored.returnAvailableKg > restored.returnTotalKg) clamp.returnAvailableKg = restored.returnTotalKg
        if (restored.returnAvailableM3 != null && restored.returnTotalM3 != null && restored.returnAvailableM3 > restored.returnTotalM3) clamp.returnAvailableM3 = restored.returnTotalM3
        if (Object.keys(clamp).length > 0) {
          await prisma.listing.update({ where: { id: booking.listingId }, data: clamp })
        }
      }
    }

    // Notify shipper
    await createNotification({
      userId: booking.shipperId,
      type: 'PAYMENT_RECEIVED',
      title: 'Refund Processed',
      message: `Refund of ${currencySymbol(booking.currency)}${refundAmount.toFixed(2)} processed for booking ${booking.trackingCode || id}`,
      linkUrl: `/tracking?code=${booking.trackingCode}`,
    })

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        bookingId: id,
        status: updatedBooking.status,
        description: `Refund processed${reason ? `: ${reason}` : ''}`,
      },
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
