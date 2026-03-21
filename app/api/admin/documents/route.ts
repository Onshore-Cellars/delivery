import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// GET: All documents for admin review
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, company: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const counts = {
      pending: await prisma.document.count({ where: { status: 'PENDING' } }),
      verified: await prisma.document.count({ where: { status: 'VERIFIED' } }),
      rejected: await prisma.document.count({ where: { status: 'REJECTED' } }),
      expired: await prisma.document.count({ where: { status: 'EXPIRED' } }),
    }

    return NextResponse.json({ documents, counts })
  } catch (error) {
    console.error('Admin documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Verify or reject a document
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { documentId, action, reviewNotes } = body

    if (!documentId || !action) {
      return NextResponse.json({ error: 'documentId and action are required' }, { status: 400 })
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "verify" or "reject"' }, { status: 400 })
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { user: { select: { id: true, name: true } } },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: action === 'verify' ? 'VERIFIED' : 'REJECTED',
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
        reviewedBy: decoded.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, company: true, role: true } },
      },
    })

    // Notify the user
    await createNotification({
      userId: doc.user.id,
      type: action === 'verify' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      title: action === 'verify' ? 'Document Verified' : 'Document Rejected',
      message: action === 'verify'
        ? `Your ${doc.name} has been verified.`
        : `Your ${doc.name} was rejected.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
      linkUrl: '/profile',
    })

    return NextResponse.json({
      document: updatedDoc,
      message: `Document ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Admin document update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
