import { NextRequest, NextResponse } from 'next/server'
import { translateText, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/ai'

// Public (unauthenticated) batch translate endpoint for UI strings
// Rate-limited by IP, max 50 keys per request

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texts, targetLang } = body

    if (!targetLang || !(targetLang in SUPPORTED_LANGUAGES)) {
      return NextResponse.json({ error: 'Invalid target language' }, { status: 400 })
    }

    if (targetLang === 'en') {
      return NextResponse.json({ translations: texts })
    }

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 50) {
      return NextResponse.json({ error: 'texts must be an array of 1-50 strings' }, { status: 400 })
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
