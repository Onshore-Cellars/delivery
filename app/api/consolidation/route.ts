import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'

// Haversine distance
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// GET /api/consolidation — Find bookings/loads that can be consolidated on the same route
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '50')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }

    // Get the target listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true, originPort: true, destinationPort: true,
        originLat: true, originLng: true, destinationLat: true, destinationLng: true,
        departureDate: true, availableKg: true, availableM3: true,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Find SPACE_NEEDED listings on similar routes and similar dates
    const dateWindow = new Date(listing.departureDate)
    const dateStart = new Date(dateWindow)
    dateStart.setDate(dateStart.getDate() - 3)
    const dateEnd = new Date(dateWindow)
    dateEnd.setDate(dateEnd.getDate() + 3)

    const candidates = await prisma.listing.findMany({
      where: {
        id: { not: listing.id },
        listingType: 'SPACE_NEEDED',
        status: 'ACTIVE',
        departureDate: { gte: dateStart, lte: dateEnd },
      },
      include: {
        carrier: { select: { id: true, name: true, company: true, avatarUrl: true } },
      },
      take: 20,
    })

    // Score each candidate based on route proximity
    const matches = candidates
      .map(c => {
        let score = 0
        let originDist = Infinity
        let destDist = Infinity

        // Check origin proximity
        if (listing.originLat && listing.originLng && c.originLat && c.originLng) {
          originDist = haversineKm(listing.originLat, listing.originLng, c.originLat, c.originLng)
          if (originDist <= radiusKm) score += 50
        } else if (c.originPort.toLowerCase().includes(listing.originPort.toLowerCase().slice(0, 4))) {
          score += 30
          originDist = 20 // approximate
        }

        // Check destination proximity
        if (listing.destinationLat && listing.destinationLng && c.destinationLat && c.destinationLng) {
          destDist = haversineKm(listing.destinationLat, listing.destinationLng, c.destinationLat, c.destinationLng)
          if (destDist <= radiusKm) score += 50
        } else if (c.destinationPort.toLowerCase().includes(listing.destinationPort.toLowerCase().slice(0, 4))) {
          score += 30
          destDist = 20
        }

        // Date proximity bonus
        const dateDiff = Math.abs(listing.departureDate.getTime() - c.departureDate.getTime()) / (1000 * 60 * 60 * 24)
        if (dateDiff <= 1) score += 20
        else if (dateDiff <= 2) score += 10

        // Will it fit?
        const fits = c.availableKg <= listing.availableKg && c.availableM3 <= listing.availableM3

        return {
          listing: c,
          score,
          originDistKm: Math.round(originDist),
          destDistKm: Math.round(destDist),
          fits,
          dateDiffDays: Math.round(dateDiff),
        }
      })
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return NextResponse.json({
      consolidation: {
        listing: { id: listing.id, originPort: listing.originPort, destinationPort: listing.destinationPort },
        matches,
        count: matches.length,
      },
    })
  } catch (error) {
    console.error('Consolidation error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
