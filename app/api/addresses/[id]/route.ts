import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// PUT /api/addresses/[id] — Update a saved address
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const existing = await prisma.savedAddress.findUnique({ where: { id } })
    if (!existing || existing.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()

    if (body.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: decoded.userId, type: existing.type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    // Whitelist editable fields — never pass the raw body to Prisma, or a caller
    // could set userId (transfer the row to another account) or usageCount.
    const ALLOWED = ['label', 'type', 'address', 'city', 'region', 'country', 'postcode',
      'lat', 'lng', 'contactName', 'contactPhone', 'contactEmail', 'notes',
      'marinaName', 'berthNumber', 'yachtName', 'portAccessNotes', 'isDefault'] as const
    const data: Record<string, unknown> = {}
    for (const k of ALLOWED) if (k in body) data[k] = body[k]

    const updated = await prisma.savedAddress.update({ where: { id }, data })
    return NextResponse.json({ address: updated })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/addresses/[id] — Delete a saved address
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const existing = await prisma.savedAddress.findUnique({ where: { id } })
    if (!existing || existing.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.savedAddress.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
