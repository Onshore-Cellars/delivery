import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateApiKey } from '@/lib/api-key'

// ─── POST /api/integrations/keys ────────────────────────────────────────────
// Generate a new API key for the authenticated user's company.
// Auth: JWT (user must be logged in). The raw key is returned ONCE.

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(getTokenFromHeader(request.headers.get('authorization')) || '')
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, scopes, expiresInDays } = body

    if (!name || typeof name !== 'string' || name.length > 100) {
      return NextResponse.json(
        { error: 'name is required (max 100 chars)' },
        { status: 400 },
      )
    }

    // Limit keys per user
    const existingCount = await prisma.apiKey.count({
      where: { userId: decoded.userId, revokedAt: null },
    })
    if (existingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 active API keys per account' },
        { status: 400 },
      )
    }

    const { raw, hash, prefix } = generateApiKey()

    const validScopes = ['orders:write', 'orders:read']
    const requestedScopes = Array.isArray(scopes)
      ? scopes.filter((s: string) => validScopes.includes(s))
      : validScopes

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: decoded.userId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: requestedScopes,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 86400000)
          : null,
      },
    })

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: raw, // Only returned once — cannot be retrieved again
      prefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      warning: 'Save this key now — it cannot be retrieved again.',
    }, { status: 201 })
  } catch (error) {
    console.error('[integrations/keys] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ─── GET /api/integrations/keys ─────────────────────────────────────────────
// List API keys for the authenticated user (shows prefix, never the full key).

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(getTokenFromHeader(request.headers.get('authorization')) || '')
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: decoded.userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('[integrations/keys] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/integrations/keys ──────────────────────────────────────────
// Revoke an API key.

export async function DELETE(request: NextRequest) {
  try {
    const decoded = verifyToken(getTokenFromHeader(request.headers.get('authorization')) || '')
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')
    if (!keyId) {
      return NextResponse.json({ error: 'Missing key id' }, { status: 400 })
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: decoded.userId },
    })
    if (!apiKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ message: 'API key revoked' })
  } catch (error) {
    console.error('[integrations/keys] DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
