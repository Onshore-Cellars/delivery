import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// PATCH /api/reviews/[id] - Edit own review (author only, limited fields)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    if (review.authorId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the author can edit their review' }, { status: 403 })
    }

    const body = await request.json()
    const { rating, comment, communicationRating, timelinessRating, conditionRating } = body

    const data: Record<string, unknown> = {}
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
      data.rating = rating
    }
    if (comment !== undefined) data.comment = comment || null
    const subRatings = { communicationRating, timelinessRating, conditionRating }
    for (const [key, val] of Object.entries(subRatings)) {
      if (val !== undefined) {
        if (val !== null && (val < 1 || val > 5)) return NextResponse.json({ error: `${key} must be 1-5` }, { status: 400 })
        data[key] = val
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.review.update({ where: { id }, data })
    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reviews/[id] - Delete review (author or admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    if (review.authorId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
