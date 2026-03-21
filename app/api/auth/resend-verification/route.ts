import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSecureToken } from '@/lib/auth'
import { sendEmail, emailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email: rawEmail } = body

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : rawEmail

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({ success: true })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return successResponse
    }

    if (user.verified) {
      return successResponse
    }

    // Rate limit: max 3 per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentTokens = await prisma.notification.count({
      where: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'EMAIL_VERIFY',
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentTokens >= 3) {
      return NextResponse.json(
        { error: 'Too many verification emails requested. Please try again later.' },
        { status: 429 }
      )
    }

    // Invalidate any existing verification tokens
    await prisma.notification.deleteMany({
      where: { userId: user.id, type: 'SYSTEM', title: 'EMAIL_VERIFY' },
    })

    // Generate new verification token with 24-hour expiry
    const verifyToken = generateSecureToken()
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'EMAIL_VERIFY',
        message: verifyToken,
        metadata: JSON.stringify({ expiresAt: verifyExpiry.toISOString() }),
      },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verifyLink = `${appUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`

    const template = emailVerificationEmail({ name: user.name, verifyLink })
    await sendEmail({ to: email, ...template })

    return successResponse
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
