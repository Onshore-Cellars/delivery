import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { runAgents } from '@/lib/agents'

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

// POST /api/cron/agents — run the operations agents. They produce proposals
// into the approval queue (and auto-execute only where policy allows).
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const summary = await runAgents()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Agents cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
