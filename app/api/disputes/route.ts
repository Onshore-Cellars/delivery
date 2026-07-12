import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

// GET /api/disputes — list user's disputes
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const isAdmin = decoded.role === 'ADMIN'

    const disputes = await prisma.dispute.findMany({
      where: isAdmin ? {} : {
        OR: [
          { raisedById: decoded.userId },
          { againstId: decoded.userId },
        ],
      },
      include: {
        booking: {
          select: {
            id: true,
            trackingCode: true,
            cargoDescription: true,
            totalPrice: true,
            currency: true,
          },
        },
        raisedBy: { select: { id: true, name: true, company: true } },
        against: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ disputes })
  } catch (error) {
    console.error('Disputes fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/disputes — raise a new dispute
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { bookingId, type, description, evidence, claimAmount } = await req.json()

    if (!bookingId || !type || !description) {
      return NextResponse.json({ error: 'bookingId, type, and description are required' }, { status: 400 })
    }

    const validTypes = ['DAMAGE', 'LOSS', 'LATE_DELIVERY', 'OVERCHARGE', 'MISSING_ITEMS', 'OTHER']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Verify the user is involved in this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { carrierId: true } } },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isShipper = booking.shipperId === decoded.userId
    const isCarrier = booking.listing.carrierId === decoded.userId

    if (!isShipper && !isCarrier) {
      return NextResponse.json({ error: 'Not authorized to dispute this booking' }, { status: 403 })
    }

    const againstId = isShipper ? booking.listing.carrierId : booking.shipperId

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        raisedById: decoded.userId,
        againstId,
        type,
        description,
        evidence: evidence || [],
        claimAmount: claimAmount && !isNaN(parseFloat(claimAmount)) ? parseFloat(claimAmount) : null,
      },
    })

    // Notify the other party about the dispute
    await createNotification({
      userId: againstId,
      type: 'SYSTEM',
      title: 'Dispute Filed Against You',
      message: `A ${type.replace('_', ' ').toLowerCase()} dispute has been filed for booking ${booking.trackingCode || bookingId}.`,
      linkUrl: `/dashboard`,
    })

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'SYSTEM',
        title: 'New Dispute Filed',
        message: `A ${type.replace('_', ' ').toLowerCase()} dispute has been filed for booking ${booking.trackingCode || bookingId}.`,
        linkUrl: `/admin`,
      })
    }

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (error) {
    console.error('Dispute create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/disputes — an involved party adds evidence and/or a comment to an
// open dispute. Notifies the other party + admins.
export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id, evidence, comment } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { booking: { select: { trackingCode: true } } },
    })
    if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })

    const isParty = dispute.raisedById === decoded.userId || dispute.againstId === decoded.userId
    if (!isParty) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    if (['RESOLVED', 'CLOSED'].includes(dispute.status)) {
      return NextResponse.json({ error: 'This dispute is closed' }, { status: 400 })
    }

    const newEvidence = Array.isArray(evidence) ? evidence.filter((e: unknown) => typeof e === 'string').slice(0, 10) : []
    const data: Record<string, unknown> = {}
    if (newEvidence.length) data.evidence = [...dispute.evidence, ...newEvidence].slice(0, 30)
    // Append a timestamped comment to the description thread.
    if (comment && typeof comment === 'string') {
      const who = dispute.raisedById === decoded.userId ? 'Claimant' : 'Respondent'
      data.description = `${dispute.description}\n\n[${who}] ${comment.slice(0, 1000)}`
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const updated = await prisma.dispute.update({ where: { id }, data })

    // Notify the other party + admins.
    const otherId = dispute.raisedById === decoded.userId ? dispute.againstId : dispute.raisedById
    const ref = dispute.booking.trackingCode || dispute.bookingId
    await createNotification({
      userId: otherId,
      type: 'SYSTEM',
      title: 'New activity on your dispute',
      message: `The other party added ${newEvidence.length ? 'evidence' : 'a comment'} to the dispute on booking ${ref}.`,
      linkUrl: '/disputes',
    }).catch(() => {})

    return NextResponse.json({ dispute: updated })
  } catch (error) {
    console.error('Dispute update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
