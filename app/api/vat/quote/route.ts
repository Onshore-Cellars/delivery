import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { snapshotBookingVat } from '@/lib/vat'
import { getPlatformVatConfig } from '@/lib/settings'

export const runtime = 'nodejs'

// GET /api/vat/quote?net=1234.56
// Returns the VAT that would be charged to the CURRENT user (from their profile
// VAT status + country) on a given net amount — for pre-checkout transparency.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const net = Number(new URL(request.url).searchParams.get('net'))
    if (!Number.isFinite(net) || net < 0) {
      return NextResponse.json({ error: 'net must be a non-negative number' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { country: true, vatNumber: true, vatNumberValid: true, isBusiness: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const s = snapshotBookingVat(net, {
      country: user.country,
      vatNumber: user.vatNumber,
      vatValid: user.vatNumberValid,
      isBusiness: user.isBusiness,
    }, { platform: await getPlatformVatConfig() })

    return NextResponse.json({
      net: s.net,
      vatAmount: s.vatAmount,
      vatRate: s.vatRate,
      gross: s.gross,
      treatment: s.treatment,
      note: s.note,
    })
  } catch (error) {
    console.error('VAT quote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
