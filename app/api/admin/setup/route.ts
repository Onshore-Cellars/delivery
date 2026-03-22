import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// POST /api/admin/setup
// Promotes designated emails to ADMIN role
// Requires authentication — only the user themselves or an existing admin can promote
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .toLowerCase().split(',').map(e => e.trim()).filter(Boolean)

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Only allow promotion of designated admin emails
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only the user themselves or an existing admin can trigger promotion
    if (decoded.email.toLowerCase() !== email.toLowerCase() && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ message: 'User is already an admin', user: { id: user.id, email: user.email, role: user.role } })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN',
        verified: true,
        canCarry: true,
        canShip: true,
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json({
      message: 'Admin access granted successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Check if admin account exists
export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: { email: { in: ADMIN_EMAILS } },
      select: { id: true, email: true, role: true, verified: true },
    })

    return NextResponse.json({
      adminExists: admins.some(a => a.role === 'ADMIN'),
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
