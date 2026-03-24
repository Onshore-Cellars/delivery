import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateNotificationTemplate } from '@/lib/ai'

// GET: List all notification templates
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { type: 'asc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Notification templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create or update a notification template
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { type, channel, subject, htmlBody, pushTitle, pushBody, smsBody, active, generateWithAI } = body

    // AI generation mode
    if (generateWithAI && type) {
      const generated = await generateNotificationTemplate(type, channel || 'email')
      if (!generated) {
        return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
      }
      return NextResponse.json({ template: { type, channel: channel || 'email', ...generated } })
    }

    if (!type || !subject) {
      return NextResponse.json({ error: 'type and subject are required' }, { status: 400 })
    }

    const template = await prisma.notificationTemplate.upsert({
      where: { type_channel: { type, channel: channel || 'all' } },
      create: {
        type,
        channel: channel || 'all',
        subject,
        htmlBody: htmlBody || '',
        pushTitle: pushTitle || null,
        pushBody: pushBody || null,
        smsBody: smsBody || null,
        active: active !== false,
      },
      update: {
        subject,
        htmlBody: htmlBody || '',
        pushTitle: pushTitle || null,
        pushBody: pushBody || null,
        smsBody: smsBody || null,
        active: active !== false,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Notification template save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove a template
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.notificationTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
