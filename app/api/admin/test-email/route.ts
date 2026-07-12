import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import {
  welcomeEmail, bookingConfirmationEmail, paymentReceiptEmail, statusUpdateEmail,
  deliveryConfirmationEmail, carrierPayoutEmail, bidReceivedEmail, quoteRequestEmail,
} from '@/lib/email'
import { buildInvoiceModel, renderInvoicePdf } from '@/lib/invoice'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// A realistic fake booking so the sample invoice PDF looks complete.
function sampleBooking(): any {
  return {
    id: 'cktestbooking0001abcd4f9a2c71', invoiceNumber: 'OD-2026-TESTDEMO', invoiceIssuedAt: new Date(),
    createdAt: new Date(), paidAt: new Date(), currency: 'EUR',
    totalPrice: 1450, platformFee: 145, carrierPayout: 1305, paymentStatus: 'PAID', status: 'DELIVERED',
    trackingCode: 'OD-DEMO123', cargoDescription: 'Teak deck panels, crated', cargoType: 'Fragile', specialHandling: 'Keep dry',
    weightKg: 320, volumeM3: 2.4, itemCount: 6, actualDelivery: new Date(),
    podNotes: 'Left with marina office', podSignature: 'sig', podPhotoUrl: 'url', podRecipientName: 'M. Rossi',
    stripeTransferId: 'tr_demo', payoutTransferredAt: new Date(),
    vatAmount: 290, vatRate: 20, vatTreatment: 'DOMESTIC', vatNote: 'Domestic supply — VAT applied.',
    listing: {
      originPort: 'Southampton', destinationPort: 'Antibes', vehicleType: 'Luton van', vehicleName: 'OD-7',
      departureDate: new Date(), estimatedArrival: new Date(),
      carrier: { id: 'c1', name: 'Jon Carrier', email: 'jon@carrier.eu', company: 'Blue Wake Transport', phone: null, address: '12 Quai Rambaud', city: 'Lyon', country: 'France', vatNumber: 'FR40303265045' },
    },
    shipper: { id: 's1', name: 'Edward', email: 'edward@onshorecellars.com', company: 'Onshore Cellars', phone: null, address: '5 Ocean Way', city: 'Southampton', country: 'GB', vatNumber: null },
  }
}

// POST /api/admin/test-email  { to: string, kinds?: string[] }
// Sends a representative set of transactional emails (and a sample invoice PDF)
// to the given address so you can eyeball real deliveries. Requires a configured
// mail provider (SMTP_* or RESEND_API_KEY); otherwise sends are logged, not
// delivered, and the response says so.
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const to = String(body.to || '').trim()
    if (!EMAIL_RE.test(to)) return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 })

    const providerConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER) || !!process.env.RESEND_API_KEY

    // Build the sample invoice PDF to attach to the receipt.
    const booking = sampleBooking()
    const invoicePdf = Buffer.from(await renderInvoicePdf(buildInvoiceModel(booking, 'shipper')))
    const payoutPdf = Buffer.from(await renderInvoicePdf(buildInvoiceModel(booking, 'carrier')))

    const money = (n: number) => `€${n.toFixed(2)}`
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    // The representative set. Each entry becomes one delivered email.
    const messages: { tag: string; tpl: { subject: string; html: string; text: string }; attachments?: { filename: string; content: Buffer; contentType?: string }[] }[] = [
      { tag: 'welcome', tpl: welcomeEmail({ name: 'Edward', role: 'SUPPLIER' }) },
      { tag: 'booking-confirmation', tpl: bookingConfirmationEmail({ customerName: 'Edward', trackingCode: booking.trackingCode, origin: 'Southampton', destination: 'Antibes', departureDate: today, cargoDescription: booking.cargoDescription, totalPrice: money(1740) }) },
      { tag: 'payment-receipt', tpl: paymentReceiptEmail({ customerName: 'Edward', trackingCode: booking.trackingCode, amount: money(1740), description: 'Southampton → Antibes', paidAt: today, invoiceUrl: '#' }), attachments: [{ filename: 'Onshore-Invoice-OD-2026-TESTDEMO.pdf', content: invoicePdf, contentType: 'application/pdf' }] },
      { tag: 'status-update', tpl: statusUpdateEmail({ customerName: 'Edward', trackingCode: booking.trackingCode, status: 'IN_TRANSIT', description: 'Your shipment is on the ferry to France.', location: 'Portsmouth' }) },
      { tag: 'delivery-confirmation', tpl: deliveryConfirmationEmail({ shipperName: 'Edward', trackingCode: booking.trackingCode, origin: 'Southampton', destination: 'Antibes', deliveredAt: today, recipientName: 'M. Rossi', hasSignature: true, hasPhoto: true }) },
      { tag: 'carrier-payout', tpl: carrierPayoutEmail({ carrierName: 'Blue Wake Transport', trackingCode: booking.trackingCode, payoutAmount: money(1305), bookingTotal: money(1450), platformFee: money(145), deliveredAt: today, statementUrl: '#' }), attachments: [{ filename: 'Onshore-PayoutStatement-OD-2026-TESTDEMO.pdf', content: payoutPdf, contentType: 'application/pdf' }] },
      { tag: 'bid-received', tpl: bidReceivedEmail({ carrierName: 'Edward', bidderName: 'A. Shipper', amount: money(1200), listingTitle: 'Southampton → Antibes', weightKg: 320, volumeM3: 2.4 }) },
      { tag: 'quote-request', tpl: quoteRequestEmail({ carrierName: 'Edward', requesterName: 'A. Shipper', origin: 'Southampton', destination: 'Antibes', cargoDescription: booking.cargoDescription, weightKg: 320 }) },
    ]

    const results: { tag: string; ok: boolean }[] = []
    for (const m of messages) {
      const ok = await sendEmail({ to, subject: `[Onshore test] ${m.tpl.subject}`, html: m.tpl.html, text: m.tpl.text, attachments: m.attachments })
      results.push({ tag: m.tag, ok })
    }

    return NextResponse.json({
      to,
      delivered: providerConfigured,
      sent: results.filter(r => r.ok).length,
      total: results.length,
      results,
      note: providerConfigured
        ? 'Emails handed to the configured mail provider.'
        : 'No mail provider configured (SMTP_* or RESEND_API_KEY) — sends were logged, NOT delivered. Set credentials to actually send.',
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
