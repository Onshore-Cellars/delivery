import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/favourites — list user's favourite carriers
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const favourites = await prisma.favouriteCarrier.findMany({
      where: { userId: decoded.userId },
      include: {
        carrier: {
          select: {
            id: true,
            name: true,
            company: true,
            avatarUrl: true,
            phone: true,
            specializations: true,
            marineCertified: true,
            operatingRegions: true,
            verified: true,
            _count: { select: { listings: true, receivedReviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favourites })
  } catch (error) {
    console.error('Favourites fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/favourites — add a favourite carrier
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { carrierId, notes } = await req.json()
    if (!carrierId) return NextResponse.json({ error: 'carrierId required' }, { status: 400 })

    if (carrierId === decoded.userId) {
      return NextResponse.json({ error: 'Cannot favourite yourself' }, { status: 400 })
    }

    const favourite = await prisma.favouriteCarrier.upsert({
      where: { userId_carrierId: { userId: decoded.userId, carrierId } },
      create: { userId: decoded.userId, carrierId, notes },
      update: { notes },
    })

    return NextResponse.json({ favourite }, { status: 201 })
  } catch (error) {
    console.error('Favourite create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/favourites — remove a favourite carrier
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { carrierId } = await req.json()
    if (!carrierId) return NextResponse.json({ error: 'carrierId required' }, { status: 400 })

    await prisma.favouriteCarrier.deleteMany({
      where: { userId: decoded.userId, carrierId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Favourite delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
