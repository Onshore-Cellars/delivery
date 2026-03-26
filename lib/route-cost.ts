// Route cost estimation for European delivery routes
// Provides rough estimates based on distance and vehicle type

interface CostEstimate {
  distanceKm: number
  fuelCost: number
  tollEstimate: number
  ferryWarning?: string
  totalEstimate: number
  currency: string
  breakdown: { label: string; amount: number }[]
}

interface CostParams {
  originCountry: string
  destinationCountry: string
  distanceKm: number
  vehicleType: string
  fuelType?: string          // 'Diesel' | 'Electric' | 'Petrol'
  fuelPricePerLitre?: number // default EUR rates
}

// Average fuel consumption by vehicle type (litres per 100km)
// Matches vehicle types from lib/vehicles.ts
const FUEL_CONSUMPTION: Record<string, number> = {
  // Vans
  'Small Van': 7.5,
  'Medium Van': 9.5,
  'Large Van': 11,
  'Luton Van': 13,
  'Sprinter': 11,
  'Tail Lift Van': 12,
  'Chassis Cab': 11,
  // Refrigerated
  'Refrigerated Van': 13,
  'Refrigerated Truck': 30,
  'Temperature Controlled': 14,
  // Trucks
  'Box Truck': 22,
  'Flatbed': 25,
  'Curtain-side': 25,
  'Tipper Truck': 28,
  'Low Loader': 35,
  'Crane Truck (HIAB)': 32,
  'Hazmat Vehicle': 28,
  'Tanker': 30,
  'Car Transporter': 32,
  // Cars / small
  'Estate Car': 7,
  'SUV': 9,
  'Car with Trailer': 10,
  'Pickup Truck': 12,
  'Motorcycle Courier': 4,
  'Cargo Bike': 0,
  'Minibus (Cargo)': 12,
  'Boat Trailer': 12,
  // Electric — use kWh/100km converted to equivalent diesel cost
  // These are handled separately: ~20kWh/100km at ~€0.30/kWh ≈ €6/100km
  'Other': 10,
}

// Electric vehicles: kWh per 100km (used when fuelType is 'Electric')
const ELECTRIC_CONSUMPTION: Record<string, number> = {
  'Small Van': 20,
  'Medium Van': 25,
  'Large Van': 30,
  'default': 25,
}

const ELECTRICITY_PRICE_PER_KWH = 0.30 // EUR average

// Average fuel prices in EUR per litre by country (approximate)
const FUEL_PRICES: Record<string, number> = {
  'France': 1.85,
  'Spain': 1.65,
  'Italy': 1.80,
  'Germany': 1.75,
  'UK': 1.70,
  'Portugal': 1.75,
  'Netherlands': 2.00,
  'Belgium': 1.80,
  'Greece': 1.85,
  'Croatia': 1.60,
  'Monaco': 1.90,
  'Montenegro': 1.45,
  'Turkey': 1.30,
  'default': 1.75,
}

// Toll rate estimates per km by country (EUR, for heavy vehicles)
const TOLL_RATES: Record<string, number> = {
  'France': 0.15,
  'Spain': 0.10,
  'Italy': 0.12,
  'Germany': 0.07, // Maut
  'Portugal': 0.08,
  'Netherlands': 0.0,
  'Belgium': 0.0,
  'Greece': 0.06,
  'Croatia': 0.08,
  'UK': 0.0, // No motorway tolls (except specific crossings)
  'default': 0.05,
}

// Countries/regions requiring ferry crossings
const FERRY_ROUTES: { from: string[]; to: string[]; note: string }[] = [
  { from: ['UK', 'Ireland'], to: ['France', 'Spain', 'Belgium', 'Netherlands', 'Germany', 'Italy', 'Portugal', 'Greece', 'Croatia', 'Montenegro', 'Turkey', 'Monaco'], note: 'Channel crossing required (Dover-Calais ~\u20AC150-400 for van, \u20AC300-800 for truck)' },
  { from: ['Italy'], to: ['Greece', 'Croatia'], note: 'Adriatic ferry may be needed (~\u20AC100-300 per crossing + vehicle)' },
  { from: ['Spain'], to: ['Morocco'], note: 'Gibraltar strait ferry required (~\u20AC80-200 per crossing + vehicle)' },
  { from: ['Greece'], to: ['Turkey'], note: 'Ferry or land border crossing available' },
]

export function estimateRouteCost(params: CostParams): CostEstimate {
  const { originCountry, destinationCountry, distanceKm, vehicleType, fuelType, fuelPricePerLitre } = params

  const isElectric = fuelType === 'Electric'

  let fuelCost: number
  let fuelLabel: string

  if (isElectric) {
    const kwh = ELECTRIC_CONSUMPTION[vehicleType] || ELECTRIC_CONSUMPTION['default']
    fuelCost = (distanceKm / 100) * kwh * ELECTRICITY_PRICE_PER_KWH
    fuelLabel = `Electricity (${kwh}kWh/100km × ${distanceKm}km)`
  } else {
    const consumption = FUEL_CONSUMPTION[vehicleType] || FUEL_CONSUMPTION['Other']
    const fuelPrice = fuelPricePerLitre || FUEL_PRICES[originCountry] || FUEL_PRICES['default']
    fuelCost = (distanceKm / 100) * consumption * fuelPrice
    fuelLabel = `Fuel (${consumption}L/100km × ${distanceKm}km)`
  }

  // Toll estimate (use average of origin and destination country rates)
  const originToll = TOLL_RATES[originCountry] || TOLL_RATES['default']
  const destToll = TOLL_RATES[destinationCountry] || TOLL_RATES['default']
  const avgTollRate = (originToll + destToll) / 2
  // Assume ~60% of route is on toll roads
  const tollEstimate = distanceKm * avgTollRate * 0.6

  // Ferry warning
  let ferryWarning: string | undefined
  for (const route of FERRY_ROUTES) {
    if (
      (route.from.includes(originCountry) && route.to.includes(destinationCountry)) ||
      (route.from.includes(destinationCountry) && route.to.includes(originCountry))
    ) {
      ferryWarning = route.note
      break
    }
  }

  const breakdown: { label: string; amount: number }[] = [
    { label: fuelLabel, amount: Math.round(fuelCost * 100) / 100 },
    { label: `Tolls (est. 60% toll roads)`, amount: Math.round(tollEstimate * 100) / 100 },
  ]

  const totalEstimate = fuelCost + tollEstimate

  return {
    distanceKm,
    fuelCost: Math.round(fuelCost * 100) / 100,
    tollEstimate: Math.round(tollEstimate * 100) / 100,
    ferryWarning,
    totalEstimate: Math.round(totalEstimate * 100) / 100,
    currency: 'EUR',
    breakdown,
  }
}
