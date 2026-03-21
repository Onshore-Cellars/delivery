import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken, generateSecureToken } from '@/lib/auth'
import { sendEmail, welcomeEmail, emailVerificationEmail } from '@/lib/email'

// Simple in-memory rate limiter for registration
const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_REGISTER = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REGISTER
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { email, password, name, role, phone, company, canCarry, canShip } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Email, password, name, and role are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must include uppercase, lowercase, and a number' }, { status: 400 })
    }

    if (name.length > 100 || email.length > 255) {
      return NextResponse.json({ error: 'Input exceeds maximum length' }, { status: 400 })
    }

    const validRoles = ['CARRIER', 'SUPPLIER', 'YACHT_OWNER', 'CREW']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    // Auto-promote designated admin emails (configurable via env)
    const adminEmails = (process.env.ADMIN_EMAILS || 'edward@onshorecellars.com,info@onshoredelivery.com')
      .toLowerCase().split(',').map(e => e.trim())
    const isAdminEmail = adminEmails.includes(email.toLowerCase())
    const finalRole = isAdminEmail ? 'ADMIN' : role

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: finalRole,
        phone: phone || null,
        company: company || null,
        canCarry: isAdminEmail ? true : canCarry === true,
        canShip: isAdminEmail ? true : canShip !== false,
        verified: isAdminEmail ? true : false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        canCarry: true,
        canShip: true,
        verified: true,
        createdAt: true,
      },
    })

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })

    // Send welcome email (async, don't block registration)
    try {
      const template = welcomeEmail({ name: user.name, role: user.role })
      await sendEmail({ to: email, ...template })
    } catch (emailErr) {
      console.error('Welcome email error:', emailErr)
    }

    // Send email verification for non-admin users
    if (!isAdminEmail) {
      try {
        const verifyToken = generateSecureToken()
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const verifyLink = `${appUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`

        // Store verification token
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM',
            title: 'EMAIL_VERIFY',
            message: verifyToken,
            metadata: JSON.stringify({ expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
          },
        })

        const template = emailVerificationEmail({ name: user.name, verifyLink })
        await sendEmail({ to: email, ...template })
      } catch (verifyErr) {
        console.error('Verification email error:', verifyErr)
      }
    }

    return NextResponse.json({ user, token }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
