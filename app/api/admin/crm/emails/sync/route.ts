import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { syncFolder, listFolders } from '@/lib/imap'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/crm/emails/sync — trigger IMAP sync
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const folder = body.folder || 'INBOX'
    const limit = Math.min(parseInt(body.limit || '100'), 500)

    const result = await syncFolder(folder, limit)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Email sync error:', error)
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/admin/crm/emails/sync — list available IMAP folders
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const folders = await listFolders()
    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Email folders error:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}
