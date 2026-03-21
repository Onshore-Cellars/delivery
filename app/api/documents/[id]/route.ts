import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// PATCH /api/documents/[id] - Update own document
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (doc.userId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, fileUrl, documentNumber, issuingCountry, issueDate, expiryDate } = body

    const data: Record<string, unknown> = {}
    if (name?.trim()) data.name = name.trim()
    if (fileUrl !== undefined) data.fileUrl = fileUrl || null
    if (documentNumber !== undefined) data.documentNumber = documentNumber || null
    if (issuingCountry !== undefined) data.issuingCountry = issuingCountry || null
    if (issueDate !== undefined) data.issueDate = issueDate ? new Date(issueDate) : null
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null
    // Reset to pending review when document is updated
    if (data.fileUrl || data.documentNumber) {
      data.status = 'PENDING'
      data.reviewNotes = null
      data.reviewedAt = null
      data.reviewedBy = null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.document.update({ where: { id }, data })
    return NextResponse.json({ document: updated })
  } catch (error) {
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete own document
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (doc.userId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
