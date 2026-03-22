import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSecureToken } from '@/lib/auth'
import { sendEmail, passwordResetEmail } from '@/lib/email'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const limiter = createRateLimiter({ interval: 15 * 60_000, limit: 5 })

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = await limiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { email: rawEmail } = body

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : rawEmail

    // Always return success to prevent email enumeration
    const successMsg = 'If an account with that email exists, a password reset link has been sent.'

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      // Don't reveal whether account exists
      return NextResponse.json({ message: successMsg })
    }

    // Generate reset token with 1-hour expiry
    const resetToken = generateSecureToken()
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000)

    // Store token in user metadata (using bio field temporarily, or create a notification)
    // We'll store it as a notification with metadata for simplicity
    // First, invalidate any existing reset tokens
    await prisma.notification.deleteMany({
      where: { userId: user.id, type: 'SYSTEM', title: 'PASSWORD_RESET' },
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'PASSWORD_RESET',
        message: resetToken,
        metadata: JSON.stringify({ expiresAt: resetExpiry.toISOString() }),
      },
    })

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    const template = passwordResetEmail({ name: user.name, resetLink })
    await sendEmail({ to: email, ...template })

    return NextResponse.json({ message: successMsg })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
