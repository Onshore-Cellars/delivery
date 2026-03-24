import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { moderateContent } from '@/lib/ai'

// POST: Run AI moderation on content — can scan individual items or bulk scan
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    // Scan a single piece of content
    if (action === 'scan_content') {
      const { content, entityType, entityId, userId } = body
      if (!content || !entityType) {
        return NextResponse.json({ error: 'content and entityType required' }, { status: 400 })
      }

      const result = await moderateContent(content, entityType)
      if (!result) {
        return NextResponse.json({ error: 'Moderation failed' }, { status: 500 })
      }

      // Save flag if content is flagged
      if (result.flagged) {
        await prisma.moderationFlag.create({
          data: {
            entityType,
            entityId: entityId || 'manual-scan',
            userId: userId || null,
            content: content.slice(0, 2000),
            reason: result.reason || 'other',
            severity: result.severity,
            aiScore: result.confidence,
            aiExplanation: result.explanation,
          },
        })
      }

      return NextResponse.json({ result })
    }

    // Bulk scan recent messages
    if (action === 'scan_messages') {
      const hours = parseInt(body.hours || '24')
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      const messages = await prisma.message.findMany({
        where: {
          createdAt: { gte: since },
          type: 'TEXT',
        },
        select: {
          id: true,
          content: true,
          senderId: true,
          conversationId: true,
          createdAt: true,
          sender: { select: { name: true } },
          conversation: { select: { subject: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })

      let flagged = 0
      const results: Array<{ messageId: string; sender: string; flagged: boolean; reason: string | null }> = []

      for (const msg of messages) {
        // Check if already flagged
        const existing = await prisma.moderationFlag.findFirst({
          where: { entityType: 'message', entityId: msg.id },
        })
        if (existing) continue

        const result = await moderateContent(msg.content, 'message', {
          userName: msg.sender.name,
          conversationSubject: msg.conversation.subject || undefined,
        })

        if (result?.flagged) {
          flagged++
          await prisma.moderationFlag.create({
            data: {
              entityType: 'message',
              entityId: msg.id,
              userId: msg.senderId,
              content: msg.content.slice(0, 2000),
              reason: result.reason || 'other',
              severity: result.severity,
              aiScore: result.confidence,
              aiExplanation: result.explanation,
            },
          })
          results.push({ messageId: msg.id, sender: msg.sender.name, flagged: true, reason: result.reason })
        }
      }

      return NextResponse.json({ scanned: messages.length, flagged, results })
    }

    // Bulk scan recent reviews
    if (action === 'scan_reviews') {
      const reviews = await prisma.review.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true, comment: true, authorId: true, author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      let flagged = 0
      for (const review of reviews) {
        if (!review.comment) continue
        const existing = await prisma.moderationFlag.findFirst({
          where: { entityType: 'review', entityId: review.id },
        })
        if (existing) continue

        const result = await moderateContent(review.comment, 'review', { userName: review.author.name })
        if (result?.flagged) {
          flagged++
          await prisma.moderationFlag.create({
            data: {
              entityType: 'review',
              entityId: review.id,
              userId: review.authorId,
              content: review.comment.slice(0, 2000),
              reason: result.reason || 'other',
              severity: result.severity,
              aiScore: result.confidence,
              aiExplanation: result.explanation,
            },
          })
        }
      }

      return NextResponse.json({ scanned: reviews.length, flagged })
    }

    // Scan listings
    if (action === 'scan_listings') {
      const listings = await prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, title: true, description: true, carrierId: true, carrier: { select: { name: true } } },
        take: 100,
      })

      let flagged = 0
      for (const listing of listings) {
        const text = `${listing.title} ${listing.description || ''}`
        const existing = await prisma.moderationFlag.findFirst({
          where: { entityType: 'listing', entityId: listing.id },
        })
        if (existing) continue

        const result = await moderateContent(text, 'listing', { userName: listing.carrier.name })
        if (result?.flagged) {
          flagged++
          await prisma.moderationFlag.create({
            data: {
              entityType: 'listing',
              entityId: listing.id,
              userId: listing.carrierId,
              content: text.slice(0, 2000),
              reason: result.reason || 'other',
              severity: result.severity,
              aiScore: result.confidence,
              aiExplanation: result.explanation,
            },
          })
        }
      }

      return NextResponse.json({ scanned: listings.length, flagged })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('AI moderation scan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
