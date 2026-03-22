import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'ADMIN' && decoded.userId !== userId) {
      return NextResponse.json({ error: 'Cannot modify other admin users' }, { status: 403 })
    }

    // Prevent admin from unsuspending themselves
    if (decoded.userId === userId && user.suspended) {
      return NextResponse.json({ error: 'Cannot modify your own account while suspended' }, { status: 403 })
    }

    // Full edit mode: updates object provided
    if (updates && typeof updates === 'object') {
      const allowed = ['name', 'email', 'phone', 'company', 'role', 'verified', 'suspended', 'canCarry', 'canShip',
        'yachtName', 'yachtMMSI', 'yachtIMO', 'yachtFlag', 'yachtLength', 'yachtType',
        'homePort', 'marineCertified', 'backgroundChecked', 'yearsExperience'] as const
      const updateData: Record<string, unknown> = {}
      for (const key of allowed) {
        if (key in updates) {
          updateData[key] = updates[key]
        }
      }
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true, email: true, name: true, role: true, phone: true, company: true,
          verified: true, suspended: true, canCarry: true, canShip: true, createdAt: true,
          _count: { select: { listings: true, bookings: true } },
        },
      })
      return NextResponse.json({ user: updatedUser, message: 'User updated successfully' })
    }

    // Action mode (legacy): verify/suspend/unsuspend
    if (!action || !['verify', 'suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: 'Valid action or updates object required' }, { status: 400 })
    }

    const updateData: Record<string, boolean> = {}
    if (action === 'verify') updateData.verified = true
    if (action === 'suspend') updateData.suspended = true
    if (action === 'unsuspend') updateData.suspended = false

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            bookings: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: action === 'verify' ? 'User verified successfully' : action === 'suspend' ? 'User suspended successfully' : 'User unsuspended successfully',
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
