import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { getPlatformSettingsForAdmin, savePlatformVatSettings } from '@/lib/settings'

export const runtime = 'nodejs'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/settings — current platform VAT settings (+ whether each is
// overridden in the DB or coming from an env default).
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  return NextResponse.json({ settings: await getPlatformSettingsForAdmin() })
}

// PATCH /api/admin/settings — update platform VAT settings.
export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({}))
    const input: { vatCountry?: string; vatNumber?: string; vatRegistered?: boolean; platformFeePercent?: number } = {}
    if (typeof body.vatCountry === 'string') input.vatCountry = body.vatCountry
    if (typeof body.vatNumber === 'string') input.vatNumber = body.vatNumber
    if (typeof body.vatRegistered === 'boolean') input.vatRegistered = body.vatRegistered
    if (typeof body.platformFeePercent === 'number') input.platformFeePercent = body.platformFeePercent
    await savePlatformVatSettings(input)
    return NextResponse.json({ settings: await getPlatformSettingsForAdmin() })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to save' }, { status: 400 })
  }
}
