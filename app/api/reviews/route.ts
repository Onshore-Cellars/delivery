import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET reviews for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const bookingId = searchParams.get('bookingId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (userId) where.targetId = userId
    if (bookingId) where.bookingId = bookingId

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true } },
        booking: {
          select: {
            listing: { select: { originAddress: true, destinationAddress: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

    return NextResponse.json({ reviews, avgRating, count: reviews.length })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST create a review
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { bookingId, rating, comment } = body

    if (!bookingId || !rating) {
      return NextResponse.json({ error: 'Booking ID and rating required' }, { status: 400 })
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true, review: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Can only review delivered bookings' }, { status: 400 })
    }

    if (booking.review) {
      return NextResponse.json({ error: 'This booking already has a review' }, { status: 400 })
    }

    // Determine who is being reviewed
    const isCustomer = booking.shipperId === decoded.userId
    const isCarrier = booking.listing.carrierId === decoded.userId

    if (!isCustomer && !isCarrier) {
      return NextResponse.json({ error: 'Not authorized to review this booking' }, { status: 403 })
    }

    // Customer reviews carrier, carrier reviews customer
    const targetId = isCustomer ? booking.listing.carrierId : booking.shipperId

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: decoded.userId,
        targetId,
        rating,
        comment: comment || null,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ message: 'Review submitted', review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
