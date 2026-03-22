import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { generateListingDescription } from '@/lib/ai'
import { aiLimiter, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = aiLimiter.check(ip)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429 })
    }
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { origin, destination, vehicleType, departureDate, capacityKg, capacityM3, hasRefrigeration, hasTailLift, routeDirection } = body

    if (!origin || !destination || !vehicleType || !departureDate || !capacityKg || !capacityM3 || hasRefrigeration === undefined || hasTailLift === undefined || !routeDirection) {
      return NextResponse.json({ error: 'Missing required listing fields' }, { status: 400 })
    }

    const description = await generateListingDescription({
      origin,
      destination,
      vehicleType,
      vehicleName: body.vehicleName,
      departureDate,
      capacityKg,
      capacityM3,
      hasRefrigeration,
      hasTailLift,
      routeDirection,
      acceptedCargo: body.acceptedCargo,
      returnNotes: body.returnNotes,
    })

    if (!description) {
      return NextResponse.json({ error: 'Description generation failed' }, { status: 500 })
    }

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Listing description error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
