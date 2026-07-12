import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { executeAgentTask } from '@/lib/agents'

export const runtime = 'nodejs'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/agent-tasks/[id]  { action: 'approve'|'reject', feedback? }
// Approve → execute the action. Reject → record the decision (fed back to the
// agent as a training signal). Feedback is stored either way.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const action = body.action
  const feedback = typeof body.feedback === 'string' ? body.feedback.slice(0, 1000) : null

  const task = await prisma.agentTask.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (!['PENDING'].includes(task.status)) {
    return NextResponse.json({ error: `Task is already ${task.status}` }, { status: 400 })
  }

  if (action === 'reject') {
    await prisma.agentTask.update({
      where: { id },
      data: { status: 'REJECTED', decidedById: admin.userId, decidedAt: new Date(), feedback },
    })
    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }

  if (action === 'approve') {
    await prisma.agentTask.update({
      where: { id },
      data: { status: 'APPROVED', decidedById: admin.userId, decidedAt: new Date(), feedback },
    })
    const outcome = await executeAgentTask(id)
    const updated = await prisma.agentTask.findUnique({ where: { id }, select: { status: true, executionResult: true, error: true } })
    return NextResponse.json({ ok: outcome.ok, ...updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
