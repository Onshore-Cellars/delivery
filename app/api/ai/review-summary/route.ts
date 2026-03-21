import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { summarizeReviews } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      select: {
        rating: true,
        comment: true,
        communicationRating: true,
        timelinessRating: true,
        conditionRating: true,
      },
    })

    const formatted = reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment || '',
      communicationRating: r.communicationRating ?? undefined,
      timelinessRating: r.timelinessRating ?? undefined,
      conditionRating: r.conditionRating ?? undefined,
    }))

    const summary = await summarizeReviews(formatted)
    if (!summary) {
      return NextResponse.json({ error: 'Not enough reviews to summarize (minimum 3 required)' }, { status: 400 })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Review summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
