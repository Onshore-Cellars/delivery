import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { findAgent } from '@/lib/agents'

export const runtime = 'nodejs'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// PATCH /api/admin/agent-policies  { team, kind, autoApprove?, minConfidence? }
// The graduation-to-autonomy dial: when autoApprove is on, matching proposals
// with confidence ≥ minConfidence execute without human review.
export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  const team = String(body.team || '')
  const kind = String(body.kind || '')
  if (!findAgent(team, kind)) return NextResponse.json({ error: 'Unknown agent' }, { status: 400 })

  const data: { autoApprove?: boolean; minConfidence?: number } = {}
  if (typeof body.autoApprove === 'boolean') data.autoApprove = body.autoApprove
  if (typeof body.minConfidence === 'number' && body.minConfidence >= 0 && body.minConfidence <= 1) data.minConfidence = body.minConfidence

  const key = `${team}:${kind}`
  const policy = await prisma.agentPolicy.upsert({
    where: { key },
    update: data,
    create: { key, team, kind, autoApprove: data.autoApprove ?? false, minConfidence: data.minConfidence ?? 0.85 },
  })
  return NextResponse.json({ policy })
}
