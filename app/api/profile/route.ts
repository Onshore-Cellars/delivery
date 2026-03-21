import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// GET profile
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, email: true, name: true, role: true,
        phone: true, company: true, bio: true, website: true,
        address: true, city: true, country: true, avatarUrl: true,
        canCarry: true, canShip: true,
        yachtName: true, yachtMMSI: true, yachtIMO: true, yachtFlag: true,
        yachtLength: true, yachtType: true, homePort: true,
        emailNotifications: true, smsNotifications: true,
        verified: true, createdAt: true,
        stripeAccountId: true,
        _count: { select: { listings: true, bookings: true, receivedReviews: true, documents: true, vehicles: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { targetId: decoded.userId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({
      user,
      rating: {
        average: avgRating._avg.rating || 0,
        count: avgRating._count.rating,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH update profile
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Check if user is suspended
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { suspended: true } })
    if (currentUser?.suspended) {
      return NextResponse.json({ error: 'Your account is suspended' }, { status: 403 })
    }

    const body = await request.json()

    // Validate name length if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 100)) {
      return NextResponse.json({ error: 'Name must be between 1 and 100 characters' }, { status: 400 })
    }

    const allowedFields = [
      'name', 'phone', 'company', 'bio', 'website', 'address', 'city', 'country',
      'avatarUrl',
      'emailNotifications', 'smsNotifications',
      'canCarry', 'canShip',
      'yachtName', 'yachtMMSI', 'yachtIMO', 'yachtFlag', 'yachtLength', 'yachtType', 'homePort',
    ]

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data,
      select: {
        id: true, email: true, name: true, role: true,
        phone: true, company: true, bio: true, website: true,
        address: true, city: true, country: true, avatarUrl: true,
        canCarry: true, canShip: true,
        yachtName: true, yachtMMSI: true, yachtIMO: true, yachtFlag: true,
        yachtLength: true, yachtType: true, homePort: true,
        emailNotifications: true, smsNotifications: true,
        verified: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
