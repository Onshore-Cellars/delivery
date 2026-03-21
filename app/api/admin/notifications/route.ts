import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// GET: Recent platform notifications
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Send a broadcast notification to all users or a specific role
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, targetRole, targetUserId } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 })
    }

    let users
    if (targetUserId) {
      // Send to specific user
      users = await prisma.user.findMany({
        where: { id: targetUserId },
        select: { id: true },
      })
    } else if (targetRole) {
      // Send to all users of a specific role
      users = await prisma.user.findMany({
        where: { role: targetRole, suspended: false },
        select: { id: true },
      })
    } else {
      // Broadcast to all non-suspended users
      users = await prisma.user.findMany({
        where: { suspended: false },
        select: { id: true },
      })
    }

    let sent = 0
    for (const user of users) {
      await createNotification({
        userId: user.id,
        type: 'SYSTEM',
        title,
        message,
      })
      sent++
    }

    return NextResponse.json({
      message: `Notification sent to ${sent} user${sent !== 1 ? 's' : ''}`,
      sent,
    })
  } catch (error) {
    console.error('Admin broadcast error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
