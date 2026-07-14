/**
 * WhatsApp integration utilities
 * - Outbound messages via the Infobip API (lib/infobip.ts)
 * - Click-to-chat links with pre-filled messages
 */

import { sendInfobipWhatsApp } from './infobip'

/**
 * Send a WhatsApp text message via Infobip.
 * Requires INFOBIP_API_KEY, INFOBIP_BASE_URL and INFOBIP_WHATSAPP_SENDER.
 * Note: WhatsApp only allows free-form text within 24h of the user's last
 * message; outside that window Meta requires an approved template, so
 * platform-initiated notifications may need a template registered in Infobip.
 */
export async function sendWhatsApp(params: {
  phoneNumber: string
  message: string
}): Promise<boolean> {
  return sendInfobipWhatsApp({
    phoneNumber: params.phoneNumber,
    text: params.message,
  })
}

/**
 * Generate a WhatsApp click-to-chat URL
 * @param phone - Phone number with country code (e.g., +33612345678)
 * @param message - Pre-filled message text
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  // Strip non-numeric chars except leading +
  const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
  const base = `https://wa.me/${cleanPhone}`
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}

/**
 * Generate a booking-related WhatsApp message
 */
export function getBookingWhatsAppMessage(params: {
  trackingCode: string
  origin: string
  destination: string
  cargoType?: string
}): string {
  return `Hi! I'm contacting you about delivery ${params.trackingCode} (${params.origin} → ${params.destination})${params.cargoType ? ` - ${params.cargoType}` : ''}. `
}

/**
 * Generate a quote request WhatsApp message
 */
export function getQuoteWhatsAppMessage(params: {
  origin: string
  destination: string
  cargoDescription: string
  date?: string
}): string {
  return `Hi! I need a delivery from ${params.origin} to ${params.destination}. Cargo: ${params.cargoDescription}${params.date ? `. Preferred date: ${params.date}` : ''}. Can you help?`
}

/**
 * Generate WhatsApp share link for tracking
 */
export function getTrackingShareMessage(params: {
  trackingCode: string
  trackingUrl: string
}): string {
  return `Track your delivery: ${params.trackingCode}\n${params.trackingUrl}`
}
