import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, password } = body

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must include uppercase, lowercase, and a number' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Find the reset token notification
    const resetNotif = await prisma.notification.findFirst({
      where: { userId: user.id, type: 'SYSTEM', title: 'PASSWORD_RESET', message: token },
    })

    if (!resetNotif) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check expiry
    const metadata = resetNotif.metadata ? JSON.parse(resetNotif.metadata as string) : {}
    if (new Date(metadata.expiresAt) < new Date()) {
      await prisma.notification.delete({ where: { id: resetNotif.id } })
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Update password
    const hashedPassword = await hashPassword(password)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete the reset token
    await prisma.notification.delete({ where: { id: resetNotif.id } })

    return NextResponse.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
