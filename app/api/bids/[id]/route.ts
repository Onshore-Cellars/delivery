import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateTrackingCode } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// Accept or reject a bid (carrier only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

    if (bid.listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (bid.status !== 'PENDING') {
      return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body // 'accept' or 'reject'

    if (action === 'accept') {
      // Check capacity
      if (bid.weightKg > bid.listing.availableKg || bid.volumeM3 > bid.listing.availableM3) {
        return NextResponse.json({ error: 'Insufficient capacity' }, { status: 400 })
      }

      const trackingCode = generateTrackingCode()

      // Accept bid → create booking + update listing + update bid
      const [updatedBid] = await prisma.$transaction([
        prisma.bid.update({ where: { id }, data: { status: 'ACCEPTED' } }),
        prisma.booking.create({
          data: {
            listingId: bid.listingId,
            shipperId: bid.bidderId,
            cargoDescription: bid.message || 'Bid-based booking',
            weightKg: bid.weightKg,
            volumeM3: bid.volumeM3,
            totalPrice: bid.amount,
            currency: bid.currency,
            trackingCode,
            status: 'CONFIRMED',
          },
        }),
        prisma.listing.update({
          where: { id: bid.listingId },
          data: {
            availableKg: { decrement: bid.weightKg },
            availableM3: { decrement: bid.volumeM3 },
          },
        }),
      ])

      return NextResponse.json({ bid: updatedBid, message: 'Bid accepted, booking created' })
    } else if (action === 'reject') {
      const updatedBid = await prisma.bid.update({
        where: { id },
        data: { status: 'REJECTED' },
      })

      // Notify bidder of rejection
      try {
        await createNotification({
          userId: bid.bidderId,
          type: 'BID_REJECTED',
          title: 'Bid Not Accepted',
          message: `Your bid on ${bid.listing.title} was not accepted. You can submit a new bid or browse other listings.`,
          linkUrl: '/marketplace',
        })
      } catch {}

      return NextResponse.json({ bid: updatedBid })
    } else {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bid action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
