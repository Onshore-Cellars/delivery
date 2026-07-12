import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { notifyStatusUpdate } from '@/lib/notifications'
import { deliveryConfirmationEmail } from '@/lib/email'
import { queueEmail } from '@/lib/email-queue'
import { createRefund, currencySymbol } from '@/lib/stripe'
import { releaseCarrierPayout, reverseCarrierPayout } from '@/lib/payout'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { status, location, description, signature, photoUrl, recipientName, notes } = body

    const validStatuses = ['ACCEPTED', 'REJECTED', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELIVERED', 'CANCELLED', 'DISPUTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: { include: { carrier: { select: { stripeAccountId: true } } } } },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['CONFIRMED', 'CANCELLED'],
      REJECTED: [],
      QUOTE_REQUESTED: ['QUOTED', 'CANCELLED'],
      QUOTED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PICKED_UP', 'CANCELLED', 'DISPUTED'],
      PICKED_UP: ['IN_TRANSIT', 'CANCELLED', 'DISPUTED'],
      IN_TRANSIT: ['CUSTOMS_HOLD', 'DELIVERED', 'CANCELLED', 'DISPUTED'],
      CUSTOMS_HOLD: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISPUTED'],
      DELIVERED: ['DISPUTED'],
      CANCELLED: [],
      DISPUTED: ['CANCELLED', 'DELIVERED'], // Resolve dispute by cancelling or confirming delivery
    }
    const allowed = validTransitions[booking.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${booking.status} to ${status}` }, { status: 400 })
    }

    // Only the carrier or the shipper (for cancellation/dispute) can update status
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isShipper && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this booking' }, { status: 403 })
    }

    // Shippers can only cancel or dispute
    if (isShipper && !['CANCELLED', 'DISPUTED'].includes(status)) {
      return NextResponse.json({ error: 'Shippers can only cancel or dispute bookings' }, { status: 403 })
    }

    // Prevent shipper from cancelling after pickup — must raise a dispute instead
    if (isShipper && status === 'CANCELLED' && ['PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_HOLD'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot cancel after pickup. Please raise a dispute instead.' }, { status: 400 })
    }

    // Require payment before confirmation (unless admin overrides)
    if (status === 'CONFIRMED' && booking.paymentStatus !== 'PAID' && !isAdmin) {
      return NextResponse.json({ error: 'Payment required before confirming booking' }, { status: 400 })
    }

    // ── Cancellation refund ────────────────────────────────────────────────
    // If a PAID booking is being cancelled, refund the shipper (minus any
    // cancellation fee) BEFORE mutating state, so a refund failure aborts the
    // cancellation cleanly instead of keeping the customer's money. Previously
    // cancellation restored capacity but never issued the refund the
    // cancel-preview endpoint promised.
    let cancellationFee = 0
    let cancellationPercent = ''
    let refundedPaymentStatus: 'REFUNDED' | undefined
    if (status === 'CANCELLED' && booking.paymentStatus === 'PAID' && booking.totalPrice > 0) {
      const departure = booking.listing.departureDate
      const hoursUntilDeparture = (departure.getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntilDeparture < 24) { cancellationFee = booking.totalPrice * 0.5; cancellationPercent = '50%' }
      else if (hoursUntilDeparture < 72) { cancellationFee = booking.totalPrice * 0.25; cancellationPercent = '25%' }
      else if (hoursUntilDeparture < 168) { cancellationFee = booking.totalPrice * 0.1; cancellationPercent = '10%' }

      const refundAmount = Math.max(0, Math.round((booking.totalPrice - cancellationFee) * 100) / 100)
      if (booking.stripePaymentIntentId && refundAmount > 0) {
        try {
          // Escrow: the charge sits on the platform balance, so refund it
          // directly. If the payout was already released (delivered-then-refunded
          // edge case), claw the carrier's transfer back too.
          await createRefund(booking.stripePaymentIntentId, refundAmount)
          await reverseCarrierPayout(id, refundAmount).catch(e => console.error('Payout reversal error:', e))
        } catch (refundErr) {
          console.error('Cancellation refund error:', refundErr)
          return NextResponse.json({ error: 'Failed to process refund. Cancellation aborted — please try again.' }, { status: 502 })
        }
      }
      // Clear the paid state whether we refunded via Stripe or there was nothing
      // left to refund after the fee.
      refundedPaymentStatus = 'REFUNDED'
    }

    const statusDescriptions: Record<string, string> = {
      ACCEPTED: 'Booking accepted by carrier — awaiting payment',
      REJECTED: 'Booking declined by carrier',
      CONFIRMED: 'Booking confirmed by carrier',
      PICKED_UP: 'Cargo picked up',
      IN_TRANSIT: 'Cargo in transit',
      CUSTOMS_HOLD: 'Cargo held at customs',
      DELIVERED: 'Cargo delivered successfully',
      CANCELLED: `Booking cancelled by ${isCarrier ? 'carrier' : isAdmin ? 'admin' : 'shipper'}`,
      DISPUTED: `Dispute raised by ${isShipper ? 'shipper' : isCarrier ? 'carrier' : 'admin'}`,
    }

    // Build additional data for proof-of-pickup / proof-of-delivery
    const additionalData: Record<string, unknown> = {}
    if (status === 'PICKED_UP') {
      additionalData.pickupDate = new Date()
      additionalData.pickupConfirmedAt = new Date()
      if (signature) additionalData.pickupSignature = signature
      if (photoUrl) additionalData.pickupPhotoUrl = photoUrl
    }
    if (status === 'DELIVERED') {
      additionalData.actualDelivery = new Date()
      if (signature) additionalData.podSignature = signature
      if (photoUrl) additionalData.podPhotoUrl = photoUrl
      if (notes) additionalData.podNotes = notes
      if (recipientName) additionalData.podRecipientName = recipientName
    }

    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status, ...additionalData, ...(refundedPaymentStatus ? { paymentStatus: refundedPaymentStatus } : {}) },
      }),
      prisma.trackingEvent.create({
        data: {
          bookingId: id,
          status,
          location: location || null,
          description: description || statusDescriptions[status],
        },
      }),
    ])

    // If cancelled, restore listing capacity. Any refund + cancellation-fee
    // computation already happened above, before state was mutated.
    if (status === 'CANCELLED') {
      const isReturnLeg = booking.routeDirection === 'return'

      // Restore capacity (with overflow guard — never exceed total)
      if (isReturnLeg) {
        const updateData: Record<string, unknown> = {
          returnAvailableKg: { increment: booking.weightKg },
          returnAvailableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      } else {
        const updateData: Record<string, unknown> = {
          availableKg: { increment: booking.weightKg },
          availableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      }

      // Clamp capacity — ensure available never exceeds total after restore
      const restored = await prisma.listing.findUnique({
        where: { id: booking.listingId },
        select: { totalCapacityKg: true, totalCapacityM3: true, availableKg: true, availableM3: true, returnAvailableKg: true, returnAvailableM3: true, returnTotalKg: true, returnTotalM3: true },
      })
      if (restored) {
        const clamp: Record<string, number> = {}
        if (restored.availableKg > restored.totalCapacityKg) clamp.availableKg = restored.totalCapacityKg
        if (restored.availableM3 > restored.totalCapacityM3) clamp.availableM3 = restored.totalCapacityM3
        if (restored.returnAvailableKg != null && restored.returnTotalKg != null && restored.returnAvailableKg > restored.returnTotalKg) {
          clamp.returnAvailableKg = restored.returnTotalKg
        }
        if (restored.returnAvailableM3 != null && restored.returnTotalM3 != null && restored.returnAvailableM3 > restored.returnTotalM3) {
          clamp.returnAvailableM3 = restored.returnTotalM3
        }
        if (Object.keys(clamp).length > 0) {
          await prisma.listing.update({ where: { id: booking.listingId }, data: clamp })
        }
      }

      // Record cancellation fee as a tracking event (don't overwrite platformFee)
      if (cancellationFee > 0) {
        await prisma.trackingEvent.create({
          data: {
            bookingId: id,
            status: 'CANCELLED',
            description: `Cancellation fee: ${currencySymbol(booking.currency)}${cancellationFee.toFixed(2)} (${cancellationPercent} of booking total)`,
          },
        })
      }
    }

    // If rejected by carrier, restore listing capacity and notify shipper
    if (status === 'REJECTED') {
      const isReturnLeg = booking.routeDirection === 'return'
      if (isReturnLeg) {
        const updateData: Record<string, unknown> = {
          returnAvailableKg: { increment: booking.weightKg },
          returnAvailableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      } else {
        const updateData: Record<string, unknown> = {
          availableKg: { increment: booking.weightKg },
          availableM3: { increment: booking.volumeM3 },
        }
        if (booking.listing.status === 'FULL') {
          updateData.status = 'ACTIVE'
        }
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: updateData,
        })
      }

      // Notify shipper of rejection
      try {
        await prisma.notification.create({
          data: {
            userId: booking.shipperId,
            type: 'BOOKING_CANCELLED',
            title: 'Booking Declined',
            message: `Your booking #${booking.trackingCode} was not accepted by the carrier.`,
            metadata: JSON.stringify({ bookingId: id }),
          },
        })
      } catch (notifErr) {
        console.error('Rejection notification error:', notifErr)
      }
    }

    // If accepted by carrier, notify shipper to proceed to payment
    if (status === 'ACCEPTED') {
      try {
        await prisma.notification.create({
          data: {
            userId: booking.shipperId,
            type: 'BOOKING_CONFIRMED',
            title: 'Booking Accepted',
            message: `Your booking #${booking.trackingCode} has been accepted by the carrier. You can now proceed to payment.`,
            metadata: JSON.stringify({ bookingId: id }),
          },
        })
      } catch (notifErr) {
        console.error('Acceptance notification error:', notifErr)
      }
    }

    // If picked up, notify shipper with collection confirmation
    if (status === 'PICKED_UP') {
      try {
        await prisma.notification.create({
          data: {
            userId: booking.shipperId,
            type: 'BOOKING_STATUS_UPDATE',
            title: 'Cargo Collected',
            message: `Your cargo for #${booking.trackingCode} has been collected${signature ? ' (signature captured)' : ''}${photoUrl ? ' (photo taken)' : ''}.`,
            metadata: JSON.stringify({ bookingId: id, pickupConfirmedAt: new Date().toISOString() }),
          },
        })
      } catch (notifErr) {
        console.error('Pickup notification error:', notifErr)
      }
    }

    // If delivered, send confirmation email and complete listing if all done
    if (status === 'DELIVERED') {
      // Send delivery confirmation email to shipper
      try {
        const shipper = await prisma.user.findUnique({
          where: { id: booking.shipperId },
          select: { name: true, email: true },
        })
        if (shipper?.email) {
          const emailData = deliveryConfirmationEmail({
            shipperName: shipper.name || 'there',
            trackingCode: booking.trackingCode || id,
            origin: booking.listing.originPort,
            destination: booking.listing.destinationPort,
            deliveredAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
            recipientName: recipientName || undefined,
            hasSignature: !!signature,
            hasPhoto: !!photoUrl,
          })
          await queueEmail({ to: shipper.email, ...emailData })
        }
      } catch (emailErr) {
        console.error('Delivery confirmation email error:', emailErr)
      }

      const remaining = await prisma.booking.count({
        where: {
          listingId: booking.listingId,
          status: { notIn: ['DELIVERED', 'CANCELLED', 'QUOTE_REQUESTED', 'QUOTED'] },
        },
      })
      if (remaining === 0) {
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: 'COMPLETED' },
        })
      }

      // Escrow: release the held carrier payout now that delivery is confirmed.
      // Idempotent and best-effort — a transfer failure must not fail the
      // delivery confirmation; the payout stays pending and can be retried.
      await releaseCarrierPayout(id).catch(e => console.error('Payout release error:', e))
    }

    // Send notification
    try {
      await notifyStatusUpdate({
        bookingId: id,
        status,
        description: description || statusDescriptions[status],
        location,
      })
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
