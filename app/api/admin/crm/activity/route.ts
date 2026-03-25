import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/crm/activity — list audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (action) where.action = action
    if (userId) where.userId = userId
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [logs, total, actionCounts] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 20,
      }),
    ])

    // Collect user IDs to look up names
    const userIds = new Set<string>()
    for (const log of logs) {
      if (log.userId) userIds.add(log.userId)
      if (log.targetId) userIds.add(log.targetId)
    }

    const users = userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true, email: true, role: true },
        })
      : []

    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    const enrichedLogs = logs.map(log => ({
      ...log,
      details: log.details ? (() => { try { return JSON.parse(log.details) } catch { return log.details } })() : null,
      user: log.userId ? userMap[log.userId] || null : null,
      target: log.targetId ? userMap[log.targetId] || null : null,
    }))

    const actions = actionCounts.map(a => ({ action: a.action, count: a._count.action }))

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      actions,
    })
  } catch (error) {
    console.error('Activity log error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
