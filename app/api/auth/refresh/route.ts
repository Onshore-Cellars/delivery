import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    // Verify the current token — if expired, the user must log in again
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      )
    }

    // Check the user still exists and is not suspended or soft-deleted
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    }) as { id: string; email: string; role: string; suspended: boolean; deletedAt: Date | null } | null

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    if (user.suspended) {
      return NextResponse.json(
        { error: 'Account is suspended' },
        { status: 403 }
      )
    }

    if (user.deletedAt !== null) {
      return NextResponse.json(
        { error: 'Account has been deleted' },
        { status: 403 }
      )
    }

    // Issue a fresh token with a new 7-day expiry
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
