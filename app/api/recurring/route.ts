import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { nextRunFrom, Frequency } from '@/lib/recurring'

export const runtime = 'nodejs'

const FREQS: Frequency[] = ['weekly', 'biweekly', 'monthly']

// GET /api/recurring — the current user's recurring bookings.
export async function GET(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const items = await prisma.recurringBooking.findMany({
    where: { shipperId: decoded.userId },
    include: { listing: { select: { title: true, originPort: true, destinationPort: true, currency: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items })
}

// POST /api/recurring — create a recurring booking schedule.
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const b = await request.json()
    const frequency = b.frequency as Frequency
    if (!FREQS.includes(frequency)) return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    if (!b.listingId || !b.cargoDescription || !(b.weightKg > 0) || !(b.volumeM3 > 0)) {
      return NextResponse.json({ error: 'listingId, cargoDescription, weightKg and volumeM3 are required' }, { status: 400 })
    }
    const listing = await prisma.listing.findUnique({ where: { id: b.listingId }, select: { id: true } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const start = b.startDate ? new Date(b.startDate) : new Date()
    const schedule = { frequency, dayOfWeek: b.dayOfWeek ?? null, dayOfMonth: b.dayOfMonth ?? null }
    const nextRunAt = nextRunFrom(schedule, start)

    const created = await prisma.recurringBooking.create({
      data: {
        shipperId: decoded.userId,
        listingId: b.listingId,
        cargoDescription: String(b.cargoDescription).slice(0, 500),
        cargoType: b.cargoType || null,
        weightKg: Number(b.weightKg),
        volumeM3: Number(b.volumeM3),
        timeWindow: b.timeWindow || null,
        notes: b.notes || null,
        frequency,
        dayOfWeek: schedule.dayOfWeek,
        dayOfMonth: schedule.dayOfMonth,
        nextRunAt,
        endDate: b.endDate ? new Date(b.endDate) : null,
        remainingCount: typeof b.count === 'number' && b.count > 0 ? b.count : null,
        active: true,
      },
    })
    return NextResponse.json({ recurring: created }, { status: 201 })
  } catch (error) {
    console.error('Create recurring error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/recurring?id=... — cancel (deactivate) a schedule you own.
export async function DELETE(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const existing = await prisma.recurringBooking.findUnique({ where: { id }, select: { shipperId: true } })
  if (!existing || existing.shipperId !== decoded.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await prisma.recurringBooking.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ cancelled: true })
}
