import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// GET /api/alerts — Get user's saved alerts
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const alerts = await prisma.savedAlert.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Alerts fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/alerts — Create a new listing alert
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()

    // Max 10 alerts per user
    const count = await prisma.savedAlert.count({ where: { userId: decoded.userId } })
    if (count >= 10) {
      return NextResponse.json({ error: 'Maximum 10 alerts allowed. Delete an existing alert first.' }, { status: 400 })
    }

    const alert = await prisma.savedAlert.create({
      data: {
        userId: decoded.userId,
        name: body.name || null,
        originPort: body.originPort || null,
        originLat: body.originLat ? parseFloat(body.originLat) : null,
        originLng: body.originLng ? parseFloat(body.originLng) : null,
        destinationPort: body.destinationPort || null,
        destLat: body.destLat ? parseFloat(body.destLat) : null,
        destLng: body.destLng ? parseFloat(body.destLng) : null,
        radiusKm: body.radiusKm ? parseFloat(body.radiusKm) : 50,
        vehicleType: body.vehicleType || null,
        cargoType: body.cargoType || null,
        minCapacityKg: body.minCapacityKg ? parseFloat(body.minCapacityKg) : null,
        maxPricePerKg: body.maxPricePerKg ? parseFloat(body.maxPricePerKg) : null,
        dateFrom: body.dateFrom ? new Date(body.dateFrom) : null,
        dateTo: body.dateTo ? new Date(body.dateTo) : null,
        listingType: body.listingType || null,
        direction: body.direction || null,
        pushEnabled: body.pushEnabled !== false,
        emailEnabled: body.emailEnabled !== false,
      },
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Alert create error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/alerts — Delete an alert
export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })

    // Only delete own alerts
    await prisma.savedAlert.deleteMany({
      where: { id, userId: decoded.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alert delete error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/alerts — Toggle alert active/inactive
export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id, active } = await req.json()
    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })

    const alert = await prisma.savedAlert.updateMany({
      where: { id, userId: decoded.userId },
      data: { active: active !== false },
    })

    return NextResponse.json({ success: true, updated: alert.count })
  } catch (error) {
    console.error('Alert update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
