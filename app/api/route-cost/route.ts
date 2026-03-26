import { NextRequest, NextResponse } from 'next/server'
import { estimateRouteCost } from '@/lib/route-cost'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originCountry, destinationCountry, distanceKm, vehicleType, fuelType } = body

    if (!originCountry || !destinationCountry || !distanceKm || !vehicleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const estimate = estimateRouteCost({
      originCountry,
      destinationCountry,
      distanceKm: Number(distanceKm),
      vehicleType,
      fuelType,
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Route cost error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
