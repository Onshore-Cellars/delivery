import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { buildOpsDigest } from '@/lib/agents/digest'

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) return true
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.role === 'ADMIN') return true
  }
  return false
}

// POST /api/cron/ops-digest — compose and deliver the morning operations brief
// to every admin (notification + email). Safe to call on demand for a preview.
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await buildOpsDigest()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Ops digest cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
