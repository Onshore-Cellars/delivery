import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, deletedAt: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.deletedAt) return NextResponse.json({ error: 'Account already deleted' }, { status: 400 })

    // Soft-delete and anonymize personal data
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        deletedAt: new Date(),
        name: 'Deleted User',
        email: `deleted_${decoded.userId}@removed.local`,
        phone: null,
        company: null,
        bio: null,
        website: null,
        address: null,
        city: null,
        country: null,
        avatarUrl: null,
      },
    })

    // Deactivate all saved alerts
    await prisma.savedAlert.updateMany({
      where: { userId: decoded.userId },
      data: { active: false },
    })

    // Audit log
    await logAudit({
      userId: decoded.userId,
      targetId: decoded.userId,
      action: 'ACCOUNT_DELETED',
      details: { method: 'self_service' },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion',
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
