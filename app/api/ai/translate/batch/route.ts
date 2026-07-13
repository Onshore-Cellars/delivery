import { NextRequest, NextResponse } from 'next/server'
import { translateText, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/ai'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

// Public batch translate endpoint for UI strings. Unauthenticated (it powers
// the language switcher for logged-out visitors) but abuse-bounded three ways:
// a per-IP limit, a GLOBAL limit (so many IPs can't multiply spend), and hard
// input caps. Worst-case paid-LLM spend is bounded regardless of caller count.
const limiter = createRateLimiter({ interval: 60_000, limit: 20 })
const globalLimiter = createRateLimiter({ interval: 60_000, limit: 120, prefix: 'translate-global' })
const MAX_TEXTS = 50
const MAX_TOTAL_CHARS = 8_000

export async function POST(request: NextRequest) {
  try {
    const rl = await limiter.check(getClientIP(request))
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    const grl = await globalLimiter.check('all')
    if (!grl.success) return NextResponse.json({ error: 'Translation temporarily busy — try again shortly' }, { status: 429 })

    const body = await request.json()
    const { texts, targetLang } = body

    if (!targetLang || !(targetLang in SUPPORTED_LANGUAGES)) {
      return NextResponse.json({ error: 'Invalid target language' }, { status: 400 })
    }

    if (targetLang === 'en') {
      return NextResponse.json({ translations: texts })
    }

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) {
      return NextResponse.json({ error: 'texts must be an array of 1-50 strings' }, { status: 400 })
    }
    if (!texts.every(t => typeof t === 'string') || texts.join('').length > MAX_TOTAL_CHARS) {
      return NextResponse.json({ error: 'texts must be strings totalling ≤ 8000 chars' }, { status: 400 })
    }

    // Batch translate: join with separator, translate once, split back
    const separator = ' ||| '
    const joined = texts.join(separator)
    const translated = await translateText(joined, targetLang as LanguageCode, 'en')

    if (!translated) {
      return NextResponse.json({ translations: texts })
    }

    const parts = translated.split(separator.trim())
    // If split count doesn't match, fall back to original
    if (parts.length !== texts.length) {
      return NextResponse.json({ translations: texts })
    }

    return NextResponse.json({ translations: parts.map((p: string) => p.trim()) })
  } catch (error) {
    console.error('Batch translate error:', error)
    return NextResponse.json({ translations: [] }, { status: 500 })
  }
}
