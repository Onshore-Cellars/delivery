import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

// Simple in-memory rate limiter for login attempts (per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

// Per-account lockout tracking
const accountAttempts = new Map<string, { count: number; lockedUntil?: number }>()
const MAX_ACCOUNT_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

function getAccountLockStatus(userId: string): { locked: boolean; minutesLeft?: number } {
  const now = Date.now()
  const entry = accountAttempts.get(userId)
  if (!entry) return { locked: false }
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000)
    return { locked: true, minutesLeft }
  }
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    accountAttempts.delete(userId)
    return { locked: false }
  }
  return { locked: false }
}

function recordFailedAttempt(userId: string): void {
  const entry = accountAttempts.get(userId) || { count: 0 }
  entry.count++
  if (entry.count >= MAX_ACCOUNT_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
  }
  accountAttempts.set(userId, entry)
}

function resetAccountAttempts(userId: string): void {
  accountAttempts.delete(userId)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { email: rawEmail, password } = body

    if (!rawEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof rawEmail !== 'string' || !emailRegex.test(rawEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const email = rawEmail.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.suspended) {
      return NextResponse.json({ error: 'Account is suspended' }, { status: 403 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 400 })
    }

    // Check account lockout
    const lockStatus = getAccountLockStatus(user.id)
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${lockStatus.minutesLeft} minutes.` },
        { status: 429 }
      )
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      recordFailedAttempt(user.id)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Successful login — reset account attempts
    resetAccountAttempts(user.id)

    // Auto-promote admin emails
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
      .toLowerCase().split(',').map(e => e.trim()).filter(Boolean)

    if (ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN', verified: true, canCarry: true, canShip: true, lastLoginAt: new Date() },
      })
      user.role = 'ADMIN'
      user.verified = true
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        canCarry: user.canCarry,
        canShip: user.canShip,
        verified: user.verified,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
