import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { AGENTS, runAgents } from '@/lib/agents'

export const runtime = 'nodejs'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/agent-tasks?status=&team= — the operations queue + policies.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'
  const team = searchParams.get('team') || undefined

  const where: Record<string, unknown> = {}
  if (status !== 'ALL') where.status = status
  if (team) where.team = team

  const [tasks, policies, counts] = await Promise.all([
    prisma.agentTask.findMany({ where: where as never, orderBy: [{ status: 'asc' }, { confidence: 'desc' }, { createdAt: 'desc' }], take: 200 }),
    prisma.agentPolicy.findMany(),
    prisma.agentTask.groupBy({ by: ['status'], _count: true }),
  ])

  // The catalogue of known agents (so the UI can render policy toggles even
  // before any task exists for a kind).
  const catalogue = AGENTS.map(a => ({ team: a.team, kind: a.kind, label: a.label, description: a.description }))
  const policyMap = Object.fromEntries(policies.map(p => [p.key, p]))

  return NextResponse.json({
    tasks: tasks.map(t => ({ ...t, payload: safeJson(t.payload) })),
    catalogue: catalogue.map(c => ({ ...c, policy: policyMap[`${c.team}:${c.kind}`] || { autoApprove: false, minConfidence: 0.85 } })),
    counts: Object.fromEntries(counts.map(c => [c.status, c._count])),
  })
}

// POST /api/admin/agent-tasks  { action: 'run', teams?: string[] } — run agents now.
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const body = await request.json().catch(() => ({}))
  if (body.action === 'run') {
    const teams = Array.isArray(body.teams) && body.teams.length ? body.teams : undefined
    const summary = await runAgents(teams)
    return NextResponse.json({ summary })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

function safeJson(s: string) { try { return JSON.parse(s) } catch { return {} } }
