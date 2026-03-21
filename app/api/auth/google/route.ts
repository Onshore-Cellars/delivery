import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

interface GoogleTokenPayload {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture?: string
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    // Verify the token with Google's tokeninfo endpoint
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (!res.ok) return null

    const payload = await res.json()

    // Verify the audience matches our client ID
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId || payload.aud !== clientId) {
      console.error('Google token audience mismatch')
      return null
    }

    if (!payload.email_verified) return null

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified === 'true' || payload.email_verified === true,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { idToken, role } = body

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 })
    }

    const googleUser = await verifyGoogleToken(idToken)
    if (!googleUser) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    // Normalize email
    const normalizedEmail = googleUser.email.toLowerCase().trim()

    // Check if user exists by Google ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: normalizedEmail },
        ],
      },
    })

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            avatarUrl: user.avatarUrl || googleUser.picture,
          },
        })
      }

      if (user.suspended) {
        return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 })
      }

      // Auto-promote admin emails
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'edward@onshorecellars.com,info@onshoredelivery.com')
        .toLowerCase().split(',').map(e => e.trim())

      if (ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN', verified: true, canCarry: true, canShip: true, lastLoginAt: new Date() },
        })
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    } else {
      // New user — role is required for registration
      const validRoles = ['CARRIER', 'SUPPLIER', 'YACHT_OWNER']
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'ROLE_REQUIRED', message: 'Please select your account type' },
          { status: 400 }
        )
      }

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name,
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture || null,
          role,
          verified: true,
        },
      })
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
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
