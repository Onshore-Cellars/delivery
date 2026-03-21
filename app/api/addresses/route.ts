import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// GET /api/addresses — List saved addresses
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const type = req.nextUrl.searchParams.get('type') // pickup, delivery, or all

    const addresses = await prisma.savedAddress.findMany({
      where: {
        userId: decoded.userId,
        ...(type && type !== 'all' ? { type } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({ addresses })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/addresses — Save a new address
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { label, type, address, city, region, country, postcode, lat, lng,
      contactName, contactPhone, contactEmail, notes,
      marinaName, berthNumber, yachtName, portAccessNotes, isDefault } = body

    if (!label || !address) {
      return NextResponse.json({ error: 'Label and address are required' }, { status: 400 })
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: decoded.userId, type: type || 'other', isDefault: true },
        data: { isDefault: false },
      })
    }

    const saved = await prisma.savedAddress.create({
      data: {
        userId: decoded.userId,
        label, type: type || 'other', address,
        city, region, country, postcode, lat, lng,
        contactName, contactPhone, contactEmail, notes,
        marinaName, berthNumber, yachtName, portAccessNotes,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ address: saved }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
