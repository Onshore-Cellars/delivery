// SMS notifications via Infobip
// Uses the shared client in lib/infobip.ts. Requires INFOBIP_API_KEY and
// INFOBIP_BASE_URL. If unset, SMS is skipped and WhatsApp/web push/email
// remain the notification channels.

import { sendInfobipSMS } from './infobip'

interface SendSMSParams {
  phoneNumber: string      // E.164 preferred, e.g. +447700900123
  message: string          // Max 160 chars for a single SMS segment
}

export async function sendSMS(params: SendSMSParams): Promise<boolean> {
  return sendInfobipSMS({
    phoneNumber: params.phoneNumber,
    text: params.message.slice(0, 160),
  })
}

// Helper: Send an SMS notification to a user if they have SMS enabled
export async function sendSMSNotification(user: {
  phone?: string | null
  smsNotifications: boolean
}, message: string): Promise<boolean> {
  if (!user.smsNotifications || !user.phone) {
    return false
  }

  return sendSMS({
    phoneNumber: user.phone,
    message,
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
