// Detect and block messages containing contact information
// Returns { blocked: boolean, reason?: string }

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
const PHONE_REGEX = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}/
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+/i

// Common obfuscation patterns
const AT_VARIANTS = /\b\w+\s*[\[\(\{]?\s*(?:at|@|AT)\s*[\]\)\}]?\s*\w+\s*[\[\(\{]?\s*(?:dot|\.)\s*[\]\)\}]?\s*\w+/i
const PHONE_WORDS = /(?:call|text|ring|phone|whatsapp|telegram|signal|viber)\s*(?:me\s*)?(?:at|on|:)?\s*[\+\d\s\-\(\)\.]{7,}/i

// Circumvention detection — users trying to go direct / off-platform
const CIRCUMVENTION_PATTERNS = [
  // Direct deal language
  /\b(?:go\s*direct|deal\s*direct|off[\s-]*platform|outside\s*(?:the\s*)?(?:platform|app|system|site))\b/i,
  /\b(?:cut\s*out\s*(?:the\s*)?middl|skip\s*(?:the\s*)?(?:platform|fees?|commission)|avoid\s*(?:the\s*)?(?:platform|fees?|commission))\b/i,
  /\b(?:save\s*(?:the\s*)?(?:fees?|commission|percentage)|no\s*(?:platform\s*)?fee|without\s*(?:the\s*)?(?:fee|commission))\b/i,
  // Payment bypass
  /\b(?:pay\s*(?:me\s*)?(?:direct|cash|bank\s*transfer|wire)|bank\s*(?:details?|account|transfer)|sort\s*code|iban|swift)\b/i,
  /\b(?:paypal\s*(?:me)?|venmo|revolut|wise|zelle|cash\s*app)\b/i,
  // Meeting requests (without booking)
  /\b(?:meet\s*(?:me\s*)?(?:at|in|outside)|come\s*(?:to\s*)?(?:my\s*)?(?:office|warehouse|yard))\b/i,
  // Social media / alternative contact
  /\b(?:find\s*me\s*on|add\s*me\s*on|my\s*(?:instagram|facebook|linkedin|twitter|whatsapp|insta))\b/i,
  /\b(?:DM\s*me|message\s*me\s*on|contact\s*(?:me\s*)?(?:on|via|through)\s*(?:whatsapp|telegram|signal|insta))\b/i,
]

export function checkMessageForPII(content: string): { blocked: boolean; reason?: string; flagged?: boolean; flagReason?: string } {
  const normalized = content.replace(/\s+/g, ' ').trim()

  if (EMAIL_REGEX.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain email addresses. Please use in-app messaging to communicate.' }
  }

  if (AT_VARIANTS.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain email addresses. Please use in-app messaging to communicate.' }
  }

  // Phone number - require at least 7 consecutive digits (with separators)
  const digitsOnly = normalized.replace(/[^\d]/g, '')
  const phoneMatch = PHONE_REGEX.test(normalized)
  if (phoneMatch && digitsOnly.length >= 7) {
    return { blocked: true, reason: 'Messages cannot contain phone numbers. All communication should stay within the platform.' }
  }

  if (PHONE_WORDS.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain phone numbers. All communication should stay within the platform.' }
  }

  if (URL_REGEX.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain links or URLs. Please use in-app messaging to communicate.' }
  }

  // Circumvention detection — flag but don't hard-block (AI will review)
  for (const pattern of CIRCUMVENTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        reason: 'This message appears to suggest arranging a deal outside the platform. All bookings must go through Onshore Delivery to ensure payment protection, insurance coverage, and dispute resolution for both parties.',
        flagged: true,
        flagReason: 'circumvention_attempt',
      }
    }
  }

  return { blocked: false }
}

/**
 * Check listing content for circumvention signals.
 * Returns a flag if listing text suggests off-platform dealing.
 */
export function checkListingForCircumvention(text: string): { flagged: boolean; reason?: string } {
  const normalized = (text || '').replace(/\s+/g, ' ').trim().toLowerCase()

  const patterns = [
    /contact\s*(?:me\s*)?(?:direct|privately|outside)/,
    /(?:call|text|whatsapp)\s*(?:me\s*)?(?:for|to\s*(?:arrange|discuss))/,
    /(?:better|cheaper)\s*(?:price|rate|deal)\s*(?:if\s*(?:you\s*)?(?:go\s*)?direct|off[\s-]*platform)/,
    /\b(?:no\s*commission|save\s*on\s*fees|avoid\s*(?:the\s*)?fees)\b/,
    /\b(?:bank\s*transfer|cash\s*(?:on\s*)?(?:collection|delivery))\b/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(normalized)) {
      return { flagged: true, reason: 'Listing may be soliciting off-platform transactions' }
    }
  }

  return { flagged: false }
}
