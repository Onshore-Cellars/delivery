import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createRefund } from '@/lib/stripe'
import { reverseCarrierPayout } from '@/lib/payout'
import { createNotification } from '@/lib/notifications'

// GET — list all disputes with pagination
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              trackingCode: true,
              totalPrice: true,
              currency: true,
              status: true,
            },
          },
          raisedBy: {
            select: { id: true, name: true, email: true, company: true },
          },
          against: {
            select: { id: true, name: true, email: true, company: true },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ])

    return NextResponse.json({
      disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin disputes list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update dispute status, add resolution notes
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { id, status, resolutionNotes, refundAmount } = body

    if (!id) {
      return NextResponse.json({ error: 'Dispute ID is required' }, { status: 400 })
    }

    const validStatuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            totalPrice: true,
            vatAmount: true,
            carrierPayout: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            shipperId: true,
            trackingCode: true,
            currency: true,
          },
        },
      },
    })

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (resolutionNotes) updateData.resolution = resolutionNotes
    if (resolutionNotes) updateData.adminNotes = resolutionNotes
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date()
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: updateData,
    })

    // If refundAmount is provided and status is RESOLVED, ACTUALLY issue the
    // refund via Stripe and reverse the carrier's payout (VAT excluded — it's
    // the platform's, not the carrier's). Previously this only flipped the
    // payment status without moving any money.
    if (refundAmount && refundAmount > 0 && status === 'RESOLVED') {
      const b = dispute.booking
      const gross = Math.round((b.totalPrice + (b.vatAmount || 0)) * 100) / 100
      if (refundAmount > gross) {
        return NextResponse.json({ error: 'Refund amount cannot exceed booking total (incl. VAT)' }, { status: 400 })
      }
      if (b.paymentStatus !== 'PAID') {
        return NextResponse.json({ error: 'Cannot refund — booking is not in a PAID state' }, { status: 400 })
      }
      if (!b.stripePaymentIntentId) {
        return NextResponse.json({ error: 'Cannot refund — no payment intent on this booking' }, { status: 400 })
      }

      const isFull = refundAmount >= gross
      // Actually refund via Stripe (undefined amount = full gross refund).
      await createRefund(b.stripePaymentIntentId, isFull ? undefined : refundAmount)
      // Reverse the carrier's proportional share (never the VAT portion).
      const carrierClaw = isFull ? undefined
        : (gross > 0 ? Math.round((refundAmount * (b.carrierPayout / gross)) * 100) / 100 : undefined)
      await reverseCarrierPayout(b.id, carrierClaw).catch(e => console.error('Dispute payout reversal error:', e))

      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data: { paymentStatus: 'REFUNDED' },
      })

      // Create an audit log for the refund
      await prisma.auditLog.create({
        data: {
          userId: decoded.userId,
          targetId: dispute.booking.shipperId,
          action: 'DISPUTE_REFUND',
          details: JSON.stringify({
            disputeId: id,
            bookingId: dispute.bookingId,
            refundAmount,
            trackingCode: dispute.booking.trackingCode,
          }),
        },
      })

      // Notify the shipper about the refund
      try {
        await prisma.notification.create({
          data: {
            userId: dispute.booking.shipperId,
            type: 'PAYMENT_RECEIVED',
            title: 'Dispute Resolved — Refund Issued',
            message: `Your dispute for booking #${dispute.booking.trackingCode} has been resolved. A refund of €${refundAmount.toFixed(2)} has been issued.`,
            metadata: JSON.stringify({ disputeId: id, bookingId: dispute.bookingId, refundAmount }),
          },
        })
      } catch (notifErr) {
        console.error('Refund notification error:', notifErr)
      }
    }

    // Log the admin action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        targetId: dispute.raisedById,
        action: 'DISPUTE_UPDATED',
        details: JSON.stringify({
          disputeId: id,
          newStatus: status,
          resolutionNotes,
          refundAmount: refundAmount || null,
        }),
      },
    })

    // Notify BOTH parties of a status change so nobody is left in the dark.
    if (status) {
      const label = status.replace('_', ' ').toLowerCase()
      const ref = dispute.booking.trackingCode || dispute.bookingId
      for (const uid of [dispute.raisedById, dispute.againstId]) {
        await createNotification({
          userId: uid,
          type: 'SYSTEM',
          title: `Dispute ${status === 'RESOLVED' ? 'resolved' : 'updated'}`,
          message: `The dispute on booking ${ref} is now ${label}.${resolutionNotes ? ` Note: ${resolutionNotes}` : ''}`,
          linkUrl: '/disputes',
        }).catch(() => {})
      }
    }

    return NextResponse.json({ dispute: updatedDispute })
  } catch (error) {
    console.error('Admin dispute update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
