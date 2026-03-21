import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/admin/setup
// Promotes Edward@onshorecellars.com to ADMIN role
// This is a one-time setup endpoint secured by checking the email
const ADMIN_EMAIL = 'edward@onshorecellars.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Only allow promotion of the designated admin email
    if (email.toLowerCase() !== ADMIN_EMAIL) {
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
    const admin = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
      select: { id: true, email: true, role: true, verified: true },
    })

    return NextResponse.json({
      adminExists: !!admin,
      isAdmin: admin?.role === 'ADMIN',
      email: ADMIN_EMAIL,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
