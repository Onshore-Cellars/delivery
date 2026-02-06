import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET a single booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.substring(7))
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            carrier: { select: { id: true, name: true, company: true, email: true, phone: true } },
          },
        },
        shipper: { select: { id: true, name: true, email: true, phone: true } },
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check authorization - only involved parties or admin can view
    const isCarrier = booking.listing.carrierId === decoded.userId
    const isCustomer = booking.shipperId === decoded.userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isCarrier && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
