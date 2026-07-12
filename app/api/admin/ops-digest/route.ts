import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { buildOpsDigest } from '@/lib/agents/digest'

export const runtime = 'nodejs'
export const maxDuration = 60

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/ops-digest — build today's brief WITHOUT delivering it, for a
// live preview in the admin UI (no notifications, no emails sent).
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  try {
    const result = await buildOpsDigest({ deliver: false })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Ops digest preview error:', error)
    return NextResponse.json({ error: 'Failed to build digest' }, { status: 500 })
  }
}

// POST /api/admin/ops-digest — build AND deliver now (send to all admins).
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  try {
    const result = await buildOpsDigest({ deliver: true })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Ops digest send error:', error)
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 })
  }
}
