import { NextRequest, NextResponse } from 'next/server'
import { loadInvoiceBooking, buildInvoiceModel, renderInvoicePdf, ensureInvoiceNumber, resolveInvoiceViewer } from '@/lib/invoice'

// pdf-lib needs the Node runtime (not edge).
export const runtime = 'nodejs'

// GET /api/bookings/[id]/invoice/pdf — real, downloadable PDF.
//   Shipper/admin get an INVOICE; the carrier gets a PAYOUT STATEMENT.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await loadInvoiceBooking(id)
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const viewer = resolveInvoiceViewer(
      req.headers.get('authorization'),
      req.nextUrl.searchParams.get('token'),
      booking,
      req.nextUrl.searchParams.get('doc'),
    )
    if (!viewer) return NextResponse.json({ error: 'Not authorized' }, { status: 401 })

    // Assign a stable invoice number the first time a paid booking is invoiced.
    if (booking.paymentStatus === 'PAID' && !booking.invoiceNumber) {
      const { invoiceNumber, invoiceIssuedAt } = await ensureInvoiceNumber(id)
      booking.invoiceNumber = invoiceNumber
      booking.invoiceIssuedAt = invoiceIssuedAt
    }

    const model = buildInvoiceModel(booking, viewer)
    const pdf = await renderInvoicePdf(model)
    const filename = `Onshore-${model.kind === 'REMITTANCE' ? 'PayoutStatement' : 'Invoice'}-${model.number}.pdf`

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Invoice PDF error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
