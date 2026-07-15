import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { extractBillDocument, aiEnabled } from '@/lib/ai'
import { uploadFile, generateKey } from '@/lib/storage'

// ─── POST /api/bills/extract ────────────────────────────────────────────────
// Upload a bill (PDF or image), store it, and let AI extract a draft bill.
// The client shows the draft for the user to review/correct before saving
// via POST /api/bills.

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_SIZE = 10 * 1024 * 1024 // 10MB — Claude's practical document limit

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    if (!aiEnabled()) {
      return NextResponse.json({ error: 'AI extraction is not configured on this server' }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPEG, PNG, GIF or WebP files are supported' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Store the original file (best-effort — extraction still works without storage)
    let fileUrl: string | null = null
    let fileKey: string | null = null
    try {
      const key = generateKey(`bills/${decoded.userId}`, file.name || 'bill.pdf')
      const uploaded = await uploadFile({ key, body: buffer, contentType: file.type })
      // Skip unconfigured-storage data-URL fallback — too large to persist in the DB
      if (!uploaded.url.startsWith('data:')) {
        fileUrl = uploaded.url
        fileKey = uploaded.key
      }
    } catch (err) {
      console.warn('[bills/extract] File storage failed (continuing):', err)
    }

    const extracted = await extractBillDocument(buffer.toString('base64'), file.type)
    if (!extracted) {
      return NextResponse.json({ error: 'Could not read the document. Try a clearer scan or enter the bill manually.' }, { status: 422 })
    }

    return NextResponse.json({ extracted, fileUrl, fileKey })
  } catch (error) {
    console.error('[bills/extract] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
