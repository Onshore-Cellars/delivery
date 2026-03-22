import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// GET /api/community - List community posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          _count: { select: { replies: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ])

    // Get author names
    const authorIds = [...new Set(posts.map(p => p.authorId))]
    const authors = authorIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, company: true, role: true, avatarUrl: true },
    }) : []
    const authorMap = Object.fromEntries(authors.map(a => [a.id, a]))

    const enrichedPosts = posts.map(p => ({
      ...p,
      author: authorMap[p.authorId] || { name: 'Unknown', role: 'SUPPLIER' },
      replyCount: p._count.replies,
    }))

    return NextResponse.json({ posts: enrichedPosts, total, limit, offset })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/community - Create a community post
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { title, content, category, tags } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const validCategories = ['routes', 'wanted', 'ports', 'customs', 'tips']
    const postCategory = validCategories.includes(category) ? category : 'routes'

    const post = await prisma.communityPost.create({
      data: {
        authorId: decoded.userId,
        title: title.trim(),
        content: content.trim(),
        category: postCategory,
        tags: tags ? JSON.stringify(tags) : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
