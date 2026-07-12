import { NextRequest } from 'next/server'
import { loadInvoiceBooking, buildInvoiceModel, renderInvoiceHtml, ensureInvoiceNumber, resolveInvoiceViewer } from '@/lib/invoice'

export const runtime = 'nodejs'

// GET /api/bookings/[id]/invoice — on-brand HTML invoice view (with a link to
// the real PDF at ./pdf). Shipper/admin see the invoice; carrier sees the
// payout statement.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await loadInvoiceBooking(id)
    if (!booking) return new Response('Booking not found', { status: 404 })

    const viewer = resolveInvoiceViewer(
      request.headers.get('authorization'),
      request.nextUrl.searchParams.get('token'),
      booking,
      request.nextUrl.searchParams.get('doc'),
    )
    if (!viewer) return new Response('Not authorized to view this invoice', { status: 401 })

    if (booking.paymentStatus === 'PAID' && !booking.invoiceNumber) {
      const { invoiceNumber, invoiceIssuedAt } = await ensureInvoiceNumber(id)
      booking.invoiceNumber = invoiceNumber
      booking.invoiceIssuedAt = invoiceIssuedAt
    }

    const html = renderInvoiceHtml(buildInvoiceModel(booking, viewer))
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
