import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { translateText, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { text, targetLang, sourceLang } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 })
    }

    if (!(targetLang in SUPPORTED_LANGUAGES)) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 })
    }

    const translation = await translateText(text, targetLang as LanguageCode, sourceLang as LanguageCode | undefined)

    return NextResponse.json({ translation })
  } catch (error) {
    console.error('AI translate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
