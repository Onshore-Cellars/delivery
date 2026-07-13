import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword, verifyPassword, generateToken } from '@/lib/auth'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const limiter = createRateLimiter({ interval: 15 * 60_000, limit: 5 })

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = await limiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { password: true },
    })

    if (!user?.password) {
      return NextResponse.json({ error: 'Password change not available for social login accounts' }, { status: 400 })
    }

    const valid = await verifyPassword(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
    }

    const hashed = await hashPassword(newPassword)
    // Bump the session version so every other session's token is revoked; the
    // caller gets a fresh token below so their current session survives.
    const updated = await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed, sessionVersion: { increment: 1 } },
      select: { id: true, email: true, role: true, sessionVersion: true },
    })
    const newToken = generateToken({ userId: updated.id, email: updated.email, role: updated.role, sv: updated.sessionVersion })

    return NextResponse.json({ message: 'Password changed successfully', token: newToken })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
