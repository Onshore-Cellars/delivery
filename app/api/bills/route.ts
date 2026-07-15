import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// ─── /api/bills — list & create user-confirmed bills ────────────────────────

interface LineItem { description: string; quantity: number | null; unitPrice: number | null; amount: number | null }

function parseBillBody(body: Record<string, unknown>) {
  const supplierName = typeof body.supplierName === 'string' ? body.supplierName.trim() : ''
  const total = typeof body.total === 'number' ? body.total : parseFloat(String(body.total))
  const lineItems: LineItem[] = Array.isArray(body.lineItems)
    ? (body.lineItems as LineItem[]).filter(li => li && typeof li.description === 'string').slice(0, 200)
    : []
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
  const date = (v: unknown) => {
    if (typeof v !== 'string' || !v) return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  return {
    supplierName,
    total,
    invoiceNumber: typeof body.invoiceNumber === 'string' && body.invoiceNumber ? body.invoiceNumber : null,
    invoiceDate: date(body.invoiceDate),
    dueDate: date(body.dueDate),
    currency: typeof body.currency === 'string' && /^[A-Z]{3}$/.test(body.currency) ? body.currency : 'EUR',
    subtotal: num(body.subtotal),
    taxAmount: num(body.taxAmount),
    category: typeof body.category === 'string' && body.category ? body.category : null,
    notes: typeof body.notes === 'string' && body.notes ? body.notes.slice(0, 2000) : null,
    lineItems: lineItems.length ? JSON.stringify(lineItems) : null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: decoded.userId }
    if (status) where.status = status

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ])

    return NextResponse.json({ bills, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[bills] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const data = parseBillBody(body)

    if (!data.supplierName) {
      return NextResponse.json({ error: 'supplierName is required' }, { status: 400 })
    }
    if (!isFinite(data.total)) {
      return NextResponse.json({ error: 'total must be a number' }, { status: 400 })
    }

    const bill = await prisma.bill.create({
      data: {
        ...data,
        userId: decoded.userId,
        status: 'confirmed',
        fileUrl: typeof body.fileUrl === 'string' && body.fileUrl && !body.fileUrl.startsWith('data:') ? body.fileUrl : null,
        fileKey: typeof body.fileKey === 'string' && body.fileKey ? body.fileKey : null,
        extractedRaw: typeof body.extractedRaw === 'string' ? body.extractedRaw.slice(0, 20000) : null,
      },
    })

    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('[bills] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
