import { NextRequest, NextResponse } from 'next/server'
import { vehicleSpecs, vehicleTypes, getVehicleMakes, getModelsForMake, getVehiclesByType } from '@/lib/vehicles'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const make = searchParams.get('make')
  const type = searchParams.get('type')

  if (make) {
    return NextResponse.json({ vehicles: getModelsForMake(make) })
  }

  if (type) {
    return NextResponse.json({ vehicles: getVehiclesByType(type) })
  }

  return NextResponse.json({
    makes: getVehicleMakes(),
    types: vehicleTypes,
    total: vehicleSpecs.length,
  })
}
