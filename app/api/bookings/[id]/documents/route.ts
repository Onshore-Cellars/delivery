import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// GET /api/bookings/[id]/documents - List documents for a booking
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: { select: { carrierId: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isShipper && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const documents = await prisma.bookingDocument.findMany({
      where: {
        bookingId: id,
        ...(isCarrier && !isAdmin ? { visibleToDriver: true } : {}),
        ...(isShipper && !isAdmin ? { visibleToShipper: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/bookings/[id]/documents - Upload a document for a booking
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { listing: { select: { carrierId: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    if (!isCarrier && !isShipper) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, type, fileUrl, fileKey, fileSize, mimeType, notes, visibleToDriver, visibleToShipper } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const validTypes = ['invoice', 'customs_declaration', 'packing_list', 'delivery_note', 'photo', 'certificate', 'insurance', 'port_permit', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const document = await prisma.bookingDocument.create({
      data: {
        bookingId: id,
        uploadedById: decoded.userId,
        name,
        type,
        fileUrl: fileUrl || null,
        fileKey: fileKey || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        notes: notes || null,
        visibleToDriver: visibleToDriver !== undefined ? visibleToDriver : true,
        visibleToShipper: visibleToShipper !== undefined ? visibleToShipper : true,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
