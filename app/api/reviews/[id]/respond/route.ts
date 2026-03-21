import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// POST /api/reviews/[id]/respond — carrier responds to a review
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { response } = body

    if (!response || !response.trim()) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: { booking: { select: { listing: { select: { carrierId: true } } } } },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only the reviewed user (target) can respond
    if (review.targetId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the reviewed user can respond' }, { status: 403 })
    }

    if (review.response) {
      return NextResponse.json({ error: 'Already responded to this review' }, { status: 409 })
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        response: response.trim(),
        responseAt: new Date(),
      },
    })

    return NextResponse.json({ review: updated })
  } catch (error) {
    console.error('Review respond error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
