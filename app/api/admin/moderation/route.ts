import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET: List moderation flags with filtering
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const entityType = searchParams.get('entityType')
    const severity = searchParams.get('severity')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Record<string, unknown> = {}
    if (status !== 'all') where.status = status
    if (entityType) where.entityType = entityType
    if (severity) where.severity = severity

    const [flags, total, stats] = await Promise.all([
      prisma.moderationFlag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.moderationFlag.count({ where }),
      prisma.moderationFlag.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    const statusCounts = Object.fromEntries(stats.map(s => [s.status, s._count]))

    return NextResponse.json({
      flags,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      stats: statusCounts,
    })
  } catch (error) {
    console.error('Moderation flags error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Review/action a moderation flag
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, actionTaken } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const flag = await prisma.moderationFlag.update({
      where: { id },
      data: {
        status,
        actionTaken: actionTaken || null,
        reviewedBy: decoded.userId,
        reviewedAt: new Date(),
      },
    })

    // If action involves suspending user, do it
    if (actionTaken === 'suspended' && flag.userId) {
      await prisma.user.update({
        where: { id: flag.userId },
        data: { suspended: true },
      })
    }

    // If action involves removing content (message)
    if (actionTaken === 'content_removed' && flag.entityType === 'message') {
      await prisma.message.update({
        where: { id: flag.entityId },
        data: { content: '[Content removed by moderator]' },
      }).catch(() => {}) // Message might not exist
    }

    return NextResponse.json({ flag })
  } catch (error) {
    console.error('Moderation action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
