import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateSocialPost, generateCampaignDraft, generateFollowUpSuggestions, analyzeContactDatabase } from '@/lib/ai'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/ai-actions/generate — AI generates actions for the queue
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { generateType, params } = body

    if (!generateType) {
      return NextResponse.json({ error: 'generateType is required' }, { status: 400 })
    }

    switch (generateType) {
      case 'social_post': {
        const result = await generateSocialPost(params?.platform || 'linkedin', params?.topic, params?.tone)
        if (!result) {
          return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
        }

        const action = await prisma.aiAction.create({
          data: {
            type: 'draft_social',
            title: `Social post: ${result.topic || params?.topic || 'General'}`,
            description: result.reasoning,
            payload: JSON.stringify({
              platform: params?.platform || 'linkedin',
              content: result.content,
              hashtags: result.hashtags,
              type: result.type || 'post',
            }),
            aiModel: 'claude-sonnet-4-6',
            confidence: result.confidence || 0.8,
            createdBy: 'ai',
          },
        })

        return NextResponse.json({ action, preview: result })
      }

      case 'campaign': {
        const context = await getCrmContext()
        const result = await generateCampaignDraft(
          params?.goal || 'general engagement',
          params?.targetCategory,
          context
        )
        if (!result) {
          return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
        }

        const action = await prisma.aiAction.create({
          data: {
            type: 'draft_campaign',
            title: `Campaign: ${result.name || params?.goal || 'Untitled'}`,
            description: result.reasoning,
            payload: JSON.stringify({
              name: result.name,
              subject: result.subject,
              htmlBody: result.htmlBody,
              targetCategory: params?.targetCategory || null,
              targetPriority: params?.targetPriority || null,
            }),
            aiModel: 'claude-sonnet-4-6',
            confidence: result.confidence || 0.8,
            createdBy: 'ai',
          },
        })

        return NextResponse.json({ action, preview: result })
      }

      case 'followups': {
        const contacts = await prisma.crmContact.findMany({
          where: {
            email: { not: null },
            opted_out: false,
            priority: { in: ['high', 'medium'] },
          },
          orderBy: { lastEmailed: 'asc' },
          take: 20,
          select: {
            id: true, name: true, email: true, category: true,
            priority: true, country: true, notes: true, lastEmailed: true,
          },
        })

        const result = await generateFollowUpSuggestions(contacts)
        if (!result) {
          return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
        }

        // Create one action per follow-up suggestion
        const actions = []
        for (const suggestion of result.suggestions.slice(0, 5)) {
          const action = await prisma.aiAction.create({
            data: {
              type: 'suggest_followup',
              title: `Follow up: ${suggestion.contactName}`,
              description: suggestion.reason,
              payload: JSON.stringify({
                contactId: suggestion.contactId,
                contactName: suggestion.contactName,
                to: suggestion.email,
                subject: suggestion.subject,
                body: suggestion.body,
              }),
              aiModel: 'claude-sonnet-4-6',
              confidence: suggestion.priority === 'high' ? 0.9 : 0.7,
              createdBy: 'ai',
            },
          })
          actions.push(action)
        }

        return NextResponse.json({ actions, count: actions.length })
      }

      case 'analyze': {
        const context = await getCrmContext()
        const result = await analyzeContactDatabase(context)
        if (!result) {
          return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
        }

        const action = await prisma.aiAction.create({
          data: {
            type: 'analyze_contacts',
            title: 'CRM Database Analysis',
            description: 'AI analysis of your contact database with recommendations',
            payload: JSON.stringify(result),
            aiModel: 'claude-sonnet-4-6',
            confidence: 0.85,
            createdBy: 'ai',
          },
        })

        return NextResponse.json({ action, preview: result })
      }

      case 'social_batch': {
        // Generate a week's worth of social posts
        const platforms = ['linkedin', 'instagram']
        const topics = [
          'route announcement', 'industry tip', 'customer success',
          'behind the scenes', 'seasonal update', 'team spotlight', 'port highlight'
        ]
        const actions = []

        for (let i = 0; i < Math.min(params?.count || 5, 7); i++) {
          const platform = platforms[i % platforms.length]
          const topic = topics[i % topics.length]
          const result = await generateSocialPost(platform, topic, params?.tone)
          if (!result) continue

          const scheduledAt = new Date()
          scheduledAt.setDate(scheduledAt.getDate() + i + 1)
          scheduledAt.setHours(10, 0, 0, 0) // 10 AM

          const action = await prisma.aiAction.create({
            data: {
              type: 'draft_social',
              title: `${platform} — ${topic}`,
              description: result.reasoning,
              payload: JSON.stringify({
                platform,
                content: result.content,
                hashtags: result.hashtags,
                type: result.type || 'post',
                scheduledAt: scheduledAt.toISOString(),
              }),
              aiModel: 'claude-sonnet-4-6',
              confidence: result.confidence || 0.8,
              createdBy: 'ai',
            },
          })
          actions.push(action)
        }

        return NextResponse.json({ actions, count: actions.length })
      }

      default:
        return NextResponse.json({ error: `Unknown generateType: ${generateType}` }, { status: 400 })
    }
  } catch (error) {
    console.error('AI Generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getCrmContext() {
  const [contactCount, categories, recentCampaigns, socialPosts] = await Promise.all([
    prisma.crmContact.count(),
    prisma.crmContact.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 20,
    }),
    prisma.crmCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { name: true, status: true, sentCount: true, subject: true },
    }),
    prisma.socialPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { platform: true, content: true, status: true, impressions: true, likes: true },
    }),
  ])

  return {
    contactCount,
    categories: categories.map(c => ({ name: c.category, count: c._count })),
    recentCampaigns,
    recentSocialPosts: socialPosts,
  }
}
