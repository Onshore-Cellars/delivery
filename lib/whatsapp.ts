/**
 * WhatsApp integration utilities
 * Generates click-to-chat links with pre-filled messages
 */

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
