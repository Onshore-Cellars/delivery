import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET messages in a conversation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user1: { select: { id: true, name: true, company: true, avatarUrl: true, role: true, phone: true, email: true } },
        user2: { select: { id: true, name: true, company: true, avatarUrl: true, role: true, phone: true, email: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.user1Id !== decoded.userId && conversation.user2Id !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: decoded.userId },
        read: false,
      },
      data: { read: true, readAt: new Date() },
    })

    const otherUser = conversation.user1Id === decoded.userId ? conversation.user2 : conversation.user1

    return NextResponse.json({ conversation, messages, otherUser })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
