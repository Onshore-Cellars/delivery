import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

// Simple in-memory rate limiter for login attempts
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

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.' }, { status: 400 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.suspended) {
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 })
    }

    // Auto-promote admin emails
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'edward@onshorecellars.com,info@onshoredelivery.com')
      .toLowerCase().split(',').map(e => e.trim())

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
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : undefined
    console.error('Login error:', errMsg, errStack)
    return NextResponse.json({ error: 'Internal server error', detail: process.env.NODE_ENV !== 'production' ? errMsg : undefined }, { status: 500 })
  }
}
