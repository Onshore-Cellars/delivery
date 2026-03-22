import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// POST - Carrier accepts or rejects a booking request
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { action } = body // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            carrierId: true, id: true, originPort: true, destinationPort: true, departureDate: true,
            carrier: { select: { id: true, name: true, company: true, phone: true, email: true } },
          },
        },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the carrier can accept/reject bookings' }, { status: 403 })
    }
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 })
    }

    if (action === 'accept') {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      })

      // Notify shipper with carrier details
      const carrier = booking.listing.carrier
      const carrierInfo = [
        carrier.name || carrier.company || 'Your carrier',
        carrier.phone ? `Phone: ${carrier.phone}` : null,
        carrier.email ? `Email: ${carrier.email}` : null,
      ].filter(Boolean).join(' | ')

      await prisma.notification.create({
        data: {
          userId: booking.shipperId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Accepted',
          message: `Your booking #${booking.trackingCode} has been accepted! Carrier: ${carrierInfo}. You can now proceed to payment.`,
          metadata: JSON.stringify({
            bookingId: id,
            carrierName: carrier.name,
            carrierPhone: carrier.phone,
            carrierEmail: carrier.email,
            carrierCompany: carrier.company,
          }),
        },
      })

      return NextResponse.json({ booking: updated, message: 'Booking accepted' })
    } else {
      // Reject - restore capacity
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id },
          data: { status: 'REJECTED' },
        })

        // Restore listing capacity
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

        // Reopen listing if it was FULL (ignore "not found" when listing isn't FULL)
        await tx.listing.updateMany({
          where: { id: booking.listingId, status: 'FULL' },
          data: { status: 'ACTIVE' },
        })

        return b
      })

      // Notify shipper
      await prisma.notification.create({
        data: {
          userId: booking.shipperId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Declined',
          message: `Your booking #${booking.trackingCode} was not accepted by the carrier.`,
          metadata: JSON.stringify({ bookingId: id }),
        },
      })

      return NextResponse.json({ booking: updated, message: 'Booking rejected' })
    }
  } catch (error) {
    console.error('Accept/reject error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
