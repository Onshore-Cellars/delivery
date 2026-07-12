import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { weeklyDigestEmail } from '@/lib/email'
import { queueEmail } from '@/lib/email-queue'
import { currencySymbol } from '@/lib/stripe'

export const runtime = 'nodejs'

// Authorised by x-cron-secret (scheduler) or an admin JWT.
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) return true
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.role === 'ADMIN') return true
  }
  return false
}

// POST /api/cron/digest — send the weekly activity digest to opted-in users.
// Body { onlyUserId? } lets an admin send themselves a test digest.
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const onlyUserId: string | undefined = body?.onlyUserId

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        emailNotifications: true,
        weeklyDigest: true,
        ...(onlyUserId ? { id: onlyUserId } : {}),
      },
      select: { id: true, name: true, email: true },
    })

    let sent = 0
    for (const u of users) {
      // Activity in the last 7 days across the user's two roles.
      const [asShipper, delivered, unreadNotifications, activeAsCarrier, pendingPayout] = await Promise.all([
        prisma.booking.count({ where: { shipperId: u.id, createdAt: { gte: since } } }),
        prisma.booking.count({ where: { shipperId: u.id, status: 'DELIVERED', actualDelivery: { gte: since } } }),
        prisma.notification.count({ where: { userId: u.id, read: false } }).catch(() => 0),
        prisma.booking.count({ where: { listing: { carrierId: u.id }, status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] } } }),
        prisma.booking.aggregate({
          where: { listing: { carrierId: u.id }, status: 'DELIVERED', payoutTransferredAt: null },
          _sum: { carrierPayout: true },
        }),
      ])

      const rows: { label: string; value: string }[] = []
      if (asShipper) rows.push({ label: 'New bookings placed', value: String(asShipper) })
      if (delivered) rows.push({ label: 'Shipments delivered', value: String(delivered) })
      if (activeAsCarrier) rows.push({ label: 'Active jobs to deliver', value: String(activeAsCarrier) })
      const awaiting = pendingPayout._sum.carrierPayout || 0
      if (awaiting > 0) rows.push({ label: 'Payouts awaiting release', value: `${currencySymbol('EUR')}${awaiting.toFixed(2)}` })
      if (unreadNotifications) rows.push({ label: 'Unread notifications', value: String(unreadNotifications) })

      // Skip users with nothing to report (unless it's an explicit test send).
      if (rows.length === 0 && !onlyUserId) continue

      if (rows.length === 0) rows.push({ label: 'Activity this week', value: 'All quiet — nothing new' })

      const tpl = weeklyDigestEmail({ name: u.name, rows, ctaLabel: 'Open dashboard', ctaUrl: `${appUrl}/dashboard` })
      await queueEmail({ to: u.email, ...tpl })
      sent++
    }

    return NextResponse.json({ candidates: users.length, sent })
  } catch (error) {
    console.error('Digest cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
