import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ports } from '@/lib/ports'
import { estimateRouteCost } from '@/lib/route-cost'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function findCoords(name: string): { lat: number; lng: number; country: string } | null {
  const q = name.trim().toLowerCase()
  const p = ports.find(p => p.name.toLowerCase() === q)
    || ports.find(p => p.city?.toLowerCase() === q)
    || ports.find(p => p.name.toLowerCase().includes(q) || (p.city?.toLowerCase().includes(q) ?? false))
  return p && p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng, country: p.country } : null
}

// GET — estimated fuel + toll cost for a listing's route (guide for carriers pricing a run / bidders).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { originPort: true, destinationPort: true, originCountry: true, destinationCountry: true, vehicleType: true },
    })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const o = findCoords(listing.originPort)
    const d = findCoords(listing.destinationPort)
    if (!o || !d) return NextResponse.json({ estimate: null })

    // Straight-line × a road-winding factor for a rough driving distance.
    const distanceKm = Math.round(haversineKm(o.lat, o.lng, d.lat, d.lng) * 1.3)

    const estimate = estimateRouteCost({
      originCountry: listing.originCountry || o.country,
      destinationCountry: listing.destinationCountry || d.country,
      distanceKm,
      vehicleType: listing.vehicleType,
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Listing route-cost error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
