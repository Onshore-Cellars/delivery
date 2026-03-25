import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/crm/emails — list emails from database
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'INBOX'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const starred = searchParams.get('starred')
    const unread = searchParams.get('unread')
    const contactId = searchParams.get('contactId')

    const where: Record<string, unknown> = {
      isArchived: false,
    }

    if (folder !== 'all') where.folder = folder
    if (starred === 'true') where.isStarred = true
    if (unread === 'true') where.isRead = false
    if (contactId) where.contactId = contactId

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
        { snippet: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [emails, total, unreadCount, starredCount] = await Promise.all([
      prisma.crmEmail.findMany({
        where: where as never,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: {
            select: { id: true, name: true, category: true, priority: true },
          },
        },
      }),
      prisma.crmEmail.count({ where: where as never }),
      prisma.crmEmail.count({ where: { isArchived: false, isRead: false } }),
      prisma.crmEmail.count({ where: { isArchived: false, isStarred: true } }),
    ])

    return NextResponse.json({
      emails,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      stats: { unread: unreadCount, starred: starredCount, total },
    })
  } catch (error) {
    console.error('CRM Emails GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/emails — send/reply to an email
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { to, cc, bcc, subject, htmlBody, textBody, replyToMessageId } = body

    if (!to || !subject || (!htmlBody && !textBody)) {
      return NextResponse.json({ error: 'to, subject, and body are required' }, { status: 400 })
    }

    // Sanitize HTML body
    const safeHtml = htmlBody
      ? (() => {
          const window = new JSDOM('').window
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const purify = createDOMPurify(window as any)
          return purify.sanitize(htmlBody)
        })()
      : undefined

    const emailOptions: { to: string; cc?: string; bcc?: string; subject: string; html: string; text?: string } = {
      to: String(to).trim(),
      subject: String(subject).trim(),
      html: safeHtml || textBody || '',
      text: textBody,
    }
    if (cc) emailOptions.cc = String(cc).trim()
    if (bcc) emailOptions.bcc = String(bcc).trim()

    const success = await sendEmail(emailOptions)

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Store in database as sent email
    const messageId = `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const email = await prisma.crmEmail.create({
      data: {
        messageId,
        folder: 'Sent',
        from: process.env.EMAIL_FROM || 'info@onshoredelivery.com',
        fromName: 'Onshore Delivery',
        to: String(to).trim(),
        cc: cc ? String(cc).trim() : null,
        subject: String(subject).trim(),
        textBody: textBody || null,
        htmlBody: safeHtml || null,
        snippet: textBody ? textBody.slice(0, 200) : subject,
        date: new Date(),
        isRead: true,
        inReplyTo: replyToMessageId || null,
      },
    })

    // Update CRM contact's lastEmailed if we can match
    const toEmail = String(to).trim().toLowerCase()
    await prisma.crmContact.updateMany({
      where: {
        OR: [
          { email: { equals: toEmail, mode: 'insensitive' } },
          { email2: { equals: toEmail, mode: 'insensitive' } },
        ],
      },
      data: { lastEmailed: new Date() },
    })

    return NextResponse.json({ success: true, email }, { status: 201 })
  } catch (error) {
    console.error('CRM Emails POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/crm/emails — update email flags (read, starred, archived)
export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { ids, updates } = body

    if (!ids?.length || !updates) {
      return NextResponse.json({ error: 'ids and updates required' }, { status: 400 })
    }

    const allowedFields = ['isRead', 'isStarred', 'isArchived']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) data[key] = Boolean(updates[key])
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid updates' }, { status: 400 })
    }

    await prisma.crmEmail.updateMany({
      where: { id: { in: ids } },
      data: data as never,
    })

    return NextResponse.json({ updated: ids.length })
  } catch (error) {
    console.error('CRM Emails PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/emails — delete emails
export async function DELETE(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { ids } = body

    if (!ids?.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    await prisma.crmEmail.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('CRM Emails DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
