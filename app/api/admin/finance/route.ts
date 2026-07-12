import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export const runtime = 'nodejs'

const round = (n: number) => Math.round(n * 100) / 100

// GET /api/admin/finance?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
// VAT / finance report over a period: net revenue, VAT collected (broken down
// by treatment, rate and country), platform fees, carrier payouts and refunds.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const format = searchParams.get('format')

    // Default to the current calendar year to date.
    const now = new Date()
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), 0, 1)
    const to = toStr ? new Date(toStr) : now
    // Make `to` inclusive of the whole day.
    to.setHours(23, 59, 59, 999)

    // Paid bookings in the window keyed on paidAt (the tax point).
    // VAT is due when payment is captured, so count every booking whose payment
    // was captured in the window (PAID or later-refunded — all have paidAt).
    // Refunds are reclaimed separately below, keyed on when they happened.
    const paid = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] }, paidAt: { gte: from, lte: to } },
      select: {
        currency: true, totalPrice: true, platformFee: true, carrierPayout: true,
        vatAmount: true, vatRate: true, vatTreatment: true, vatCustomerCountry: true, paidAt: true,
      },
    })
    // Refunds in the window — include PARTIALLY_REFUNDED, and reverse only the
    // ACTUAL amount refunded (refundedAmount), not the full booking snapshot.
    const refunded = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] }, updatedAt: { gte: from, lte: to } },
      select: { currency: true, totalPrice: true, vatAmount: true, refundedAmount: true },
    })
    // The refunded amount is gross; split it back into net + VAT at the booking's
    // effective VAT ratio so the VAT reversed is proportional to what was refunded.
    const refundParts = refunded.map(b => {
      const gross = b.totalPrice + (b.vatAmount || 0)
      const refundedGross = Math.min(b.refundedAmount || 0, gross)
      const vatShare = gross > 0 ? (b.vatAmount || 0) / gross : 0
      return { currency: b.currency, gross: refundedGross, vat: Math.round(refundedGross * vatShare * 100) / 100 }
    })

    // VAT is filed per currency, so every figure is grouped by currency.
    const currencies = Array.from(new Set([...paid, ...refunded].map(b => b.currency))).sort()

    const groupBy = <K extends string | number>(rows: typeof paid, key: (b: typeof paid[number]) => K) => {
      const m = new Map<K, { count: number; net: number; vat: number }>()
      for (const b of rows) {
        const k = key(b)
        const g = m.get(k) || { count: 0, net: 0, vat: 0 }
        g.count++; g.net += b.totalPrice; g.vat += b.vatAmount || 0
        m.set(k, g)
      }
      return Array.from(m.entries()).map(([k, v]) => ({ key: String(k), count: v.count, net: round(v.net), vat: round(v.vat) }))
        .sort((a, b) => b.vat - a.vat)
    }

    const buildForCurrency = (cur: string) => {
      const p = paid.filter(b => b.currency === cur)
      const rp = refundParts.filter(r => r.currency === cur)
      const vatCollected = round(p.reduce((s, b) => s + (b.vatAmount || 0), 0))
      const vatReversed = round(rp.reduce((s, r) => s + r.vat, 0))
      return {
        currency: cur,
        summary: {
          bookings: p.length,
          netRevenue: round(p.reduce((s, b) => s + b.totalPrice, 0)),
          vatCollected,
          grossRevenue: round(p.reduce((s, b) => s + b.totalPrice + (b.vatAmount || 0), 0)),
          platformFees: round(p.reduce((s, b) => s + b.platformFee, 0)),
          carrierPayouts: round(p.reduce((s, b) => s + b.carrierPayout, 0)),
          refunds: rp.length,
          refundedGross: round(rp.reduce((s, r) => s + r.gross, 0)),
          vatReversed,
          netVatDue: round(vatCollected - vatReversed),
        },
        byTreatment: groupBy(p, b => b.vatTreatment || 'UNSPECIFIED'),
        byRate: groupBy(p, b => `${b.vatRate ?? 0}%`),
        byCountry: groupBy(p, b => b.vatCustomerCountry || 'UNKNOWN'),
      }
    }

    const byCurrency = currencies.map(buildForCurrency)

    const report = {
      period: { from: from.toISOString(), to: to.toISOString() },
      currencies,
      byCurrency,
    }

    if (format === 'csv') {
      const lines: string[] = []
      lines.push(`Onshore VAT / Finance report`)
      lines.push(`Period,${from.toISOString().slice(0, 10)},${to.toISOString().slice(0, 10)}`)
      for (const c of byCurrency) {
        const s = c.summary
        lines.push('')
        lines.push(`=== ${c.currency} ===`)
        lines.push('Summary,Value')
        lines.push(`Paid bookings,${s.bookings}`)
        lines.push(`Net revenue,${s.netRevenue}`)
        lines.push(`VAT collected,${s.vatCollected}`)
        lines.push(`Gross revenue,${s.grossRevenue}`)
        lines.push(`Platform fees,${s.platformFees}`)
        lines.push(`Carrier payouts,${s.carrierPayouts}`)
        lines.push(`Refunds,${s.refunds}`)
        lines.push(`Refunded gross,${s.refundedGross}`)
        lines.push(`VAT reversed,${s.vatReversed}`)
        lines.push(`Net VAT due,${s.netVatDue}`)
        lines.push('')
        lines.push('VAT by treatment,Count,Net,VAT')
        for (const r of c.byTreatment) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
        lines.push('VAT by rate,Count,Net,VAT')
        for (const r of c.byRate) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
        lines.push('VAT by customer country,Count,Net,VAT')
        for (const r of c.byCountry) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
      }
      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="onshore-vat-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Finance report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
