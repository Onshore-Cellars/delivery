// Detect and block messages containing contact information
// Returns { blocked: boolean, reason?: string }

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
const PHONE_REGEX = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}/
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+/i

// Common obfuscation patterns
const AT_VARIANTS = /\b\w+\s*[\[\(\{]?\s*(?:at|@|AT)\s*[\]\)\}]?\s*\w+\s*[\[\(\{]?\s*(?:dot|\.)\s*[\]\)\}]?\s*\w+/i
const PHONE_WORDS = /(?:call|text|ring|phone|whatsapp|telegram|signal|viber)\s*(?:me\s*)?(?:at|on|:)?\s*[\+\d\s\-\(\)\.]{7,}/i

export function checkMessageForPII(content: string): { blocked: boolean; reason?: string } {
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

  return { blocked: false }
}
