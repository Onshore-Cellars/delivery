import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return new Response('Invalid token', { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            carrier: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
                phone: true,
                address: true,
                city: true,
                country: true,
              },
            },
          },
        },
        shipper: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
      },
    })

    if (!booking) {
      return new Response('Booking not found', { status: 404 })
    }

    // Verify user is the shipper, carrier, or admin
    const isShipper = booking.shipperId === decoded.userId
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isShipper && !isCarrier && !isAdmin) {
      return new Response('Not authorized to view this invoice', { status: 403 })
    }

    const invoiceNumber = `YH-INV-${booking.id.slice(-8).toUpperCase()}`
    const invoiceDate = booking.paidAt
      ? new Date(booking.paidAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date(booking.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    const departureDate = new Date(booking.listing.departureDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    const arrivalDate = booking.listing.estimatedArrival
      ? new Date(booking.listing.estimatedArrival).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'TBD'

    const currency = booking.currency || 'EUR'
    const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency + ' '
    const totalPrice = booking.totalPrice.toFixed(2)
    const platformFee = booking.platformFee.toFixed(2)
    const carrierPayout = booking.carrierPayout.toFixed(2)

    const paymentStatusLabel: Record<string, string> = {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      PAID: 'Paid',
      REFUNDED: 'Refunded',
      FAILED: 'Failed',
    }

    const paymentStatusColor: Record<string, string> = {
      PENDING: '#d4a017',
      PROCESSING: '#2196F3',
      PAID: '#2e7d32',
      REFUNDED: '#f57c00',
      FAILED: '#c62828',
    }

    const shipperName = booking.shipper.company || booking.shipper.name
    const carrierName = booking.listing.carrier.company || booking.listing.carrier.name
    const shipper = booking.shipper
    const carrier = booking.listing.carrier

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - YachtHop</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a2e;
      background: #f0f2f5;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 800px;
      margin: 30px auto;
      background: #fff;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0a1628 0%, #16213e 100%);
      color: #fff;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand h1 {
      font-size: 28px;
      font-weight: 700;
      color: #d4a017;
      margin-bottom: 4px;
    }
    .brand p {
      font-size: 13px;
      color: #a0aec0;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 22px;
      color: #d4a017;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .invoice-meta p {
      font-size: 13px;
      color: #cbd5e0;
      margin-bottom: 2px;
    }
    .body { padding: 40px; }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 35px;
      gap: 40px;
    }
    .party { flex: 1; }
    .party h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0a1628;
      border-bottom: 2px solid #d4a017;
      padding-bottom: 6px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .party p {
      font-size: 13px;
      color: #4a5568;
      margin-bottom: 2px;
    }
    .party .name {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0a1628;
      border-bottom: 2px solid #d4a017;
      padding-bottom: 6px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .route-bar {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .port {
      text-align: center;
      flex: 1;
    }
    .port .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      margin-bottom: 4px;
    }
    .port .name {
      font-size: 16px;
      font-weight: 700;
      color: #0a1628;
    }
    .port .date {
      font-size: 12px;
      color: #718096;
      margin-top: 2px;
    }
    .route-arrow {
      font-size: 24px;
      color: #d4a017;
      padding: 0 20px;
      flex-shrink: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    table td {
      padding: 12px;
      font-size: 14px;
      color: #2d3748;
      border-bottom: 1px solid #edf2f7;
    }
    table th:last-child,
    table td:last-child {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table tr td {
      padding: 8px 12px;
      font-size: 14px;
      border-bottom: 1px solid #edf2f7;
    }
    .totals-table tr td:first-child {
      color: #718096;
    }
    .totals-table tr td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .totals-table tr.total td {
      border-top: 2px solid #0a1628;
      border-bottom: none;
      font-size: 18px;
      font-weight: 700;
      color: #0a1628;
      padding-top: 12px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-item {
      background: #f7fafc;
      border-radius: 4px;
      padding: 12px;
    }
    .info-item .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      margin-bottom: 4px;
    }
    .info-item .value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .payment-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }
    .footer {
      background: #f7fafc;
      border-top: 1px solid #e2e8f0;
      padding: 25px 40px;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #a0aec0;
    }
    .footer .brand-name {
      color: #d4a017;
      font-weight: 700;
    }
    .print-btn-area {
      text-align: center;
      margin: 20px 0 30px;
    }
    .print-btn {
      background: linear-gradient(135deg, #0a1628 0%, #16213e 100%);
      color: #d4a017;
      border: none;
      padding: 12px 40px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .print-btn:hover {
      opacity: 0.9;
    }
    @media print {
      body { background: #fff; }
      .invoice-container {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      .print-btn-area { display: none; }
      .header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .route-bar, .info-item, .footer {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="brand">
        <h1>YachtHop</h1>
        <p>Yacht Logistics Marketplace</p>
      </div>
      <div class="invoice-meta">
        <h2>Invoice</h2>
        <p><strong>${invoiceNumber}</strong></p>
        <p>Date: ${invoiceDate}</p>
        <p>Booking: ${booking.id}</p>
      </div>
    </div>

    <div class="body">
      <div class="parties">
        <div class="party">
          <h3>Shipper</h3>
          <p class="name">${escapeHtml(shipperName)}</p>
          ${shipper.name !== shipperName ? `<p>${escapeHtml(shipper.name)}</p>` : ''}
          ${shipper.email ? `<p>${escapeHtml(shipper.email)}</p>` : ''}
          ${shipper.phone ? `<p>${escapeHtml(shipper.phone)}</p>` : ''}
          ${shipper.address ? `<p>${escapeHtml(shipper.address)}</p>` : ''}
          ${shipper.city || shipper.country ? `<p>${escapeHtml([shipper.city, shipper.country].filter(Boolean).join(', '))}</p>` : ''}
        </div>
        <div class="party">
          <h3>Carrier</h3>
          <p class="name">${escapeHtml(carrierName)}</p>
          ${carrier.name !== carrierName ? `<p>${escapeHtml(carrier.name)}</p>` : ''}
          ${carrier.email ? `<p>${escapeHtml(carrier.email)}</p>` : ''}
          ${carrier.phone ? `<p>${escapeHtml(carrier.phone)}</p>` : ''}
          ${carrier.address ? `<p>${escapeHtml(carrier.address)}</p>` : ''}
          ${carrier.city || carrier.country ? `<p>${escapeHtml([carrier.city, carrier.country].filter(Boolean).join(', '))}</p>` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Route</div>
        <div class="route-bar">
          <div class="port">
            <div class="label">Origin</div>
            <div class="name">${escapeHtml(booking.listing.originPort)}</div>
            <div class="date">${departureDate}</div>
          </div>
          <div class="route-arrow">&#10132;</div>
          <div class="port">
            <div class="label">Destination</div>
            <div class="name">${escapeHtml(booking.listing.destinationPort)}</div>
            <div class="date">${arrivalDate}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Cargo Details</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Weight (kg)</th>
              <th>Volume (m&sup3;)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(booking.cargoDescription)}</td>
              <td>${escapeHtml(booking.cargoType || 'General')}</td>
              <td>${booking.weightKg.toFixed(2)}</td>
              <td>${booking.volumeM3.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        ${booking.specialHandling ? `<p style="margin-top: 10px; font-size: 13px; color: #718096;"><strong>Special Handling:</strong> ${escapeHtml(booking.specialHandling)}</p>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Pricing Breakdown</div>
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td>${currencySymbol}${totalPrice}</td>
            </tr>
            <tr>
              <td>Platform Fee</td>
              <td>${currencySymbol}${platformFee}</td>
            </tr>
            <tr>
              <td>Carrier Payout</td>
              <td>${currencySymbol}${carrierPayout}</td>
            </tr>
            <tr class="total">
              <td>Total</td>
              <td>${currencySymbol}${totalPrice}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Additional Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Tracking Code</div>
            <div class="value">${escapeHtml(booking.trackingCode || 'N/A')}</div>
          </div>
          <div class="info-item">
            <div class="label">Payment Status</div>
            <div class="value">
              <span class="payment-badge" style="background: ${paymentStatusColor[booking.paymentStatus] || '#718096'}">
                ${paymentStatusLabel[booking.paymentStatus] || booking.paymentStatus}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="label">Booking Status</div>
            <div class="value">${booking.status.replace(/_/g, ' ')}</div>
          </div>
          <div class="info-item">
            <div class="label">Vehicle</div>
            <div class="value">${escapeHtml(booking.listing.vehicleType)}${booking.listing.vehicleName ? ' - ' + escapeHtml(booking.listing.vehicleName) : ''}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><span class="brand-name">YachtHop</span> &mdash; Yacht Logistics Marketplace</p>
      <p style="margin-top: 6px;">This invoice was generated automatically. For questions, contact support@yachthop.com</p>
    </div>
  </div>

  <div class="print-btn-area">
    <button class="print-btn" onclick="window.print()">Print Invoice</button>
  </div>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
