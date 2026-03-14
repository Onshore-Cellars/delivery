import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET single listing with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        carrier: {
          select: {
            id: true, name: true, company: true, avatarUrl: true,
            phone: true, email: true, bio: true, city: true, country: true,
            createdAt: true,
            receivedReviews: {
              select: { rating: true },
            },
            _count: { select: { listings: true, receivedReviews: true } },
          },
        },
        bookings: {
          select: { id: true, status: true, weightKg: true, volumeM3: true },
        },
        bids: {
          where: { status: 'PENDING' },
          select: { id: true, amount: true, createdAt: true },
          orderBy: { amount: 'desc' },
        },
        _count: { select: { bookings: true, bids: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Calculate carrier rating
    const ratings = listing.carrier.receivedReviews
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

    return NextResponse.json({
      listing: {
        ...listing,
        carrier: {
          ...listing.carrier,
          receivedReviews: undefined,
          avgRating,
          reviewCount: ratings.length,
        },
      },
    })
  } catch (error) {
    console.error('Listing detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
