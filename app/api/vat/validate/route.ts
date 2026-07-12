import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { checkVatNumber, normaliseVatNumber } from '@/lib/vat'

export const runtime = 'nodejs'

// POST /api/vat/validate — verify a VAT number (VIES) and, by default, save the
// result to the current user's profile.
//   body: { vatNumber: string, save?: boolean }   (save defaults to true)
//   body: { vatNumber: "" }                        clears the stored VAT number
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const raw = typeof body.vatNumber === 'string' ? body.vatNumber.trim() : ''
    const save = body.save !== false

    // Empty → clear the VAT number (revert to consumer/B2C).
    if (!raw) {
      if (save) {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { vatNumber: null, vatNumberValid: null, vatNumberCheckedAt: null, vatBusinessName: null, isBusiness: false },
        })
      }
      return NextResponse.json({ cleared: true })
    }

    const result = await checkVatNumber(raw)
    const parts = normaliseVatNumber(raw)

    if (save) {
      // Only mark as a business when the number is at least structurally valid.
      const accepted = result.source === 'format' ? false : result.valid
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          vatNumber: parts?.full ?? raw.toUpperCase(),
          vatNumberValid: result.source === 'vies' ? result.valid : (result.valid ? null : false),
          vatNumberCheckedAt: new Date(result.checkedAt),
          vatBusinessName: result.name ?? undefined,
          isBusiness: accepted || result.source === 'unavailable',
        },
      })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('VAT validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
