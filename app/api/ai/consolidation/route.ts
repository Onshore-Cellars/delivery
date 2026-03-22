import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { recommendConsolidation } from '@/lib/ai'
import { aiLimiter, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = aiLimiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429 })
    }
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { bookings, availableListings } = await request.json()

    if (!Array.isArray(bookings) || !Array.isArray(availableListings)) {
      return NextResponse.json({ error: 'bookings and availableListings arrays are required' }, { status: 400 })
    }

    const recommendation = await recommendConsolidation({ bookings, availableListings })
    if (!recommendation) {
      return NextResponse.json({ error: 'Consolidation recommendation failed' }, { status: 500 })
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('Consolidation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
