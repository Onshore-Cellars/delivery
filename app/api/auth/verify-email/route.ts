import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }

    if (user.verified) {
      return NextResponse.json({ message: 'Email already verified' })
    }

    // Find the verification token
    const verifyNotif = await prisma.notification.findFirst({
      where: { userId: user.id, type: 'SYSTEM', title: 'EMAIL_VERIFY', message: token },
    })

    if (!verifyNotif) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 })
    }

    // Check expiry
    const metadata = verifyNotif.metadata ? JSON.parse(verifyNotif.metadata as string) : {}
    if (new Date(metadata.expiresAt) < new Date()) {
      await prisma.notification.delete({ where: { id: verifyNotif.id } })
      return NextResponse.json({ error: 'Verification link has expired. Please register again.' }, { status: 400 })
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true },
    })

    // Delete the verification token
    await prisma.notification.delete({ where: { id: verifyNotif.id } })

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
