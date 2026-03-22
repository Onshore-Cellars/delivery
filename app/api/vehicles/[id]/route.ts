import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    if (vehicle.ownerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      registrationPlate, registrationCountry, vinNumber,
      make, model, year, vehicleType, colour,
      maxPayloadKg, cargoVolumeM3, cargoLengthCm, cargoWidthCm, cargoHeightCm,
      hasRefrigeration, hasTailLift, hasGPS, hasRacking,
      insuranceProvider, insuranceExpiry, goodsInTransitInsurance, goodsInTransitMax,
      motExpiry, active,
    } = body

    const data: Record<string, unknown> = {}
    if (registrationPlate !== undefined) data.registrationPlate = registrationPlate || null
    if (registrationCountry !== undefined) data.registrationCountry = registrationCountry || null
    if (vinNumber !== undefined) data.vinNumber = vinNumber || null
    if (make !== undefined) data.make = make
    if (model !== undefined) data.model = model
    if (year !== undefined) data.year = year ? parseInt(String(year)) : null
    if (vehicleType !== undefined) data.vehicleType = vehicleType
    if (colour !== undefined) data.colour = colour || null
    if (maxPayloadKg !== undefined) data.maxPayloadKg = maxPayloadKg ? parseFloat(String(maxPayloadKg)) : null
    if (cargoVolumeM3 !== undefined) data.cargoVolumeM3 = cargoVolumeM3 ? parseFloat(String(cargoVolumeM3)) : null
    if (cargoLengthCm !== undefined) data.cargoLengthCm = cargoLengthCm ? parseFloat(String(cargoLengthCm)) : null
    if (cargoWidthCm !== undefined) data.cargoWidthCm = cargoWidthCm ? parseFloat(String(cargoWidthCm)) : null
    if (cargoHeightCm !== undefined) data.cargoHeightCm = cargoHeightCm ? parseFloat(String(cargoHeightCm)) : null
    if (hasRefrigeration !== undefined) data.hasRefrigeration = hasRefrigeration
    if (hasTailLift !== undefined) data.hasTailLift = hasTailLift
    if (hasGPS !== undefined) data.hasGPS = hasGPS
    if (hasRacking !== undefined) data.hasRacking = hasRacking
    if (insuranceProvider !== undefined) data.insuranceProvider = insuranceProvider || null
    if (insuranceExpiry !== undefined) data.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null
    if (goodsInTransitInsurance !== undefined) data.goodsInTransitInsurance = goodsInTransitInsurance
    if (goodsInTransitMax !== undefined) data.goodsInTransitMax = goodsInTransitMax ? parseFloat(String(goodsInTransitMax)) : null
    if (motExpiry !== undefined) data.motExpiry = motExpiry ? new Date(motExpiry) : null
    if (active !== undefined) data.active = active

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.vehicle.update({ where: { id }, data })
    return NextResponse.json({ vehicle: updated })
  } catch (error) {
    console.error('Vehicle update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    if (vehicle.ownerId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check for active listings using this vehicle
    const activeListings = await prisma.listing.count({
      where: {
        vehicleId: id,
        status: { in: ['ACTIVE', 'FULL', 'IN_TRANSIT'] },
      },
    })
    if (activeListings > 0) {
      return NextResponse.json({ error: 'Cannot delete vehicle with active listings' }, { status: 409 })
    }

    await prisma.vehicle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vehicle delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
