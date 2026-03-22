import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { notifyNewMessage } from '@/lib/notifications'
import { checkMessageForPII } from '@/lib/pii-filter'
import { logAudit } from '@/lib/audit'
import { translateText, type LanguageCode } from '@/lib/ai'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'
const messageLimiter = createRateLimiter({ interval: 60_000, limit: 30 })

// GET conversations list
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: decoded.userId }, { user2Id: decoded.userId }],
      },
      include: {
        user1: { select: { id: true, name: true, company: true, avatarUrl: true, role: true } },
        user2: { select: { id: true, name: true, company: true, avatarUrl: true, role: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, senderId: true, read: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    // Add unread count per conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: decoded.userId },
            read: false,
          },
        })
        return { ...conv, unreadCount: unread }
      })
    )

    return NextResponse.json({ conversations: withUnread })
  } catch (error) {
    console.error('Conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — start new conversation or send message
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = await messageLimiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Sending too many messages. Please slow down.' }, { status: 429 })
    }
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { recipientId, content, subject, bookingRef } = body

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient and content are required' }, { status: 400 })
    }

    // Check for PII (contact info) and circumvention attempts
    const piiCheck = checkMessageForPII(content)
    if (piiCheck.blocked) {
      // Log circumvention attempts for admin review
      if (piiCheck.flagged) {
        logAudit({
          userId: decoded.userId,
          action: 'CIRCUMVENTION_ATTEMPT',
          targetId: recipientId,
          details: { flagReason: piiCheck.flagReason, messageSnippet: content.slice(0, 100) },
          ipAddress: request.headers.get('x-client-ip') || undefined,
        }).catch(() => {})
      }
      return NextResponse.json({ error: piiCheck.reason }, { status: 400 })
    }

    if (recipientId === decoded.userId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Validate recipient exists
    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } })
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Find or create conversation
    const [u1, u2] = [decoded.userId, recipientId].sort()
    let conversation = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    })

    if (!conversation) {
      let autoSubject = subject || null

      // Auto-generate subject from booking reference if not provided
      if (!autoSubject && bookingRef) {
        const refBooking = await prisma.booking.findFirst({
          where: { trackingCode: bookingRef },
          select: { listing: { select: { originPort: true, destinationPort: true } } },
        })
        if (refBooking) {
          autoSubject = `${refBooking.listing.originPort} → ${refBooking.listing.destinationPort}`
        }
      }

      conversation = await prisma.conversation.create({
        data: {
          user1Id: u1,
          user2Id: u2,
          subject: autoSubject,
          bookingRef: bookingRef || null,
        },
      })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: decoded.userId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // Auto-translate if sender and recipient have different preferred languages
    prisma.user.findUnique({ where: { id: recipientId }, select: { preferredLanguage: true } })
      .then(async (recipientUser) => {
        const senderUser = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { preferredLanguage: true } })
        const recipientLang = recipientUser?.preferredLanguage as LanguageCode | undefined
        const senderLang = senderUser?.preferredLanguage as LanguageCode | undefined
        if (recipientLang && senderLang && recipientLang !== senderLang) {
          const translated = await translateText(content, recipientLang, senderLang)
          if (translated && translated !== content) {
            await prisma.message.update({
              where: { id: message.id },
              data: { translations: JSON.stringify({ [recipientLang]: translated }) },
            })
          }
        }
      })
      .catch((err) => console.error('Translation error:', err))

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    })

    // Notify recipient
    await notifyNewMessage({
      recipientId,
      senderId: decoded.userId,
      preview: content.slice(0, 200),
    })

    return NextResponse.json({ message, conversationId: conversation.id }, { status: 201 })
  } catch (error) {
    console.error('Message send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
