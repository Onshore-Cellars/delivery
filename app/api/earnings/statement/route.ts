import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { currencySymbol } from '@/lib/stripe'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { BRAND } from '@/lib/invoice'

export const runtime = 'nodejs'

const round = (n: number) => Math.round(n * 100) / 100
const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// GET /api/earnings/statement?from&to[&format=csv|pdf]
// A carrier's earnings statement — delivered bookings with gross, commission and
// net payout, plus payout status. JSON by default, or CSV / PDF for download.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization')) || request.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(now.getFullYear(), 0, 1)
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now
    to.setHours(23, 59, 59, 999)
    const format = searchParams.get('format')

    const carrier = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { name: true, company: true, vatNumber: true },
    })

    const bookings = await prisma.booking.findMany({
      where: {
        listing: { carrierId: decoded.userId },
        status: 'DELIVERED',
        actualDelivery: { gte: from, lte: to },
      },
      select: {
        trackingCode: true, currency: true, totalPrice: true, platformFee: true, carrierPayout: true,
        actualDelivery: true, payoutTransferredAt: true, stripeTransferId: true,
        listing: { select: { originPort: true, destinationPort: true } },
      },
      orderBy: { actualDelivery: 'desc' },
    })

    const rows = bookings.map(b => ({
      date: b.actualDelivery,
      tracking: b.trackingCode || '—',
      route: `${b.listing.originPort} → ${b.listing.destinationPort}`,
      currency: b.currency,
      gross: b.totalPrice,
      commission: b.platformFee,
      net: b.carrierPayout,
      paidOut: !!b.payoutTransferredAt,
      transferRef: b.stripeTransferId,
    }))

    const totals = {
      count: rows.length,
      gross: round(rows.reduce((s, r) => s + r.gross, 0)),
      commission: round(rows.reduce((s, r) => s + r.commission, 0)),
      net: round(rows.reduce((s, r) => s + r.net, 0)),
      paidOut: round(rows.filter(r => r.paidOut).reduce((s, r) => s + r.net, 0)),
      awaiting: round(rows.filter(r => !r.paidOut).reduce((s, r) => s + r.net, 0)),
    }
    const currency = rows[0]?.currency || 'EUR'
    const sym = currencySymbol(currency)
    const period = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`

    if (format === 'csv') {
      const lines = ['Date,Tracking,Route,Gross,Commission,Net payout,Payout status,Transfer ref']
      for (const r of rows) {
        lines.push([fmtDate(r.date), r.tracking, `"${r.route}"`, r.gross.toFixed(2), r.commission.toFixed(2), r.net.toFixed(2), r.paidOut ? 'Paid out' : 'Awaiting', r.transferRef || ''].join(','))
      }
      lines.push('')
      lines.push(`Totals,,,${totals.gross},${totals.commission},${totals.net},Paid ${totals.paidOut} / Awaiting ${totals.awaiting},`)
      return new NextResponse(lines.join('\n'), {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="onshore-earnings-${period}.csv"` },
      })
    }

    if (format === 'pdf') {
      const pdf = await renderStatementPdf({ carrier, rows, totals, sym, currency, from, to })
      return new NextResponse(Buffer.from(pdf), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="onshore-earnings-${period}.pdf"` },
      })
    }

    return NextResponse.json({ period: { from: from.toISOString(), to: to.toISOString() }, currency, totals, rows })
  } catch (error) {
    console.error('Earnings statement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function renderStatementPdf(d: {
  carrier: { name: string; company: string | null; vatNumber: string | null } | null
  rows: { date: Date | null; tracking: string; route: string; gross: number; commission: number; net: number; paidOut: boolean }[]
  totals: { count: number; gross: number; commission: number; net: number; paidOut: number; awaiting: number }
  sym: string; currency: string; from: Date; to: Date
}): Promise<Uint8Array> {
  const A4 = { w: 595.28, h: 841.89 }, M = 44
  const doc = await PDFDocument.create()
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const clean = (s: string) => String(s ?? '').replace(/→/g, '->').replace(/[^\x20-\x7E]/g, '')
  const mny = (n: number) => `${d.currency === 'EUR' ? 'EUR ' : d.currency === 'GBP' ? 'GBP ' : d.sym}${n.toFixed(2)}`

  let page = doc.addPage([A4.w, A4.h])
  const right = A4.w - M
  const T = (s: string, x: number, y: number, size: number, color = BRAND.ink, b = false) => page.drawText(clean(s), { x, y, size, font: b ? bold : reg, color })
  const R = (s: string, x: number, y: number, size: number, color = BRAND.ink, b = false) => { const f = b ? bold : reg; page.drawText(clean(s), { x: x - f.widthOfTextAtSize(clean(s), size), y, size, font: f, color }) }

  // Header
  page.drawRectangle({ x: 0, y: A4.h - 96, width: A4.w, height: 96, color: BRAND.teal })
  page.drawCircle({ x: M + 6, y: A4.h - 38, size: 5, color: BRAND.brass })
  T('Onshore', M + 16, A4.h - 43, 19, BRAND.white, true)
  T('EARNINGS STATEMENT', M + 16, A4.h - 60, 8, rgb(0.81, 0.88, 0.86))
  R(`${fmtDate(d.from)} - ${fmtDate(d.to)}`, right, A4.h - 43, 10, BRAND.white, true)
  R(clean(d.carrier?.company || d.carrier?.name || ''), right, A4.h - 58, 9, rgb(0.81, 0.88, 0.86))
  if (d.carrier?.vatNumber) R(`VAT: ${d.carrier.vatNumber}`, right, A4.h - 70, 8, rgb(0.81, 0.88, 0.86))

  let y = A4.h - 120
  // Summary band
  const chips: [string, string][] = [
    ['Deliveries', String(d.totals.count)], ['Gross', mny(d.totals.gross)],
    ['Commission', mny(d.totals.commission)], ['Net earned', mny(d.totals.net)],
  ]
  const cw = (A4.w - M * 2 - 24) / 4
  chips.forEach((c, i) => {
    const x = M + i * (cw + 8)
    page.drawRectangle({ x, y: y - 34, width: cw, height: 40, color: BRAND.canvas })
    T(c[0].toUpperCase(), x + 8, y - 8, 7, BRAND.muted)
    T(c[1], x + 8, y - 24, i === 3 ? 12 : 11, i === 3 ? BRAND.teal : BRAND.ink, true)
  })
  y -= 58

  // Table header
  const cols = [M, M + 70, M + 250, right - 150, right - 78, right]
  T('DATE', cols[0], y, 7.5, BRAND.muted); T('TRACKING', cols[1], y, 7.5, BRAND.muted); T('ROUTE', cols[2], y, 7.5, BRAND.muted)
  R('GROSS', cols[3], y, 7.5, BRAND.muted); R('NET', cols[4] + 30, y, 7.5, BRAND.muted); R('STATUS', cols[5], y, 7.5, BRAND.muted)
  y -= 6
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: BRAND.border }); y -= 14

  for (const r of d.rows) {
    if (y < 70) { page = doc.addPage([A4.w, A4.h]); y = A4.h - M }
    T(fmtDate(r.date), cols[0], y, 8.5, BRAND.text2)
    T(r.tracking, cols[1], y, 8.5, BRAND.text2)
    let route = r.route; while (reg.widthOfTextAtSize(clean(route), 8.5) > cols[3] - cols[2] - 60 && route.length > 6) route = route.slice(0, -2)
    T(route, cols[2], y, 8.5, BRAND.text2)
    R(mny(r.gross), cols[3], y, 8.5, BRAND.text2)
    R(mny(r.net), cols[4] + 30, y, 8.5, BRAND.ink, true)
    R(r.paidOut ? 'Paid' : 'Awaiting', cols[5], y, 8, r.paidOut ? BRAND.success : BRAND.brass, true)
    y -= 8; page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.4, color: rgb(0.92, 0.91, 0.88) }); y -= 12
  }

  // Totals
  y -= 6
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: right, y: y + 6 }, thickness: 1.4, color: BRAND.teal })
  T(`Net earned (${d.currency})`, M, y - 6, 12, BRAND.teal, true)
  R(mny(d.totals.net), right, y - 6, 12, BRAND.teal, true)
  y -= 22
  T(`Paid out: ${mny(d.totals.paidOut)}   ·   Awaiting payout: ${mny(d.totals.awaiting)}`, M, y, 8.5, BRAND.muted)

  T('Onshore - Yacht Logistics Marketplace', M, 32, 8, BRAND.muted)
  return doc.save()
}
