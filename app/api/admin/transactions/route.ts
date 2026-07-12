import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export const runtime = 'nodejs'

const TYPES = ['CHARGE', 'PAYOUT', 'PAYOUT_REVERSAL', 'REFUND']

// GET /api/admin/transactions?from&to&type&q&format=csv
// The money ledger — every charge, payout, reversal and refund.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const q = searchParams.get('q')?.trim()
    const format = searchParams.get('format')
    const now = new Date()
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(now.getFullYear(), 0, 1)
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now
    to.setHours(23, 59, 59, 999)

    const where: Record<string, unknown> = { createdAt: { gte: from, lte: to } }
    if (type && TYPES.includes(type)) where.type = type
    if (q) {
      where.OR = [
        { stripeRef: { contains: q, mode: 'insensitive' } },
        { booking: { trackingCode: { contains: q, mode: 'insensitive' } } },
        { booking: { shipper: { name: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    const rows = await prisma.transaction.findMany({
      where: where as never,
      include: {
        booking: {
          select: {
            trackingCode: true,
            shipper: { select: { name: true } },
            listing: { select: { originPort: true, destinationPort: true, carrier: { select: { name: true, company: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: format === 'csv' ? 5000 : 300,
    })

    // Signed totals: money OUT of the platform is negative (payout, refund),
    // money IN is positive (charge); reversal returns money to the platform.
    const sign = (t: string) => (t === 'CHARGE' || t === 'PAYOUT_REVERSAL' ? 1 : -1)
    const totals: Record<string, { count: number; amount: number }> = {}
    for (const r of rows) {
      const g = totals[r.type] || { count: 0, amount: 0 }
      g.count++; g.amount = Math.round((g.amount + r.amount) * 100) / 100
      totals[r.type] = g
    }
    const netToPlatform = Math.round(rows.reduce((s, r) => s + sign(r.type) * r.amount, 0) * 100) / 100

    const shaped = rows.map(r => ({
      id: r.id,
      date: r.createdAt,
      type: r.type,
      amount: r.amount,
      currency: r.currency,
      stripeRef: r.stripeRef,
      note: r.note,
      tracking: r.booking?.trackingCode || null,
      party: r.type === 'PAYOUT' || r.type === 'PAYOUT_REVERSAL'
        ? (r.booking?.listing?.carrier?.company || r.booking?.listing?.carrier?.name || '—')
        : (r.booking?.shipper?.name || '—'),
      route: r.booking?.listing ? `${r.booking.listing.originPort} → ${r.booking.listing.destinationPort}` : null,
    }))

    if (format === 'csv') {
      const lines = ['Date,Type,Party,Route,Tracking,Amount,Currency,StripeRef,Note']
      for (const r of shaped) {
        lines.push([
          new Date(r.date).toISOString(), r.type, `"${r.party}"`, `"${r.route || ''}"`, r.tracking || '',
          r.amount.toFixed(2), r.currency, r.stripeRef || '', `"${(r.note || '').replace(/"/g, '""')}"`,
        ].join(','))
      }
      return new NextResponse(lines.join('\n'), {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="onshore-transactions.csv"` },
      })
    }

    return NextResponse.json({ transactions: shaped, totals, netToPlatform })
  } catch (error) {
    console.error('Transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
