import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/bookings/[id]/invoice/pdf — Generate PDF invoice/receipt
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
      || req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            carrier: { select: { id: true, name: true, email: true, company: true, address: true, city: true, country: true } },
            originPort: true,
            destinationPort: true,
            vehicleType: true,
            departureDate: true,
          },
        },
        shipper: { select: { id: true, name: true, email: true, company: true, address: true, city: true, country: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrier.id === decoded.userId
    const isShipper = booking.shipper.id === decoded.userId
    if (!isCarrier && !isShipper && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const carrier = booking.listing.carrier
    const shipper = booking.shipper
    const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const fmtMoney = (n: number) => `€${n.toFixed(2)}`

    // Build HTML invoice
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${booking.trackingCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #C6904D; }
    .logo { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 700; color: #1a1a1a; }
    .logo span { color: #C6904D; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 28px; color: #C6904D; font-weight: 300; }
    .invoice-info p { color: #6b6b6b; font-size: 12px; margin-top: 4px; }
    .parties { display: flex; gap: 40px; margin-bottom: 32px; }
    .party { flex: 1; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #C6904D; font-weight: 600; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 600; }
    .party p { color: #6b6b6b; font-size: 12px; line-height: 1.5; }
    .details { margin-bottom: 32px; }
    .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: #faf9f7; border-radius: 8px; padding: 16px; }
    .detail-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b6b6b; display: block; margin-bottom: 4px; }
    .detail-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b6b6b; padding: 8px 12px; border-bottom: 1px solid #e8e4de; }
    td { padding: 12px; border-bottom: 1px solid #f5f3f0; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e8e4de; text-align: center; color: #6b6b6b; font-size: 11px; }
    .pod-section { margin-top: 24px; padding: 16px; background: #faf9f7; border-radius: 8px; }
    .pod-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #C6904D; margin-bottom: 8px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#C6904D;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Print / Save PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">Onshore <span>Deliver</span></div>
      <p style="color:#6b6b6b;font-size:12px;margin-top:4px;">Delivery Logistics Marketplace</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>${booking.trackingCode || 'N/A'}</strong></p>
      <p>Date: ${fmtDate(booking.createdAt)}</p>
      <p>
        <span class="status-badge ${booking.paymentStatus === 'PAID' ? 'status-paid' : 'status-pending'}">
          ${booking.paymentStatus}
        </span>
      </p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Carrier</div>
      <div class="party-name">${carrier.name}</div>
      ${carrier.company ? `<p>${carrier.company}</p>` : ''}
      ${carrier.address ? `<p>${carrier.address}</p>` : ''}
      ${carrier.city || carrier.country ? `<p>${[carrier.city, carrier.country].filter(Boolean).join(', ')}</p>` : ''}
      <p>${carrier.email}</p>
    </div>
    <div class="party">
      <div class="party-label">Shipper</div>
      <div class="party-name">${shipper.name}</div>
      ${shipper.company ? `<p>${shipper.company}</p>` : ''}
      ${shipper.address ? `<p>${shipper.address}</p>` : ''}
      ${shipper.city || shipper.country ? `<p>${[shipper.city, shipper.country].filter(Boolean).join(', ')}</p>` : ''}
      <p>${shipper.email}</p>
    </div>
  </div>

  <div class="details">
    <div class="details-grid">
      <div class="detail-item">
        <label>Origin</label>
        <span>${booking.listing.originPort}</span>
      </div>
      <div class="detail-item">
        <label>Destination</label>
        <span>${booking.listing.destinationPort}</span>
      </div>
      <div class="detail-item">
        <label>Departure</label>
        <span>${fmtDate(booking.listing.departureDate)}</span>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <span>${booking.status.replace('_', ' ')}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Weight</th>
        <th>Volume</th>
        <th>Items</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${booking.cargoDescription}</strong>
          ${booking.cargoType ? `<br><span style="color:#6b6b6b;font-size:12px;">${booking.cargoType}</span>` : ''}
          ${booking.specialHandling ? `<br><span style="color:#6b6b6b;font-size:12px;">Special: ${booking.specialHandling}</span>` : ''}
        </td>
        <td>${booking.weightKg} kg</td>
        <td>${booking.volumeM3} m³</td>
        <td>${booking.itemCount}</td>
        <td class="text-right">${fmtMoney(booking.totalPrice)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${fmtMoney(booking.totalPrice)}</span>
    </div>
    <div class="total-row">
      <span>Platform Fee</span>
      <span>${fmtMoney(booking.platformFee)}</span>
    </div>
    <div class="total-row">
      <span>Carrier Payout</span>
      <span>${fmtMoney(booking.carrierPayout)}</span>
    </div>
    <div class="total-row grand">
      <span>Total (${booking.currency})</span>
      <span>${fmtMoney(booking.totalPrice)}</span>
    </div>
  </div>

  ${booking.status === 'DELIVERED' ? `
  <div class="pod-section">
    <h3>Proof of Delivery</h3>
    <p>Delivered: ${fmtDate(booking.actualDelivery)}</p>
    ${booking.podNotes ? `<p style="margin-top:4px;">${booking.podNotes}</p>` : ''}
    ${booking.podSignature ? '<p style="margin-top:4px;color:#166534;">Signature captured</p>' : ''}
    ${booking.podPhotoUrl ? '<p style="margin-top:4px;color:#166534;">Photo attached</p>' : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Onshore Deliver — Delivery Logistics Marketplace</p>
    <p style="margin-top:4px;">This is an automatically generated invoice. For queries contact support@onshore.delivery</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${booking.trackingCode || id}.html"`,
      },
    })
  } catch (error) {
    console.error('Invoice PDF error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
