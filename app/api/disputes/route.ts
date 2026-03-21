import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
        claimAmount: claimAmount ? parseFloat(claimAmount) : null,
      },
    })

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (error) {
    console.error('Dispute create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
