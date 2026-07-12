import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { checkVatNumber, normaliseVatNumber } from '@/lib/vat'
import { createRateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Per-user cap on VIES lookups — the endpoint makes an outbound call to the EU
// service and writes the profile, so bound it to prevent abuse / egress throttling.
const vatLimiter = createRateLimiter({ interval: 60 * 60_000, limit: 30 })

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

    const rl = await vatLimiter.check(`vat:${decoded.userId}`)
    if (!rl.success) return NextResponse.json({ error: 'Too many VAT checks. Please try again later.' }, { status: 429 })

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
      // vatNumberValid is TRUE only when VIES positively confirmed it. Format-only
      // or downtime results are stored as null ("unverified"), never true — the
      // checkout VAT gate requires a positively-verified number for reverse
      // charge, so an unverified number is charged VAT (fail-safe).
      const viesConfirmed = result.source === 'vies' && result.valid
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          vatNumber: parts?.full ?? raw.toUpperCase(),
          vatNumberValid: result.source === 'vies' ? result.valid : (result.valid === false ? false : null),
          vatNumberCheckedAt: new Date(result.checkedAt),
          vatBusinessName: result.name ?? undefined,
          // Display/marker flag only — does NOT by itself grant reverse charge.
          isBusiness: !!parts,
        },
      })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('VAT validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
