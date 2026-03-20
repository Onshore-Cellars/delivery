import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: decoded.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Vehicles fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      registrationPlate,
      registrationCountry,
      vinNumber,
      make,
      model,
      year,
      vehicleType,
      colour,
      maxPayloadKg,
      cargoVolumeM3,
      cargoLengthCm,
      cargoWidthCm,
      cargoHeightCm,
      hasRefrigeration,
      hasTailLift,
      hasGPS,
      hasRacking,
      insuranceProvider,
      insuranceExpiry,
      goodsInTransitInsurance,
      goodsInTransitMax,
      motExpiry,
    } = body

    if (!make || !model || !vehicleType) {
      return NextResponse.json(
        { error: 'Missing required fields: make, model, and vehicleType are required' },
        { status: 400 }
      )
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: decoded.userId,
        registrationPlate: registrationPlate || null,
        registrationCountry: registrationCountry || null,
        vinNumber: vinNumber || null,
        make,
        model,
        year: year ? parseInt(String(year)) : null,
        vehicleType,
        colour: colour || null,
        maxPayloadKg: maxPayloadKg ? parseFloat(String(maxPayloadKg)) : null,
        cargoVolumeM3: cargoVolumeM3 ? parseFloat(String(cargoVolumeM3)) : null,
        cargoLengthCm: cargoLengthCm ? parseFloat(String(cargoLengthCm)) : null,
        cargoWidthCm: cargoWidthCm ? parseFloat(String(cargoWidthCm)) : null,
        cargoHeightCm: cargoHeightCm ? parseFloat(String(cargoHeightCm)) : null,
        hasRefrigeration: hasRefrigeration || false,
        hasTailLift: hasTailLift || false,
        hasGPS: hasGPS !== false,
        hasRacking: hasRacking || false,
        insuranceProvider: insuranceProvider || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        goodsInTransitInsurance: goodsInTransitInsurance || false,
        goodsInTransitMax: goodsInTransitMax ? parseFloat(String(goodsInTransitMax)) : null,
        motExpiry: motExpiry ? new Date(motExpiry) : null,
      },
    })

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error) {
    console.error('Vehicle creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
