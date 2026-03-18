// Email utility — uses a provider-agnostic interface
// In production, swap in SendGrid, Resend, Postmark, etc.
// For now, logs emails and provides the structure for real sending

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

const APP_NAME = 'Onshore Deliver'
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@onshore.delivery'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ─── SEND EMAIL ───────────────────────────────────────────────────────────────

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if we have a real email provider configured
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${APP_NAME} <${FROM_EMAIL}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })
      return res.ok
    }

    // Fallback: log the email
    console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// ─── EMAIL WRAPPER ────────────────────────────────────────────────────────────

function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="text-align:center;padding:24px 0;border-bottom:1px solid #e2e8f0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#0f1628,#162040);border-radius:8px;padding:8px 16px;">
        <span style="color:#0071e3;font-weight:bold;font-size:18px;letter-spacing:1px;">Onshore Deliver</span>
      </div>
    </div>

    <!-- Content -->
    <div style="padding:32px 0;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p style="margin-top:8px;">
        <a href="${APP_URL}" style="color:#0071e3;text-decoration:none;">Visit Onshore Deliver</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

export function bookingConfirmationEmail(data: {
  customerName: string
  trackingCode: string
  origin: string
  destination: string
  departureDate: string
  cargoDescription: string
  totalPrice: string
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Booking Confirmed!</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.customerName}, your shipment has been confirmed.
    </p>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="margin-bottom:12px;">
        <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tracking Code</span>
        <div style="color:#0f1628;font-size:24px;font-weight:bold;font-family:monospace;letter-spacing:2px;">${data.trackingCode}</div>
      </div>
      <div style="display:flex;gap:20px;margin-top:16px;">
        <div>
          <span style="color:#64748b;font-size:12px;">From</span>
          <div style="color:#0f1628;font-weight:600;">${data.origin}</div>
        </div>
        <div style="color:#94a3b8;font-size:20px;">→</div>
        <div>
          <span style="color:#64748b;font-size:12px;">To</span>
          <div style="color:#0f1628;font-weight:600;">${data.destination}</div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <span style="color:#64748b;font-size:12px;">Departure</span>
        <div style="color:#0f1628;font-weight:600;">${data.departureDate}</div>
      </div>
      <div style="margin-top:12px;">
        <span style="color:#64748b;font-size:12px;">Cargo</span>
        <div style="color:#0f1628;font-weight:600;">${data.cargoDescription}</div>
      </div>
    </div>

    <div style="background:#0f1628;border-radius:8px;padding:16px;text-align:center;margin:24px 0;">
      <span style="color:#0071e3;font-size:24px;font-weight:bold;">${data.totalPrice}</span>
    </div>

    <a href="${APP_URL}/tracking?code=${data.trackingCode}" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Track Your Shipment
    </a>
  `)

  return {
    subject: `Booking Confirmed - ${data.trackingCode}`,
    html,
    text: `Booking confirmed! Tracking: ${data.trackingCode}. ${data.origin} → ${data.destination}. Departure: ${data.departureDate}. Total: ${data.totalPrice}`,
  }
}

export function statusUpdateEmail(data: {
  customerName: string
  trackingCode: string
  status: string
  description: string
  location?: string
}): EmailTemplate {
  const statusColors: Record<string, string> = {
    CONFIRMED: '#10b981',
    PICKED_UP: '#8b5cf6',
    IN_TRANSIT: '#3b82f6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
  }

  const color = statusColors[data.status] || '#3b82f6'

  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Shipment Update</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.customerName}, here's an update on your shipment.
    </p>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="font-family:monospace;color:#64748b;margin-bottom:8px;">${data.trackingCode}</div>
      <div style="display:inline-block;background:${color};color:white;padding:4px 12px;border-radius:20px;font-size:14px;font-weight:600;">
        ${data.status.replace('_', ' ')}
      </div>
      <p style="color:#0f1628;margin-top:12px;font-size:16px;">${data.description}</p>
      ${data.location ? `<p style="color:#64748b;font-size:14px;">📍 ${data.location}</p>` : ''}
    </div>

    <a href="${APP_URL}/tracking?code=${data.trackingCode}" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      View Full Tracking
    </a>
  `)

  return {
    subject: `Shipment ${data.status.replace('_', ' ')} - ${data.trackingCode}`,
    html,
    text: `Shipment update: ${data.status.replace('_', ' ')}. ${data.description}. Track at ${APP_URL}/tracking?code=${data.trackingCode}`,
  }
}

export function newMessageEmail(data: {
  recipientName: string
  senderName: string
  preview: string
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">New Message</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.recipientName}, you have a new message from <strong>${data.senderName}</strong>.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="color:#0f1628;font-size:16px;font-style:italic;">"${data.preview}"</p>
    </div>
    <a href="${APP_URL}/messages" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      View Messages
    </a>
  `)

  return {
    subject: `New message from ${data.senderName}`,
    html,
    text: `New message from ${data.senderName}: "${data.preview}"`,
  }
}

export function bidReceivedEmail(data: {
  carrierName: string
  bidderName: string
  amount: string
  listingTitle: string
  weightKg: number
  volumeM3: number
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">New Bid Received</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.carrierName}, <strong>${data.bidderName}</strong> has placed a bid on your listing.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="margin-bottom:8px;color:#64748b;font-size:14px;">${data.listingTitle}</div>
      <div style="color:#0f1628;font-size:28px;font-weight:bold;">${data.amount}</div>
      <div style="color:#64748b;font-size:14px;margin-top:8px;">${data.weightKg}kg · ${data.volumeM3}m³</div>
    </div>
    <a href="${APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#d4b85e,#c9a84c);color:#0f1628;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Review Bid
    </a>
  `)

  return {
    subject: `New bid on ${data.listingTitle}`,
    html,
    text: `New bid from ${data.bidderName}: ${data.amount} for ${data.weightKg}kg / ${data.volumeM3}m³`,
  }
}

export function quoteRequestEmail(data: {
  carrierName: string
  requesterName: string
  origin: string
  destination: string
  cargoDescription: string
  weightKg: number
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Quote Requested</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.carrierName}, <strong>${data.requesterName}</strong> is requesting a quote.
    </p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="margin-bottom:8px;">${data.origin} → ${data.destination}</div>
      <div style="color:#0f1628;font-weight:600;">${data.cargoDescription}</div>
      <div style="color:#64748b;font-size:14px;margin-top:8px;">${data.weightKg}kg</div>
    </div>
    <a href="${APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#d4b85e,#c9a84c);color:#0f1628;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Respond to Quote
    </a>
  `)

  return {
    subject: `Quote request: ${data.origin} → ${data.destination}`,
    html,
    text: `Quote request from ${data.requesterName}: ${data.origin} → ${data.destination}, ${data.cargoDescription}, ${data.weightKg}kg`,
  }
}
