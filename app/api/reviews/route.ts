import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// GET reviews for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      include: {
        author: { select: { id: true, name: true, company: true, avatarUrl: true } },
        booking: { select: { cargoDescription: true, listing: { select: { originPort: true, destinationPort: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({ reviews, avgRating, count: reviews.length })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create review
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { bookingId, rating, comment, communicationRating, timelinessRating, conditionRating } = body

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Booking ID and valid rating (1-5) required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { carrierId: true } } },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Can only review delivered bookings' }, { status: 400 })
    }

    // Determine who is being reviewed
    let targetId: string
    if (decoded.userId === booking.shipperId) {
      targetId = booking.listing.carrierId // Shipper reviews carrier
    } else if (decoded.userId === booking.listing.carrierId) {
      targetId = booking.shipperId // Carrier reviews shipper
    } else {
      return NextResponse.json({ error: 'Not authorized to review this booking' }, { status: 403 })
    }

    // Check if already reviewed
    const existing = await prisma.review.findUnique({ where: { bookingId } })
    if (existing) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId: decoded.userId,
        targetId,
        rating,
        comment: comment || null,
        communicationRating: communicationRating || null,
        timelinessRating: timelinessRating || null,
        conditionRating: conditionRating || null,
      },
    })

    await createNotification({
      userId: targetId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      message: `You received a ${rating}-star review`,
      linkUrl: '/profile',
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
