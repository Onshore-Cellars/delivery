import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/crm/social — list social posts with filtering
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (platform) where.platform = platform
    if (status) where.status = status

    const [posts, stats] = await Promise.all([
      prisma.socialPost.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.socialPost.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    // Aggregate stats
    const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0)
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0)
    const totalComments = posts.reduce((s, p) => s + p.comments, 0)
    const totalShares = posts.reduce((s, p) => s + p.shares, 0)

    return NextResponse.json({
      posts,
      stats: {
        total: posts.length,
        statusBreakdown: stats,
        engagement: { impressions: totalImpressions, likes: totalLikes, comments: totalComments, shares: totalShares },
      },
    })
  } catch (error) {
    console.error('Social GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/social — create/schedule a social post
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { platform, type, content, mediaUrl, hashtags, scheduledAt, status } = body

    if (!platform || !content) {
      return NextResponse.json({ error: 'platform and content are required' }, { status: 400 })
    }

    if (!['linkedin', 'instagram'].includes(platform)) {
      return NextResponse.json({ error: 'Platform must be linkedin or instagram' }, { status: 400 })
    }

    const post = await prisma.socialPost.create({
      data: {
        platform,
        type: type || 'post',
        content: String(content).trim(),
        mediaUrl: mediaUrl || null,
        hashtags: hashtags || null,
        status: status || (scheduledAt ? 'scheduled' : 'draft'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Social POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/crm/social — update a social post (edit, update metrics, publish)
export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // If publishing, set publishedAt
    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = new Date()
    }

    // Handle scheduledAt conversion
    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt)
    }

    const post = await prisma.socialPost.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Social PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/social — delete social posts
export async function DELETE(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { ids } = body

    if (!ids?.length) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    await prisma.socialPost.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('Social DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
