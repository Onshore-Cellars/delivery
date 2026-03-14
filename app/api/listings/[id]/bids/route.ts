import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { notifyBidReceived } from '@/lib/notifications'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Only carrier or admin can see all bids, others see only their own
    const where: Record<string, unknown> = { listingId: id }
    if (listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      where.bidderId = decoded.userId
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        bidder: { select: { id: true, name: true, company: true } },
      },
      orderBy: { amount: 'desc' },
    })

    return NextResponse.json({ bids })
  } catch (error) {
    console.error('Bids fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing not available' }, { status: 404 })
    }

    if (!listing.biddingEnabled) {
      return NextResponse.json({ error: 'Bidding is not enabled for this listing' }, { status: 400 })
    }

    if (listing.carrierId === decoded.userId) {
      return NextResponse.json({ error: 'Cannot bid on your own listing' }, { status: 400 })
    }

    const body = await request.json()
    const { amount, weightKg, volumeM3, message } = body

    if (!amount || !weightKg || !volumeM3) {
      return NextResponse.json({ error: 'Amount, weight, and volume are required' }, { status: 400 })
    }

    if (listing.minBidPrice && parseFloat(amount) < listing.minBidPrice) {
      return NextResponse.json({ error: `Minimum bid is ${listing.minBidPrice} ${listing.currency}` }, { status: 400 })
    }

    const bid = await prisma.bid.create({
      data: {
        listingId: id,
        bidderId: decoded.userId,
        amount: parseFloat(amount),
        currency: listing.currency,
        weightKg: parseFloat(weightKg),
        volumeM3: parseFloat(volumeM3),
        message: message || null,
      },
      include: {
        bidder: { select: { id: true, name: true, company: true } },
      },
    })

    // Send notification to carrier
    try {
      await notifyBidReceived({
        carrierId: listing.carrierId,
        bidderName: bid.bidder.name,
        amount: bid.amount,
        currency: bid.currency,
        listingTitle: listing.title,
        weightKg: bid.weightKg,
        volumeM3: bid.volumeM3,
      })
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ bid }, { status: 201 })
  } catch (error) {
    console.error('Bid creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
