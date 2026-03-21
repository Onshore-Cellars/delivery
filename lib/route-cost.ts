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
  fuelPricePerLitre?: number // default EUR rates
}

// Average fuel consumption by vehicle type (litres per 100km)
const FUEL_CONSUMPTION: Record<string, number> = {
  'Car': 8,
  'Van': 10,
  'Truck': 25,
  'Refrigerated Van': 13,
  'Refrigerated Truck': 30,
  'Flatbed': 28,
  'Container': 32,
  'Cargo Ship': 0, // N/A for ships
}

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
  const { originCountry, destinationCountry, distanceKm, vehicleType, fuelPricePerLitre } = params

  const consumption = FUEL_CONSUMPTION[vehicleType] || FUEL_CONSUMPTION['Van']
  const fuelPrice = fuelPricePerLitre || FUEL_PRICES[originCountry] || FUEL_PRICES['default']

  // Fuel cost
  const fuelCost = (distanceKm / 100) * consumption * fuelPrice

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
    { label: `Fuel (${consumption}L/100km \u00D7 ${distanceKm}km)`, amount: Math.round(fuelCost * 100) / 100 },
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
