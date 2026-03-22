import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { parseNaturalLanguageSearch } from '@/lib/ai'
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

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const filters = await parseNaturalLanguageSearch(query)

    if (!filters) {
      return NextResponse.json({ error: 'Could not parse search query' }, { status: 422 })
    }

    return NextResponse.json(filters)
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
