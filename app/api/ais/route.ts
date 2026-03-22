import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AISSTREAM_WS_URL, createAISSubscription, getVesselTrackingURLs } from '@/lib/ais-tracking'

// GET /api/ais?mmsi=123456789 — get vessel position via AISStream
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const mmsi = req.nextUrl.searchParams.get('mmsi')
    if (!mmsi) {
      return NextResponse.json({ error: 'MMSI parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.AISSTREAM_API_KEY

    // Return tracking URLs and WebSocket config for client-side connection
    // The browser's native WebSocket is used to connect to AISStream
    return NextResponse.json({
      mmsi,
      trackingUrls: getVesselTrackingURLs(mmsi),
      ws: apiKey ? {
        url: AISSTREAM_WS_URL,
        subscription: createAISSubscription([mmsi], apiKey),
      } : null,
      message: apiKey ? 'Connect via WebSocket for live AIS data' : 'AIS API key not configured. Use tracking URLs for vessel position.',
    })
  } catch (error) {
    console.error('AIS tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ais/subscribe — subscribe to vessel updates for a booking
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { bookingId, mmsi } = await req.json()
    if (!bookingId || !mmsi) {
      return NextResponse.json({ error: 'bookingId and mmsi are required' }, { status: 400 })
    }

    // Verify user is involved in booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { carrierId: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.shipperId !== decoded.userId && booking.listing.carrierId !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Store MMSI on booking for tracking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { yachtMMSI: mmsi },
    })

    const apiKey = process.env.AISSTREAM_API_KEY
    return NextResponse.json({
      subscribed: true,
      mmsi,
      trackingUrls: getVesselTrackingURLs(mmsi),
      wsUrl: apiKey ? AISSTREAM_WS_URL : null,
      wsSubscription: apiKey ? createAISSubscription([mmsi], apiKey) : null,
    })
  } catch (error) {
    console.error('AIS subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

