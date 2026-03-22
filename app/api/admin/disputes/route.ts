import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
            paymentStatus: true,
            shipperId: true,
            trackingCode: true,
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

    // If refundAmount is provided and status is RESOLVED, trigger a refund
    if (refundAmount && refundAmount > 0 && status === 'RESOLVED') {
      if (refundAmount > dispute.booking.totalPrice) {
        return NextResponse.json({ error: 'Refund amount cannot exceed booking total' }, { status: 400 })
      }
      // Update the booking payment status to REFUNDED
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

    return NextResponse.json({ dispute: updatedDispute })
  } catch (error) {
    console.error('Admin dispute update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
