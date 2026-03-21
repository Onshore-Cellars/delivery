// SMS Notifications via free email-to-SMS gateways
// No paid SMS API needed — we route through carrier email gateways
// Users enter their phone number and carrier, and we send an email
// to their carrier's email-to-SMS gateway address

import { sendEmail } from './email'

// Email-to-SMS gateway domains for major carriers
// These are free — the email gets delivered as an SMS to the phone number
const SMS_GATEWAYS: Record<string, string> = {
  // UK
  'vodafone_uk': 'vodafone.net',
  'o2_uk': 'o2.co.uk',
  'ee_uk': 'mms.ee.co.uk',
  'three_uk': 'three.co.uk',
  // US
  'att': 'txt.att.net',
  'tmobile': 'tmomail.net',
  'verizon': 'vtext.com',
  'sprint': 'messaging.sprintpcs.com',
  // Europe
  'vodafone_de': 'vodafone-sms.de',
  'orange_fr': 'orange.fr',
  'movistar': 'movistar.net',
  'wind_it': 'wind.it',
  // Generic — fallback to WhatsApp-style web push notification
  'generic': '',
}

export const SUPPORTED_CARRIERS = [
  { id: 'vodafone_uk', label: 'Vodafone (UK)', country: 'GB' },
  { id: 'o2_uk', label: 'O2 (UK)', country: 'GB' },
  { id: 'ee_uk', label: 'EE (UK)', country: 'GB' },
  { id: 'three_uk', label: 'Three (UK)', country: 'GB' },
  { id: 'att', label: 'AT&T (US)', country: 'US' },
  { id: 'tmobile', label: 'T-Mobile (US)', country: 'US' },
  { id: 'verizon', label: 'Verizon (US)', country: 'US' },
  { id: 'sprint', label: 'Sprint (US)', country: 'US' },
  { id: 'vodafone_de', label: 'Vodafone (DE)', country: 'DE' },
  { id: 'orange_fr', label: 'Orange (FR)', country: 'FR' },
  { id: 'movistar', label: 'Movistar (ES)', country: 'ES' },
  { id: 'wind_it', label: 'Wind (IT)', country: 'IT' },
  { id: 'generic', label: 'Other (Web Push only)', country: '' },
]

interface SendSMSParams {
  phoneNumber: string      // Digits only, no country code prefix needed for gateways
  mobileCarrier: string    // One of the SMS_GATEWAYS keys
  message: string          // Max 160 chars for SMS
  subject?: string
}

export async function sendSMS(params: SendSMSParams): Promise<boolean> {
  const { phoneNumber, mobileCarrier, message, subject } = params

  const gateway = SMS_GATEWAYS[mobileCarrier]

  if (!gateway) {
    // For unsupported carriers, we fall back to web push only
    console.log(`SMS gateway not available for carrier: ${mobileCarrier}, using push notification`)
    return false
  }

  // Clean phone number (digits only)
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  if (!cleanPhone) {
    console.error('Invalid phone number for SMS')
    return false
  }

  const smsEmail = `${cleanPhone}@${gateway}`

  try {
    await sendEmail({
      to: smsEmail,
      subject: subject || 'Onshore Deliver',
      // SMS messages should be plain text and short
      html: message.slice(0, 160),
    })
    return true
  } catch (error) {
    console.error('Failed to send SMS via email gateway:', error)
    return false
  }
}

// Helper: Send an SMS notification to a user if they have SMS enabled
export async function sendSMSNotification(user: {
  phone?: string | null
  smsNotifications: boolean
}, message: string, subject?: string): Promise<boolean> {
  if (!user.smsNotifications || !user.phone) {
    return false
  }

  // Try sending via email gateway with a generic approach
  // For production, you'd integrate with Twilio free tier or similar
  // For now, we use web push as the primary free notification channel
  // and support email-to-SMS for known carrier gateways
  return sendSMS({
    phoneNumber: user.phone,
    mobileCarrier: 'generic', // Default — would be stored on user profile
    message,
    subject,
  })
}

// Format a tracking update for SMS (160 char limit)
export function formatSMSUpdate(status: string, trackingCode: string, detail?: string): string {
  const statusText = status.replace(/_/g, ' ')
  const base = `Onshore: ${trackingCode} ${statusText}`
  if (detail) {
    const remaining = 160 - base.length - 3
    return `${base} - ${detail.slice(0, remaining)}`
  }
  return base
}
