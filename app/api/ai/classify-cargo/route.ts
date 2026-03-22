import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { classifyCargo } from '@/lib/ai'
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

    const { description } = await request.json()
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }

    const classification = await classifyCargo(description)
    if (!classification) {
      return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
    }

    return NextResponse.json(classification)
  } catch (error) {
    console.error('Classify cargo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
