import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { assessDispute } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Admin only
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { disputeType, description, claimAmount, bookingTotal, cargoDescription, trackingEvents, messages } = body

    if (!disputeType || !description || bookingTotal === undefined || !cargoDescription) {
      return NextResponse.json({ error: 'Missing required dispute fields' }, { status: 400 })
    }

    const assessment = await assessDispute({
      disputeType,
      description,
      claimAmount: claimAmount ?? null,
      bookingTotal,
      cargoDescription,
      trackingEvents: trackingEvents || [],
      messages: messages || [],
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Dispute assessment failed' }, { status: 500 })
    }

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Dispute assessment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
