// Van makes, models with real-world capacity data
// Used in listing creation to auto-populate capacity fields

export interface VehicleSpec {
  make: string
  model: string
  type: string
  maxPayloadKg: number
  cargoVolumeM3: number
  cargoLengthCm: number
  cargoWidthCm: number
  cargoHeightCm: number
  fuelType: string
}

export const vehicleTypes = [
  'Small Van',
  'Medium Van',
  'Large Van',
  'Luton Van',
  'Refrigerated Van',
  'Pickup Truck',
  'Box Truck',
  'Flatbed',
  'Sprinter',
  'Other',
] as const

export const vehicleSpecs: VehicleSpec[] = [
  // ─── SMALL VANS ────────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Connect L1', type: 'Small Van', maxPayloadKg: 625, cargoVolumeM3: 2.9, cargoLengthCm: 180, cargoWidthCm: 155, cargoHeightCm: 120, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Connect L2', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.6, cargoLengthCm: 213, cargoWidthCm: 155, cargoHeightCm: 120, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Caddy', type: 'Small Van', maxPayloadKg: 700, cargoVolumeM3: 3.2, cargoLengthCm: 187, cargoWidthCm: 155, cargoHeightCm: 113, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Caddy Maxi', type: 'Small Van', maxPayloadKg: 700, cargoVolumeM3: 4.2, cargoLengthCm: 218, cargoWidthCm: 155, cargoHeightCm: 113, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Kangoo', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Partner', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Berlingo', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Doblo', type: 'Small Van', maxPayloadKg: 750, cargoVolumeM3: 3.4, cargoLengthCm: 183, cargoWidthCm: 152, cargoHeightCm: 120, fuelType: 'Diesel' },

  // ─── MEDIUM VANS ───────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Custom L1H1', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Custom L2H1', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.8, cargoLengthCm: 290, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Custom L1H2', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 6.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 160, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Transporter T6.1 SWB', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.8, cargoLengthCm: 270, cargoWidthCm: 170, cargoHeightCm: 138, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Transporter T6.1 LWB', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.7, cargoLengthCm: 292, cargoWidthCm: 170, cargoHeightCm: 138, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Vito L1', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 5.5, cargoLengthCm: 241, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Vito L2', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 6.6, cargoLengthCm: 282, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Trafic SL30', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.2, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Trafic LL30', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.0, cargoLengthCm: 280, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Vivaro L1', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace L1', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },

  // ─── LARGE VANS ────────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit L3H2', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 11.5, cargoLengthCm: 347, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L4H3', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 15.1, cargoLengthCm: 402, cargoWidthCm: 178, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L2H2', type: 'Large Van', maxPayloadKg: 1500, cargoVolumeM3: 9.5, cargoLengthCm: 299, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 311 L2H2', type: 'Sprinter', maxPayloadKg: 1350, cargoVolumeM3: 10.5, cargoLengthCm: 343, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 314 L3H2', type: 'Sprinter', maxPayloadKg: 1300, cargoVolumeM3: 14.0, cargoLengthCm: 432, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 316 L4H3', type: 'Sprinter', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 479, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter L3H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 11.3, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter L4H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.5, cargoLengthCm: 440, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.8, cargoLengthCm: 312, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L2H2', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 35S L3H2', type: 'Large Van', maxPayloadKg: 1700, cargoVolumeM3: 12.0, cargoLengthCm: 357, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 35S L4H3', type: 'Large Van', maxPayloadKg: 1500, cargoVolumeM3: 18.0, cargoLengthCm: 450, cargoWidthCm: 180, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGE L3H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 11.3, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },

  // ─── LUTON VANS ────────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Luton', type: 'Luton Van', maxPayloadKg: 1500, cargoVolumeM3: 18.0, cargoLengthCm: 400, cargoWidthCm: 200, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Luton', type: 'Luton Van', maxPayloadKg: 1400, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Luton', type: 'Luton Van', maxPayloadKg: 1350, cargoVolumeM3: 19.5, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },

  // ─── REFRIGERATED VANS ─────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Custom Fridge', type: 'Refrigerated Van', maxPayloadKg: 800, cargoVolumeM3: 5.0, cargoLengthCm: 250, cargoWidthCm: 165, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.5, cargoLengthCm: 340, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.0, cargoLengthCm: 310, cargoWidthCm: 170, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter Fridge L3H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 9.0, cargoLengthCm: 340, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1050, cargoVolumeM3: 8.0, cargoLengthCm: 305, cargoWidthCm: 175, cargoHeightCm: 170, fuelType: 'Diesel' },

  // ─── PICKUP TRUCKS ─────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Ranger', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.5, cargoLengthCm: 156, cargoWidthCm: 154, cargoHeightCm: 51, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Hilux', type: 'Pickup Truck', maxPayloadKg: 1065, cargoVolumeM3: 1.5, cargoLengthCm: 152, cargoWidthCm: 151, cargoHeightCm: 48, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Amarok', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.6, cargoLengthCm: 160, cargoWidthCm: 156, cargoHeightCm: 50, fuelType: 'Diesel' },
  { make: 'Mitsubishi', model: 'L200', type: 'Pickup Truck', maxPayloadKg: 1050, cargoVolumeM3: 1.4, cargoLengthCm: 147, cargoWidthCm: 147, cargoHeightCm: 47, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Navara', type: 'Pickup Truck', maxPayloadKg: 1050, cargoVolumeM3: 1.5, cargoLengthCm: 151, cargoWidthCm: 153, cargoHeightCm: 47, fuelType: 'Diesel' },
  { make: 'Isuzu', model: 'D-Max', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.5, cargoLengthCm: 152, cargoWidthCm: 154, cargoHeightCm: 48, fuelType: 'Diesel' },

  // ─── BOX TRUCKS ────────────────────────────────────────────────────────────
  { make: 'Iveco', model: 'Daily Box 7.2t', type: 'Box Truck', maxPayloadKg: 3500, cargoVolumeM3: 25.0, cargoLengthCm: 470, cargoWidthCm: 220, cargoHeightCm: 230, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego 7.5t Box', type: 'Box Truck', maxPayloadKg: 3800, cargoVolumeM3: 30.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGL 7.5t Box', type: 'Box Truck', maxPayloadKg: 3700, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'DAF', model: 'LF 7.5t Box', type: 'Box Truck', maxPayloadKg: 3600, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
]

// Helper: Get unique makes
export function getVehicleMakes(): string[] {
  return [...new Set(vehicleSpecs.map(v => v.make))].sort()
}

// Helper: Get models for a make
export function getModelsForMake(make: string): VehicleSpec[] {
  return vehicleSpecs.filter(v => v.make === make).sort((a, b) => a.model.localeCompare(b.model))
}

// Helper: Get all vehicles by type
export function getVehiclesByType(type: string): VehicleSpec[] {
  return vehicleSpecs.filter(v => v.type === type).sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`))
}

// Helper: Search vehicles
export function searchVehicles(query: string): VehicleSpec[] {
  const q = query.toLowerCase()
  return vehicleSpecs.filter(v =>
    v.make.toLowerCase().includes(q) ||
    v.model.toLowerCase().includes(q) ||
    v.type.toLowerCase().includes(q)
  )
}
