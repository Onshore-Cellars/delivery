import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'

// ─── /api/bills/[id] — get, edit (fix misreads), delete ─────────────────────

async function authBill(request: NextRequest, id: string) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const decoded = verifyToken(token)
  if (!decoded) return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  const bill = await prisma.bill.findUnique({ where: { id } })
  if (!bill || bill.userId !== decoded.userId) {
    return { error: NextResponse.json({ error: 'Bill not found' }, { status: 404 }) }
  }
  return { bill, decoded }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await authBill(request, id)
    if ('error' in res) return res.error
    return NextResponse.json({ bill: res.bill })
  } catch (error) {
    console.error('[bills/:id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await authBill(request, id)
    if ('error' in res) return res.error

    const body = await request.json()
    const data: Record<string, unknown> = {}
    const num = (v: unknown) => (v === null || v === '' ? null : Number(v))
    const date = (v: unknown) => {
      if (v === null || v === '') return null
      const d = new Date(String(v))
      return isNaN(d.getTime()) ? undefined : d
    }

    if (typeof body.supplierName === 'string' && body.supplierName.trim()) data.supplierName = body.supplierName.trim()
    if ('invoiceNumber' in body) data.invoiceNumber = typeof body.invoiceNumber === 'string' && body.invoiceNumber ? body.invoiceNumber : null
    if ('invoiceDate' in body) { const d = date(body.invoiceDate); if (d !== undefined) data.invoiceDate = d }
    if ('dueDate' in body) { const d = date(body.dueDate); if (d !== undefined) data.dueDate = d }
    if (typeof body.currency === 'string' && /^[A-Z]{3}$/.test(body.currency)) data.currency = body.currency
    if ('subtotal' in body && (body.subtotal === null || isFinite(Number(body.subtotal)))) data.subtotal = num(body.subtotal)
    if ('taxAmount' in body && (body.taxAmount === null || isFinite(Number(body.taxAmount)))) data.taxAmount = num(body.taxAmount)
    if ('total' in body && isFinite(Number(body.total))) data.total = Number(body.total)
    if ('category' in body) data.category = typeof body.category === 'string' && body.category ? body.category : null
    if ('notes' in body) data.notes = typeof body.notes === 'string' && body.notes ? body.notes.slice(0, 2000) : null
    if (Array.isArray(body.lineItems)) {
      const items = body.lineItems.filter((li: unknown) => li && typeof (li as { description?: unknown }).description === 'string').slice(0, 200)
      data.lineItems = items.length ? JSON.stringify(items) : null
    }
    if (body.status === 'confirmed' || body.status === 'paid') data.status = body.status

    const bill = await prisma.bill.update({ where: { id }, data })
    return NextResponse.json({ bill })
  } catch (error) {
    console.error('[bills/:id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await authBill(request, id)
    if ('error' in res) return res.error

    if (res.bill.fileKey) {
      await deleteFile(res.bill.fileKey).catch(() => {})
    }
    await prisma.bill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bills/:id] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
