import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createConnectAccount, createAccountLink, getAccountStatus } from '@/lib/stripe'

/**
 * Carrier payout onboarding via Stripe Connect (Express).
 *
 * Without this, a carrier's `stripeAccountId` is never set, checkout never
 * attaches `transfer_data`, the platform collects 100% of every charge, and no
 * carrier can ever be paid. This route creates (and persists) the Connect
 * account and hands back an onboarding link.
 */

// GET — current payout-onboarding status for the signed-in carrier.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { stripeAccountId: true },
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json({ connected: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false })
    }

    try {
      const status = await getAccountStatus(user.stripeAccountId)
      return NextResponse.json({ connected: true, ...status })
    } catch (e) {
      console.error('Connect status lookup failed:', e)
      // Account id exists locally but Stripe lookup failed — report connected-but-unknown
      return NextResponse.json({ connected: true, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false })
    }
  } catch (error) {
    console.error('Connect status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — start (or resume) onboarding; returns a Stripe-hosted onboarding URL.
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, canCarry: true, role: true, stripeAccountId: true, country: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Only carriers (or admins) need payout onboarding.
    if (!user.canCarry && user.role !== 'ADMIN' && user.role !== 'CARRIER') {
      return NextResponse.json({ error: 'Only carriers can set up payouts' }, { status: 403 })
    }

    let accountId = user.stripeAccountId

    // Create and persist the Connect account on first onboarding.
    if (!accountId) {
      const account = await createConnectAccount(user.email, user.country || 'GB')
      accountId = account.id
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      })
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = await createAccountLink(
      accountId,
      `${appUrl}/earnings?payouts=refresh`,
      `${appUrl}/earnings?payouts=done`,
    )

    return NextResponse.json({ url: link.url })
  } catch (error) {
    console.error('Connect onboarding error:', error)
    return NextResponse.json({ error: 'Could not start payout onboarding. Please try again.' }, { status: 500 })
  }
}
