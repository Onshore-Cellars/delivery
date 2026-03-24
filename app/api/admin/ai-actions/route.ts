import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/ai-actions — list AI action queue
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Record<string, unknown> = {}
    if (status !== 'all') where.status = status
    if (type) where.type = type

    const [actions, total, statusCounts] = await Promise.all([
      prisma.aiAction.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aiAction.count({ where: where as never }),
      prisma.aiAction.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    return NextResponse.json({
      actions,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      stats: Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
    })
  } catch (error) {
    console.error('AI Actions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/ai-actions — create an AI action (usually from AI generation)
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { type, title, description, payload, aiModel, confidence, metadata } = body

    if (!type || !title || !payload) {
      return NextResponse.json({ error: 'type, title, and payload are required' }, { status: 400 })
    }

    const action = await prisma.aiAction.create({
      data: {
        type,
        title: String(title).trim(),
        description: description || null,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        aiModel: aiModel || null,
        confidence: confidence || null,
        createdBy: 'ai',
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      },
    })

    return NextResponse.json({ action }, { status: 201 })
  } catch (error) {
    console.error('AI Actions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/ai-actions — approve, reject, or edit an action
export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, action: reviewAction, editedPayload } = body

    if (!id || !reviewAction) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'edit'].includes(reviewAction)) {
      return NextResponse.json({ error: 'action must be approve, reject, or edit' }, { status: 400 })
    }

    const existing = await prisma.aiAction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Action already reviewed' }, { status: 400 })
    }

    if (reviewAction === 'reject') {
      const updated = await prisma.aiAction.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
        },
      })
      return NextResponse.json({ action: updated })
    }

    if (reviewAction === 'edit') {
      if (!editedPayload) {
        return NextResponse.json({ error: 'editedPayload required for edit action' }, { status: 400 })
      }
      const updated = await prisma.aiAction.update({
        where: { id },
        data: {
          payload: typeof editedPayload === 'string' ? editedPayload : JSON.stringify(editedPayload),
        },
      })
      return NextResponse.json({ action: updated })
    }

    // APPROVE — execute the action
    const payload = JSON.parse(existing.payload)
    let result: Record<string, unknown> = {}
    let executeError: string | null = null

    try {
      switch (existing.type) {
        case 'draft_campaign': {
          // Create the campaign
          const where: Record<string, unknown> = { email: { not: null }, opted_out: false }
          if (payload.targetCategory) where.category = payload.targetCategory
          if (payload.targetPriority) where.priority = payload.targetPriority

          const contacts = await prisma.crmContact.findMany({
            where: where as never,
            select: { id: true, email: true, name: true },
          })

          const campaign = await prisma.crmCampaign.create({
            data: {
              name: payload.name,
              subject: payload.subject,
              htmlBody: payload.htmlBody,
              status: 'draft',
            },
          })

          if (contacts.length > 0) {
            await prisma.crmCampaignRecipient.createMany({
              data: contacts.map(c => ({
                campaignId: campaign.id,
                contactId: c.id,
                email: c.email!,
                status: 'pending',
              })),
            })
          }

          result = { campaignId: campaign.id, recipientCount: contacts.length }
          break
        }

        case 'draft_social': {
          const post = await prisma.socialPost.create({
            data: {
              platform: payload.platform || 'linkedin',
              type: payload.type || 'post',
              content: payload.content,
              hashtags: payload.hashtags || null,
              mediaUrl: payload.mediaUrl || null,
              status: payload.scheduledAt ? 'scheduled' : 'draft',
              scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
            },
          })
          result = { postId: post.id }
          break
        }

        case 'draft_email': {
          if (payload.to && payload.subject && payload.body) {
            const success = await sendEmail({
              to: payload.to,
              subject: payload.subject,
              html: payload.body,
            })
            result = { sent: success, to: payload.to }
          }
          break
        }

        case 'suggest_followup':
        case 'auto_segment':
        case 'analyze_contacts': {
          // These are informational — just mark as executed
          result = { executed: true, data: payload }
          break
        }

        default:
          result = { executed: true }
      }
    } catch (err) {
      executeError = String(err)
    }

    const updated = await prisma.aiAction.update({
      where: { id },
      data: {
        status: executeError ? 'failed' : 'executed',
        reviewedBy: admin.userId,
        reviewedAt: new Date(),
        executedAt: new Date(),
        result: JSON.stringify(result),
        error: executeError,
      },
    })

    return NextResponse.json({ action: updated, result })
  } catch (error) {
    console.error('AI Actions PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/ai-actions — delete actions
export async function DELETE(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { ids } = body

    if (!ids?.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    await prisma.aiAction.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('AI Actions DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
