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
      return { gross: refundedGross, vat: Math.round(refundedGross * vatShare * 100) / 100 }
    })

    // Assume a single reporting currency (the platform's). If mixed, we still
    // sum but flag it — a real multi-currency report would group by currency.
    const currencies = Array.from(new Set([...paid, ...refunded].map(b => b.currency)))

    const summary = {
      bookings: paid.length,
      netRevenue: round(paid.reduce((s, b) => s + b.totalPrice, 0)),
      vatCollected: round(paid.reduce((s, b) => s + (b.vatAmount || 0), 0)),
      grossRevenue: round(paid.reduce((s, b) => s + b.totalPrice + (b.vatAmount || 0), 0)),
      platformFees: round(paid.reduce((s, b) => s + b.platformFee, 0)),
      carrierPayouts: round(paid.reduce((s, b) => s + b.carrierPayout, 0)),
      refunds: refunded.length,
      refundedGross: round(refundParts.reduce((s, r) => s + r.gross, 0)),
      vatReversed: round(refundParts.reduce((s, r) => s + r.vat, 0)),
      netVatDue: round(
        paid.reduce((s, b) => s + (b.vatAmount || 0), 0) - refundParts.reduce((s, r) => s + r.vat, 0),
      ),
    }

    // Group helper.
    const groupBy = <K extends string | number>(key: (b: typeof paid[number]) => K) => {
      const m = new Map<K, { count: number; net: number; vat: number }>()
      for (const b of paid) {
        const k = key(b)
        const g = m.get(k) || { count: 0, net: 0, vat: 0 }
        g.count++; g.net += b.totalPrice; g.vat += b.vatAmount || 0
        m.set(k, g)
      }
      return Array.from(m.entries()).map(([k, v]) => ({ key: String(k), count: v.count, net: round(v.net), vat: round(v.vat) }))
        .sort((a, b) => b.vat - a.vat)
    }

    const byTreatment = groupBy(b => b.vatTreatment || 'UNSPECIFIED')
    const byRate = groupBy(b => `${b.vatRate ?? 0}%`)
    const byCountry = groupBy(b => b.vatCustomerCountry || 'UNKNOWN')

    const report = {
      period: { from: from.toISOString(), to: to.toISOString() },
      currencies,
      summary,
      byTreatment,
      byRate,
      byCountry,
    }

    if (format === 'csv') {
      const lines: string[] = []
      const sym = currencies[0] || ''
      lines.push(`Onshore VAT / Finance report`)
      lines.push(`Period,${from.toISOString().slice(0, 10)},${to.toISOString().slice(0, 10)}`)
      lines.push(`Currency,${sym}`)
      lines.push('')
      lines.push('Summary,Value')
      lines.push(`Paid bookings,${summary.bookings}`)
      lines.push(`Net revenue,${summary.netRevenue}`)
      lines.push(`VAT collected,${summary.vatCollected}`)
      lines.push(`Gross revenue,${summary.grossRevenue}`)
      lines.push(`Platform fees,${summary.platformFees}`)
      lines.push(`Carrier payouts,${summary.carrierPayouts}`)
      lines.push(`Refunds,${summary.refunds}`)
      lines.push(`Refunded gross,${summary.refundedGross}`)
      lines.push(`VAT reversed,${summary.vatReversed}`)
      lines.push(`Net VAT due,${summary.netVatDue}`)
      lines.push('')
      lines.push('VAT by treatment,Count,Net,VAT')
      for (const r of byTreatment) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
      lines.push('')
      lines.push('VAT by rate,Count,Net,VAT')
      for (const r of byRate) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
      lines.push('')
      lines.push('VAT by customer country,Count,Net,VAT')
      for (const r of byCountry) lines.push(`${r.key},${r.count},${r.net},${r.vat}`)
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
