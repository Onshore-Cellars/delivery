// Email utility — supports SMTP (nodemailer) and Resend API

import nodemailer from 'nodemailer'

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
const FROM_EMAIL = process.env.EMAIL_FROM || 'info@onshoredelivery.com'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Create a reusable SMTP transporter if configured
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

// ─── SEND EMAIL ───────────────────────────────────────────────────────────────

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Priority 1: SMTP via nodemailer
    const transporter = getSmtpTransporter()
    if (transporter) {
      await transporter.sendMail({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      return true
    }

    // Priority 2: Resend API
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

export function deliveryConfirmationEmail(data: {
  shipperName: string
  trackingCode: string
  origin: string
  destination: string
  deliveredAt: string
  recipientName?: string
  hasSignature: boolean
  hasPhoto: boolean
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Delivery Confirmed!</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.shipperName}, your shipment has been delivered successfully.
    </p>

    <div style="background:#dcfce7;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">✓</div>
      <div style="color:#166534;font-size:18px;font-weight:bold;">Delivered</div>
      <div style="color:#166534;font-size:14px;margin-top:4px;">${data.deliveredAt}</div>
    </div>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="font-family:monospace;color:#64748b;margin-bottom:8px;">${data.trackingCode}</div>
      <div style="margin-bottom:8px;">${data.origin} → ${data.destination}</div>
      ${data.recipientName ? `<div style="color:#0f1628;font-weight:600;">Signed by: ${data.recipientName}</div>` : ''}
      <div style="color:#64748b;font-size:13px;margin-top:8px;">
        ${data.hasSignature ? '✓ Signature captured  ' : ''}
        ${data.hasPhoto ? '✓ Photo attached' : ''}
      </div>
    </div>

    <a href="${APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      View Proof of Delivery
    </a>

    <p style="color:#64748b;font-size:13px;text-align:center;">
      Please leave a review to help other shippers.
    </p>
  `)

  return {
    subject: `Delivery Confirmed - ${data.trackingCode}`,
    html,
    text: `Delivery confirmed! ${data.trackingCode}. ${data.origin} → ${data.destination}. Delivered ${data.deliveredAt}.${data.recipientName ? ` Signed by ${data.recipientName}.` : ''}`,
  }
}

export function paymentReceiptEmail(data: {
  customerName: string
  trackingCode: string
  amount: string
  description: string
  paidAt: string
  invoiceUrl: string
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Payment Receipt</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.customerName}, here's your payment receipt.
    </p>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#64748b;font-size:14px;">Reference</span>
        <span style="color:#0f1628;font-weight:600;font-family:monospace;">${data.trackingCode}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#64748b;font-size:14px;">Description</span>
        <span style="color:#0f1628;font-weight:600;">${data.description}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#64748b;font-size:14px;">Date</span>
        <span style="color:#0f1628;font-weight:600;">${data.paidAt}</span>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;">
        <span style="color:#0f1628;font-size:18px;font-weight:bold;">Total</span>
        <span style="color:#0f1628;font-size:18px;font-weight:bold;">${data.amount}</span>
      </div>
    </div>

    <a href="${data.invoiceUrl}" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      View Invoice
    </a>
  `)

  return {
    subject: `Payment Receipt - ${data.trackingCode}`,
    html,
    text: `Payment receipt: ${data.amount} for ${data.description}. Reference: ${data.trackingCode}. Date: ${data.paidAt}.`,
  }
}

export function carrierPayoutEmail(data: {
  carrierName: string
  trackingCode: string
  payoutAmount: string
  bookingTotal: string
  platformFee: string
  deliveredAt: string
}): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Payout Processed</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.carrierName}, your payout for delivery ${data.trackingCode} has been processed.
    </p>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#64748b;font-size:14px;">Booking Total</span>
        <span style="color:#0f1628;">${data.bookingTotal}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#64748b;font-size:14px;">Platform Fee</span>
        <span style="color:#ef4444;">-${data.platformFee}</span>
      </div>
      <div style="border-top:1px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between;">
        <span style="color:#0f1628;font-size:18px;font-weight:bold;">Your Payout</span>
        <span style="color:#10b981;font-size:18px;font-weight:bold;">${data.payoutAmount}</span>
      </div>
    </div>

    <p style="color:#64748b;font-size:13px;text-align:center;">
      Funds will arrive in your Stripe account within 2–3 business days.
    </p>
  `)

  return {
    subject: `Payout Processed - ${data.trackingCode}`,
    html,
    text: `Payout processed: ${data.payoutAmount} for delivery ${data.trackingCode}. Booking total: ${data.bookingTotal}, fee: ${data.platformFee}.`,
  }
}

export function welcomeEmail(data: { name: string; role: string }): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Welcome to Onshore Deliver!</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.name}, thanks for joining the delivery logistics marketplace.
    </p>

    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0;">
      <h3 style="color:#0f1628;margin:0 0 12px;font-size:16px;">Get Started</h3>
      ${data.role === 'CARRIER' ? `
        <ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;">
          <li>Add your vehicle details and documentation</li>
          <li>List your available transport space</li>
          <li>Start accepting bookings and earning</li>
        </ul>
      ` : `
        <ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;">
          <li>Browse available carrier routes</li>
          <li>Book space for your provisions and equipment</li>
          <li>Track your deliveries in real time</li>
        </ul>
      `}
    </div>

    <a href="${APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#C6904D,#b07d3f);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Go to Dashboard
    </a>
  `)

  return {
    subject: 'Welcome to Onshore Deliver',
    html,
    text: `Welcome to Onshore Deliver, ${data.name}! Visit your dashboard to get started.`,
  }
}

export function documentStatusEmail(data: {
  userName: string
  documentName: string
  status: 'VERIFIED' | 'REJECTED'
  reviewNotes?: string
}): EmailTemplate {
  const isVerified = data.status === 'VERIFIED'
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Document ${isVerified ? 'Verified' : 'Requires Attention'}</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.userName}, your document <strong>${data.documentName}</strong> has been ${isVerified ? 'verified' : 'reviewed'}.
    </p>

    <div style="background:${isVerified ? '#dcfce7' : '#fef2f2'};border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">${isVerified ? '✓' : '!'}</div>
      <div style="color:${isVerified ? '#166534' : '#991b1b'};font-size:18px;font-weight:bold;">
        ${isVerified ? 'Verified' : 'Rejected'}
      </div>
      ${data.reviewNotes ? `<p style="color:${isVerified ? '#166534' : '#991b1b'};font-size:14px;margin-top:8px;">${data.reviewNotes}</p>` : ''}
    </div>

    ${!isVerified ? `
    <a href="${APP_URL}/profile" style="display:block;background:linear-gradient(135deg,#0f1628,#162040);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Re-upload Document
    </a>
    ` : ''}
  `)

  return {
    subject: `Document ${isVerified ? 'Verified' : 'Requires Attention'}: ${data.documentName}`,
    html,
    text: `Your document ${data.documentName} has been ${data.status.toLowerCase()}.${data.reviewNotes ? ` Notes: ${data.reviewNotes}` : ''}`,
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

export function passwordResetEmail(data: { name: string; resetLink: string }): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Reset Your Password</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.name}, we received a request to reset your password. Click the button below to choose a new one.
    </p>
    <a href="${data.resetLink}" style="display:block;background:linear-gradient(135deg,#C6904D,#b07d3f);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Reset Password
    </a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.5;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `)
  return {
    subject: 'Reset your Onshore Deliver password',
    html,
    text: `Hi ${data.name}, reset your password here: ${data.resetLink}. This link expires in 1 hour.`,
  }
}

export function emailVerificationEmail(data: { name: string; verifyLink: string }): EmailTemplate {
  const html = wrapEmail(`
    <h2 style="color:#0f1628;font-size:24px;margin:0 0 16px;">Verify Your Email</h2>
    <p style="color:#475569;font-size:16px;line-height:1.6;">
      Hi ${data.name}, please verify your email address to complete your registration.
    </p>
    <a href="${data.verifyLink}" style="display:block;background:linear-gradient(135deg,#C6904D,#b07d3f);color:white;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;text-decoration:none;margin:24px 0;">
      Verify Email
    </a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.5;">
      This link expires in 24 hours.
    </p>
  `)
  return {
    subject: 'Verify your Onshore Deliver email',
    html,
    text: `Hi ${data.name}, verify your email here: ${data.verifyLink}. This link expires in 24 hours.`,
  }
}
