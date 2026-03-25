import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') return null
    return decoded
  } catch { return null }
}

export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''

    // Build where clause
    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (userId) where.userId = userId

    // Fetch logs and total count
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Collect unique user IDs and fetch user details
    const userIds = [...new Set(logs.map((log) => log.userId).filter(Boolean))] as string[]
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : []
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Attach user info to each log
    const logsWithUser = logs.map((log) => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || null : null,
    }))

    // Compute stats
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    const [today, thisWeek] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfWeek } } }),
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      logs: logsWithUser,
      pagination: { page, pages, total },
      stats: { total, today, thisWeek },
    })
  } catch (error) {
    console.error('Activity log fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
