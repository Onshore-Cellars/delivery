import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { queueEmail } from '@/lib/email-queue'

// GET /api/bookings/[id]/customs — get customs status and requirements
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
        trackingCode: true,
        status: true,
        customsRequired: true,
        pickupCountry: true,
        deliveryCountry: true,
        cargoDescription: true,
        declaredValue: true,
        currency: true,
        isDangerous: true,
        shipperId: true,
        listing: { select: { carrierId: true, originCountry: true, destinationCountry: true } },
        documents: {
          where: {
            type: { in: ['customs_declaration', 'invoice', 'certificate', 'port_permit'] },
          },
          select: {
            id: true, type: true, name: true, fileUrl: true, createdAt: true,
          },
        },
        trackingEvents: {
          where: { description: { contains: 'customs' } },
          select: { id: true, status: true, description: true, location: true, timestamp: true },
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.shipperId !== decoded.userId && booking.listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Determine customs requirements based on origin/destination
    const originCountry = booking.pickupCountry || booking.listing.originCountry
    const destCountry = booking.deliveryCountry || booking.listing.destinationCountry
    const isCrossBorder = originCountry && destCountry && originCountry !== destCountry

    const euCountries = ['France', 'Spain', 'Italy', 'Greece', 'Netherlands', 'Germany', 'Portugal', 'Croatia', 'Belgium', 'Malta', 'Cyprus', 'Slovenia', 'Montenegro']
    const isEUtoEU = euCountries.some(c => originCountry?.includes(c)) && euCountries.some(c => destCountry?.includes(c))
    const involvesUK = originCountry?.includes('United Kingdom') || originCountry?.includes('UK') || destCountry?.includes('United Kingdom') || destCountry?.includes('UK')

    // Determine required documents
    const requiredDocs: { type: string; label: string; required: boolean; notes?: string }[] = []

    if (isCrossBorder) {
      requiredDocs.push(
        { type: 'invoice', label: 'Commercial Invoice', required: true, notes: 'Itemised list with declared values' },
        { type: 'packing_list', label: 'Packing List', required: true },
      )

      if (!isEUtoEU) {
        requiredDocs.push(
          { type: 'customs_declaration', label: 'Customs Declaration', required: true, notes: involvesUK ? 'Required for UK post-Brexit. Use form C88/SAD.' : 'Required for non-EU shipments' },
        )
      }

      if (involvesUK) {
        requiredDocs.push(
          { type: 'certificate', label: 'Certificate of Origin', required: false, notes: 'May reduce duty under UK-EU TCA' },
        )
      }

      if (booking.isDangerous) {
        requiredDocs.push(
          { type: 'certificate', label: 'ADR/IMDG Certificate', required: true, notes: 'Required for dangerous goods transport' },
        )
      }

      if (booking.declaredValue && booking.declaredValue > 10000) {
        requiredDocs.push(
          { type: 'certificate', label: 'Export License', required: false, notes: 'May be required for high-value goods over €10,000' },
        )
      }
    }

    if (destCountry?.includes('Turkey') || originCountry?.includes('Turkey')) {
      requiredDocs.push(
        { type: 'port_permit', label: 'Turkish Port Entry Permit', required: true },
      )
    }

    // Check which required docs are uploaded
    const uploadedTypes = new Set(booking.documents.map(d => d.type))
    const docStatus = requiredDocs.map(rd => ({
      ...rd,
      uploaded: uploadedTypes.has(rd.type),
    }))

    const allRequiredUploaded = docStatus.filter(d => d.required).every(d => d.uploaded)
    const customsReady = !isCrossBorder || allRequiredUploaded

    return NextResponse.json({
      bookingId: booking.id,
      trackingCode: booking.trackingCode,
      status: booking.status,
      customsRequired: booking.customsRequired || (isCrossBorder && !isEUtoEU),
      isCrossBorder,
      isEUtoEU,
      involvesUK,
      originCountry,
      destCountry,
      declaredValue: booking.declaredValue,
      currency: booking.currency,
      isDangerous: booking.isDangerous,
      requiredDocuments: docStatus,
      uploadedDocuments: booking.documents,
      customsEvents: booking.trackingEvents,
      customsReady,
      allRequiredUploaded,
    })
  } catch (error) {
    console.error('Customs status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings/[id]/customs — update customs status (admin/carrier)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { action, notes, location } = await req.json()

    if (!action || !['hold', 'clear', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be hold, clear, or reject' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        shipper: { select: { id: true, name: true, email: true } },
        listing: { select: { carrierId: true, carrier: { select: { name: true, email: true } } } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.listing.carrierId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only carrier or admin can update customs status' }, { status: 403 })
    }

    const statusMap: Record<string, string> = {
      hold: 'CUSTOMS_HOLD',
      clear: 'IN_TRANSIT',
      reject: 'CANCELLED',
    }

    const descMap: Record<string, string> = {
      hold: `Shipment held at customs${notes ? `: ${notes}` : ''}`,
      clear: `Customs cleared${notes ? `. ${notes}` : ''}`,
      reject: `Customs rejected${notes ? `: ${notes}` : ''}`,
    }

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: statusMap[action] as 'CUSTOMS_HOLD' | 'IN_TRANSIT' | 'CANCELLED' },
    })

    // Create tracking event
    await prisma.trackingEvent.create({
      data: {
        bookingId: id,
        status: statusMap[action],
        description: descMap[action],
        location: location || null,
      },
    })

    // Notify shipper
    const notifTitle = action === 'hold' ? 'Customs Hold' : action === 'clear' ? 'Customs Cleared' : 'Customs Rejected'
    await prisma.notification.create({
      data: {
        userId: booking.shipperId,
        type: 'BOOKING_STATUS_UPDATE',
        title: notifTitle,
        message: descMap[action],
        linkUrl: `/tracking?code=${booking.trackingCode}`,
      },
    })

    // Send email
    const emailSubject = action === 'hold'
      ? `Customs Hold - ${booking.trackingCode}`
      : action === 'clear'
        ? `Customs Cleared - ${booking.trackingCode}`
        : `Customs Rejected - ${booking.trackingCode}`

    await queueEmail({
      to: booking.shipper.email,
      subject: emailSubject,
      html: `<p>${descMap[action]}</p><p>Tracking code: <strong>${booking.trackingCode}</strong></p>${
        action === 'hold' ? '<p>Please upload any required customs documents to expedite clearance.</p>' : ''
      }`,
    })

    return NextResponse.json({ booking: updated, event: descMap[action] })
  } catch (error) {
    console.error('Customs update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
