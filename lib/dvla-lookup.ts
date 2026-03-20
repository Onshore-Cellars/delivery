/**
 * Vehicle Registration Lookup — Multi-Country Support
 *
 * UK: DVLA Vehicle Enquiry Service API (Free, UK Government)
 *   Register at: https://developer-portal.driver-vehicle-licensing.api.gov.uk/
 *   Set env var: DVLA_API_KEY
 *
 * France/EU: SIV (Système d'Immatriculation des Véhicules)
 *   Third-party APIs available (e.g. api-plaque-immatriculation.com)
 *   Set env var: EU_VEHICLE_API_KEY
 *
 * Returns: make, colour, fuel type, engine capacity, revenue weight,
 *          tax status, MOT status/expiry, year of manufacture
 */

const DVLA_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'

export interface DVLAVehicleData {
  registrationNumber: string
  make: string
  colour: string
  fuelType: string
  engineCapacity?: number
  revenueWeight?: number   // kg — key indicator for van/truck classification
  yearOfManufacture: number
  monthOfFirstRegistration?: string
  taxStatus: string
  taxDueDate?: string
  motStatus: string
  motExpiryDate?: string
  co2Emissions?: number
  euroStatus?: string
  typeApproval?: string
  wheelplan?: string
  markedForExport: boolean
}

/**
 * Look up a UK vehicle by registration plate
 */
export async function lookupVehicle(registrationNumber: string): Promise<DVLAVehicleData | null> {
  const apiKey = process.env.DVLA_API_KEY
  if (!apiKey) {
    console.warn('DVLA_API_KEY not set — vehicle lookup unavailable')
    return null
  }

  // Clean registration plate
  const cleanReg = registrationNumber.replace(/\s+/g, '').toUpperCase()

  try {
    const res = await fetch(DVLA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ registrationNumber: cleanReg }),
    })

    if (!res.ok) {
      if (res.status === 404) return null // Vehicle not found
      if (res.status === 429) throw new Error('DVLA rate limit exceeded')
      throw new Error(`DVLA API error: ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    console.error('DVLA lookup failed:', err)
    return null
  }
}

/**
 * Estimate vehicle type from DVLA data
 * Uses revenue weight as the primary indicator
 */
export function estimateVehicleType(data: DVLAVehicleData): {
  type: string
  estimatedPayloadKg: number
  estimatedVolumeM3: number
} {
  const weight = data.revenueWeight || 0

  // Revenue weight-based classification (gross vehicle weight)
  if (weight <= 0) {
    return { type: 'Unknown', estimatedPayloadKg: 0, estimatedVolumeM3: 0 }
  }
  if (weight <= 2000) {
    // Car / small car-derived van
    return { type: 'Car / Small Van', estimatedPayloadKg: 400, estimatedVolumeM3: 1.5 }
  }
  if (weight <= 2800) {
    // Small van (e.g. Berlingo, Caddy)
    return { type: 'Small Van', estimatedPayloadKg: 600, estimatedVolumeM3: 3.0 }
  }
  if (weight <= 3200) {
    // Medium van (e.g. Transit Custom, Vivaro)
    return { type: 'Medium Van', estimatedPayloadKg: 1000, estimatedVolumeM3: 6.0 }
  }
  if (weight <= 3500) {
    // Large van (e.g. Transit, Sprinter, Luton)
    return { type: 'Large Van', estimatedPayloadKg: 1300, estimatedVolumeM3: 13.0 }
  }
  if (weight <= 7500) {
    // 7.5t truck
    return { type: 'Truck (7.5t)', estimatedPayloadKg: 3500, estimatedVolumeM3: 30.0 }
  }
  // HGV
  return { type: 'HGV', estimatedPayloadKg: 10000, estimatedVolumeM3: 60.0 }
}

/**
 * Detect country from registration plate format
 */
export function detectPlateCountry(plate: string): 'UK' | 'FR' | 'DE' | 'ES' | 'IT' | 'EU' | 'unknown' {
  const clean = plate.replace(/[\s-]/g, '').toUpperCase()

  // UK: AB12 CDE or AB12CDE (2 letters, 2 digits, 3 letters)
  if (/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(clean)) return 'UK'

  // France: AA-123-AA (SIV format since 2009)
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) return 'FR'

  // Germany: XXX-XX-1234 pattern
  if (/^[A-Z]{1,3}[A-Z]{1,2}\d{1,4}$/.test(clean)) return 'DE'

  // Spain: 1234 BCD
  if (/^\d{4}[A-Z]{3}$/.test(clean)) return 'ES'

  // Italy: AA 123 AA
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean)) return 'IT'

  return 'unknown'
}

/**
 * Look up a vehicle by plate number — auto-detects country
 */
export async function lookupVehicleByPlate(plate: string): Promise<DVLAVehicleData | null> {
  const country = detectPlateCountry(plate)

  switch (country) {
    case 'UK':
      return lookupVehicle(plate)

    case 'FR':
    case 'DE':
    case 'ES':
    case 'IT':
    case 'EU': {
      // EU vehicle lookup via third-party API
      const apiKey = process.env.EU_VEHICLE_API_KEY
      if (!apiKey) {
        console.warn('EU_VEHICLE_API_KEY not set — EU vehicle lookup unavailable')
        return null
      }
      // Placeholder: implement with preferred EU vehicle API provider
      // e.g. api-plaque-immatriculation.com, checkcardetails.co.uk, etc.
      console.log(`EU vehicle lookup for ${country} plate: ${plate} (API integration pending)`)
      return null
    }

    default:
      return null
  }
}
