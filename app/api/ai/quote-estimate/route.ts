import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateQuoteEstimate } from '@/lib/ai'
import { aiLimiter, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = await aiLimiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429 })
    }
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { origin, destination, distanceKm, weightKg, volumeM3, cargoType, vehicleType } = body

    if (!origin || !destination || !distanceKm || !weightKg || !volumeM3 || !cargoType || !vehicleType) {
      return NextResponse.json({ error: 'Missing required fields: origin, destination, distanceKm, weightKg, volumeM3, cargoType, vehicleType' }, { status: 400 })
    }

    const estimate = await generateQuoteEstimate({
      origin,
      destination,
      distanceKm,
      weightKg,
      volumeM3,
      cargoType,
      vehicleType,
      historicalAvgPerKg: body.historicalAvgPerKg,
      historicalAvgPerM3: body.historicalAvgPerM3,
      fuelCostEstimate: body.fuelCostEstimate,
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Quote estimation failed' }, { status: 500 })
    }

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Quote estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
