// Shared Infobip messaging client (WhatsApp + SMS)
// https://www.infobip.com/docs/api — env vars:
//   INFOBIP_API_KEY          API key (portal → Developer Tools → API keys)
//   INFOBIP_BASE_URL         Your account base URL, e.g. "xxxxx.api.infobip.com"
//                            (shown next to the API key in the portal)
//   INFOBIP_WHATSAPP_SENDER  WhatsApp sender number, e.g. "447860099299"
//                            (the Infobip test sender on free trial)
//   INFOBIP_SMS_SENDER       SMS sender ID or number (optional; defaults to a
//                            shared sender on trial accounts)

function infobipConfig() {
  const apiKey = process.env.INFOBIP_API_KEY
  const baseUrl = process.env.INFOBIP_BASE_URL
  if (!apiKey || !baseUrl) return null
  return { apiKey, baseUrl: baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') }
}

// Normalize a phone number to international digits (Infobip format, no +).
// Returns null if it doesn't look like a usable international number.
export function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '')
  const digits = cleaned.replace(/\D/g, '')
  if (digits.length < 7) return null
  if (cleaned.startsWith('+')) return digits
  // 00 international prefix
  if (digits.startsWith('00')) return digits.slice(2)
  // UK local format (07...) → 44
  if (digits.startsWith('0') && digits.length === 11) return `44${digits.slice(1)}`
  // Assume the number already includes a country code
  return digits
}

async function infobipPost(path: string, body: unknown): Promise<boolean> {
  const config = infobipConfig()
  if (!config) {
    console.log('Infobip not configured (INFOBIP_* env vars missing), skipping')
    return false
  }

  try {
    const res = await fetch(`https://${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`Infobip request failed (${res.status}): ${detail.slice(0, 300)}`)
      return false
    }
    return true
  } catch (error) {
    console.error('Infobip request error:', error)
    return false
  }
}

// Send a WhatsApp text message.
// Note: WhatsApp only allows free-form text within 24h of the user's last
// message; outside that window Meta requires an approved template, so
// platform-initiated notifications may need a template registered in Infobip.
export async function sendInfobipWhatsApp(params: {
  phoneNumber: string
  text: string
}): Promise<boolean> {
  const sender = process.env.INFOBIP_WHATSAPP_SENDER
  if (!sender) {
    console.log('INFOBIP_WHATSAPP_SENDER not set, skipping WhatsApp')
    return false
  }
  const to = normalizePhone(params.phoneNumber)
  if (!to) {
    console.error('Invalid phone number for WhatsApp')
    return false
  }
  return infobipPost('/whatsapp/1/message/text', {
    from: sender.replace(/\D/g, ''),
    to,
    content: { text: params.text },
  })
}

// Send an SMS text message.
export async function sendInfobipSMS(params: {
  phoneNumber: string
  text: string
}): Promise<boolean> {
  const to = normalizePhone(params.phoneNumber)
  if (!to) {
    console.error('Invalid phone number for SMS')
    return false
  }
  return infobipPost('/sms/2/text/advanced', {
    messages: [
      {
        destinations: [{ to }],
        from: process.env.INFOBIP_SMS_SENDER || undefined,
        text: params.text,
      },
    ],
  })
}
