import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// POST /api/bookings/[id]/pod - Submit proof of delivery
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

    // Only the carrier can submit POD
    if (booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the carrier can submit proof of delivery' }, { status: 403 })
    }

    // Must be in transit or picked up
    if (!['PICKED_UP', 'IN_TRANSIT'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot submit POD for booking with status ${booking.status}` }, { status: 400 })
    }

    const body = await req.json()
    const { signature, photoUrl, photoData, notes, recipientName, deliveryLocation } = body

    if (!signature && !photoUrl && !photoData) {
      return NextResponse.json({ error: 'At least a signature or photo is required' }, { status: 400 })
    }

    // Limit base64 data size to 5MB to prevent storage abuse
    const MAX_BASE64_SIZE = 5 * 1024 * 1024
    if (signature && typeof signature === 'string' && signature.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: 'Signature data too large (max 5MB)' }, { status: 400 })
    }
    if (photoData && typeof photoData === 'string' && photoData.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: 'Photo data too large (max 5MB)' }, { status: 400 })
    }

    // Update booking with POD data and mark as delivered
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        podSignature: signature || null,        // Base64 signature data
        podPhotoUrl: photoUrl || photoData || null,  // Photo URL or base64
        podNotes: [
          notes || '',
          recipientName ? `Received by: ${recipientName}` : '',
          deliveryLocation ? `Location: ${deliveryLocation}` : '',
        ].filter(Boolean).join('\n') || null,
        status: 'DELIVERED',
        actualDelivery: new Date(),
      },
    })

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        bookingId: id,
        status: 'DELIVERED',
        description: `Delivered${recipientName ? ` — signed by ${recipientName}` : ''}${signature ? ' (signature captured)' : ''}${photoUrl || photoData ? ' (photo attached)' : ''}`,
        location: deliveryLocation || null,
      },
    })

    // Notify the shipper
    await prisma.notification.create({
      data: {
        userId: booking.shipperId,
        type: 'BOOKING_STATUS_UPDATE',
        title: 'Delivery Confirmed',
        message: `Your shipment ${booking.trackingCode} has been delivered${recipientName ? ` and signed for by ${recipientName}` : ''}.`,
        linkUrl: `/dashboard`,
      },
    })

    // End any active live tracking
    await prisma.liveTracking.updateMany({
      where: { bookingId: id, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        status: updated.status,
        trackingCode: updated.trackingCode,
        actualDelivery: updated.actualDelivery,
      },
    })
  } catch (error) {
    console.error('POD submission error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/bookings/[id]/pod - Get POD details (shipper or carrier)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        shipperId: true,
        status: true,
        trackingCode: true,
        pickupSignature: true,
        pickupPhotoUrl: true,
        pickupConfirmedAt: true,
        podSignature: true,
        podPhotoUrl: true,
        podNotes: true,
        podRecipientName: true,
        actualDelivery: true,
        listing: { select: { carrierId: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isCarrier = booking.listing.carrierId === decoded.userId
    const isShipper = booking.shipperId === decoded.userId
    if (!isCarrier && !isShipper && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({
      pickup: {
        signature: booking.pickupSignature || null,
        photoUrl: booking.pickupPhotoUrl || null,
        confirmedAt: booking.pickupConfirmedAt || null,
      },
      delivery: {
        signature: booking.podSignature || null,
        photoUrl: booking.podPhotoUrl || null,
        notes: booking.podNotes || null,
        recipientName: booking.podRecipientName || null,
        deliveredAt: booking.actualDelivery || null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
