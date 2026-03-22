import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// PATCH /api/community/[id] - Edit a community post
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, category, tags, pinned } = body

    const validCategories = ['general', 'routes', 'tips', 'wanted', 'services', 'news']
    const data: Record<string, unknown> = {}
    if (title?.trim()) data.title = title.trim()
    if (content?.trim()) data.content = content.trim()
    if (category && validCategories.includes(category)) data.category = category
    if (tags !== undefined) data.tags = tags ? JSON.stringify(tags) : null
    // Only admins can pin/unpin
    if (pinned !== undefined && decoded.role === 'ADMIN') data.pinned = pinned

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.communityPost.update({ where: { id }, data })
    return NextResponse.json({ post: updated })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/community/[id] - Delete a community post
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const post = await prisma.communityPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.communityPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
