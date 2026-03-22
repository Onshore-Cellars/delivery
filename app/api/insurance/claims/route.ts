import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { queueEmail } from '@/lib/email-queue'

// GET /api/insurance/claims — list user's insurance claims
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const isAdmin = decoded.role === 'ADMIN'

    // Insurance claims are stored as disputes with type 'DAMAGE' or 'LOSS' that have insurance
    const bookings = await prisma.booking.findMany({
      where: {
        ...(isAdmin ? {} : {
          OR: [
            { shipperId: decoded.userId },
            { listing: { carrierId: decoded.userId } },
          ],
        }),
        insuranceTier: { not: null },
      },
      select: {
        id: true,
        trackingCode: true,
        cargoDescription: true,
        totalPrice: true,
        currency: true,
        status: true,
        insuranceTier: true,
        insurancePremium: true,
        insuredValue: true,
        customsRequired: true,
        createdAt: true,
        shipper: { select: { id: true, name: true } },
        listing: { select: { carrier: { select: { id: true, name: true } } } },
        disputes: {
          where: { type: { in: ['DAMAGE', 'LOSS'] } },
          select: {
            id: true, type: true, status: true, description: true,
            claimAmount: true, createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform into claims list
    const claims = bookings.flatMap(b =>
      b.disputes.map(d => ({
        claimId: d.id,
        bookingId: b.id,
        trackingCode: b.trackingCode,
        cargoDescription: b.cargoDescription,
        bookingTotal: b.totalPrice,
        currency: b.currency,
        insuranceTier: b.insuranceTier,
        insurancePremium: b.insurancePremium,
        insuredValue: b.insuredValue,
        claimType: d.type,
        claimStatus: d.status,
        claimAmount: d.claimAmount,
        description: d.description,
        filedAt: d.createdAt,
        shipper: b.shipper,
        carrier: b.listing.carrier,
      }))
    )

    // Also get insured bookings without claims (for reference)
    const insuredBookings = bookings
      .filter(b => b.disputes.length === 0)
      .map(b => ({
        bookingId: b.id,
        trackingCode: b.trackingCode,
        cargoDescription: b.cargoDescription,
        insuranceTier: b.insuranceTier,
        insurancePremium: b.insurancePremium,
        insuredValue: b.insuredValue,
        status: b.status,
        currency: b.currency,
      }))

    return NextResponse.json({ claims, insuredBookings })
  } catch (error) {
    console.error('Insurance claims error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/insurance/claims — file an insurance claim
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { bookingId, type, description, claimAmount, evidence } = await req.json()

    if (!bookingId || !type || !description) {
      return NextResponse.json({ error: 'bookingId, type, and description are required' }, { status: 400 })
    }

    if (!['DAMAGE', 'LOSS'].includes(type)) {
      return NextResponse.json({ error: 'Insurance claims must be type DAMAGE or LOSS' }, { status: 400 })
    }

    // Verify booking has insurance
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        shipper: { select: { id: true, name: true, email: true, preferredLanguage: true } },
        listing: { select: { carrierId: true, carrier: { select: { name: true, email: true } } } },
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (!booking.insuranceTier) {
      return NextResponse.json({ error: 'This booking does not have insurance coverage' }, { status: 400 })
    }

    if (booking.shipperId !== decoded.userId && booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized to file a claim for this booking' }, { status: 403 })
    }

    // Validate claim amount against insured value
    const maxClaim = booking.insuredValue || booking.totalPrice
    if (claimAmount && claimAmount > maxClaim) {
      return NextResponse.json({
        error: `Claim amount cannot exceed insured value of ${maxClaim}`,
      }, { status: 400 })
    }

    const againstId = booking.shipperId === decoded.userId
      ? booking.listing.carrierId
      : booking.shipperId

    // Create dispute record as insurance claim
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        raisedById: decoded.userId,
        againstId,
        type,
        description: `[INSURANCE CLAIM - ${booking.insuranceTier?.toUpperCase()} COVER]\n${description}`,
        evidence: evidence || [],
        claimAmount: claimAmount ? parseFloat(String(claimAmount)) : null,
        priority: 'HIGH',
      },
    })

    // Notify both parties
    await prisma.notification.createMany({
      data: [
        {
          userId: booking.shipperId,
          type: 'BOOKING_STATUS_UPDATE',
          title: 'Insurance Claim Filed',
          message: `An insurance claim has been filed for booking ${booking.trackingCode || bookingId}`,
          linkUrl: `/disputes`,
        },
        {
          userId: booking.listing.carrierId,
          type: 'BOOKING_STATUS_UPDATE',
          title: 'Insurance Claim Filed',
          message: `An insurance claim has been filed for booking ${booking.trackingCode || bookingId}`,
          linkUrl: `/disputes`,
        },
      ],
    })

    // Send email notification
    await queueEmail({
      to: booking.shipper.email,
      subject: `Insurance Claim Filed - ${booking.trackingCode || bookingId}`,
      html: `<p>An insurance claim (${type}) has been filed for your booking ${booking.trackingCode || bookingId}.</p>
             <p><strong>Coverage:</strong> ${booking.insuranceTier} tier</p>
             <p><strong>Insured Value:</strong> ${booking.insuredValue}</p>
             <p>We will review the claim within 5 business days.</p>`,
    })

    return NextResponse.json({ claim: dispute }, { status: 201 })
  } catch (error) {
    console.error('Insurance claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
