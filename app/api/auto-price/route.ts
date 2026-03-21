import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/auto-price — Get pricing suggestions based on route history
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { originPort, destinationPort, distanceKm, weightKg, volumeM3, vehicleType } = body

    if (!originPort && !destinationPort && !distanceKm) {
      return NextResponse.json({ error: 'Origin, destination, or distance required' }, { status: 400 })
    }

    // Find similar completed listings for pricing benchmarks
    const similarListings = await prisma.listing.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED', 'IN_TRANSIT'] },
        ...(originPort ? {
          OR: [
            { originPort: { contains: originPort, mode: 'insensitive' } },
            { originRegion: { contains: originPort, mode: 'insensitive' } },
          ],
        } : {}),
        ...(destinationPort ? {
          AND: [{
            OR: [
              { destinationPort: { contains: destinationPort, mode: 'insensitive' } },
              { destinationRegion: { contains: destinationPort, mode: 'insensitive' } },
            ],
          }],
        } : {}),
        ...(vehicleType ? { vehicleType } : {}),
      },
      select: {
        pricePerKg: true,
        pricePerM3: true,
        flatRate: true,
        totalCapacityKg: true,
        estimatedDistance: true,
        currency: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Calculate averages
    const withPricePerKg = similarListings.filter(l => l.pricePerKg && l.pricePerKg > 0)
    const withPricePerM3 = similarListings.filter(l => l.pricePerM3 && l.pricePerM3 > 0)
    const withFlatRate = similarListings.filter(l => l.flatRate && l.flatRate > 0)

    const avgPricePerKg = withPricePerKg.length > 0
      ? withPricePerKg.reduce((s, l) => s + (l.pricePerKg || 0), 0) / withPricePerKg.length
      : null
    const avgPricePerM3 = withPricePerM3.length > 0
      ? withPricePerM3.reduce((s, l) => s + (l.pricePerM3 || 0), 0) / withPricePerM3.length
      : null
    const avgFlatRate = withFlatRate.length > 0
      ? withFlatRate.reduce((s, l) => s + (l.flatRate || 0), 0) / withFlatRate.length
      : null

    // Distance-based fallback pricing
    const dist = distanceKm || (similarListings[0]?.estimatedDistance) || 200
    const baseFuelCostPerKm = vehicleType?.includes('Truck') ? 1.10 : 0.65
    const estimatedCost = dist * baseFuelCostPerKm
    const suggestedFlatRate = Math.round(estimatedCost * 1.8) // ~80% margin
    const suggestedPerKg = parseFloat((suggestedFlatRate / (weightKg || 500)).toFixed(2))
    const suggestedPerM3 = parseFloat((suggestedFlatRate / (volumeM3 || 5)).toFixed(2))

    return NextResponse.json({
      suggestion: {
        pricePerKg: avgPricePerKg ? parseFloat(avgPricePerKg.toFixed(2)) : suggestedPerKg,
        pricePerM3: avgPricePerM3 ? parseFloat(avgPricePerM3.toFixed(2)) : suggestedPerM3,
        flatRate: avgFlatRate ? Math.round(avgFlatRate) : suggestedFlatRate,
        currency: 'EUR',
        confidence: similarListings.length >= 5 ? 'high' : similarListings.length >= 2 ? 'medium' : 'low',
        basedOn: similarListings.length,
        estimatedDistance: dist,
      },
      range: {
        pricePerKg: {
          low: withPricePerKg.length ? parseFloat(Math.min(...withPricePerKg.map(l => l.pricePerKg!)).toFixed(2)) : suggestedPerKg * 0.7,
          high: withPricePerKg.length ? parseFloat(Math.max(...withPricePerKg.map(l => l.pricePerKg!)).toFixed(2)) : suggestedPerKg * 1.5,
        },
        flatRate: {
          low: withFlatRate.length ? Math.round(Math.min(...withFlatRate.map(l => l.flatRate!))) : Math.round(suggestedFlatRate * 0.7),
          high: withFlatRate.length ? Math.round(Math.max(...withFlatRate.map(l => l.flatRate!))) : Math.round(suggestedFlatRate * 1.5),
        },
      },
    })
  } catch (error) {
    console.error('Auto-price error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
