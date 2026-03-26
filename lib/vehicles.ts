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
  'Refrigerated Truck',
  'Pickup Truck',
  'Box Truck',
  'Flatbed',
  'Curtain-side',
  'Tail Lift Van',
  'Chassis Cab',
  'Sprinter',
  // Expanded vehicle types for scale
  'Car with Trailer',
  'Estate Car',
  'SUV',
  'Motorcycle Courier',
  'Cargo Bike',
  'Minibus (Cargo)',
  'Tipper Truck',
  'Low Loader',
  'Crane Truck (HIAB)',
  'Temperature Controlled',
  'Hazmat Vehicle',
  'Tanker',
  'Car Transporter',
  'Boat Trailer',
  'Other',
] as const

// ─── CARGO PACKAGING TYPES ──────────────────────────────────────────────────

export interface PackagingType {
  id: string
  label: string
  description: string
  defaultWeightKg?: number
  defaultVolumeM3?: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

export const packagingTypes: PackagingType[] = [
  // Boxes
  { id: 'box_small', label: 'Small Box', description: 'Up to 30x30x30 cm', defaultWeightKg: 5, defaultVolumeM3: 0.027, lengthCm: 30, widthCm: 30, heightCm: 30 },
  { id: 'box_medium', label: 'Medium Box', description: 'Up to 50x40x40 cm', defaultWeightKg: 15, defaultVolumeM3: 0.08, lengthCm: 50, widthCm: 40, heightCm: 40 },
  { id: 'box_large', label: 'Large Box', description: 'Up to 60x50x50 cm', defaultWeightKg: 25, defaultVolumeM3: 0.15, lengthCm: 60, widthCm: 50, heightCm: 50 },
  { id: 'box_custom', label: 'Custom Box', description: 'Specify dimensions', defaultWeightKg: 10, defaultVolumeM3: 0.1 },
  // Pallets — Euro standard
  { id: 'pallet_quarter', label: 'Quarter Pallet', description: '60 x 40 cm — fits in a van', defaultWeightKg: 150, defaultVolumeM3: 0.36, lengthCm: 60, widthCm: 40, heightCm: 150 },
  { id: 'pallet_half', label: 'Half Euro Pallet', description: '80 x 60 cm', defaultWeightKg: 300, defaultVolumeM3: 0.72, lengthCm: 80, widthCm: 60, heightCm: 150 },
  { id: 'pallet_euro', label: 'Euro Pallet', description: '120 x 80 cm (EUR 1) — standard', defaultWeightKg: 500, defaultVolumeM3: 1.44, lengthCm: 120, widthCm: 80, heightCm: 150 },
  { id: 'pallet_full', label: 'Full Pallet (UK)', description: '120 x 100 cm — UK standard', defaultWeightKg: 600, defaultVolumeM3: 1.8, lengthCm: 120, widthCm: 100, heightCm: 150 },
  { id: 'pallet_industrial', label: 'Industrial Pallet', description: '120 x 120 cm (EUR 6)', defaultWeightKg: 800, defaultVolumeM3: 2.16, lengthCm: 120, widthCm: 120, heightCm: 150 },
  // Multi-package
  { id: 'multi_boxes', label: 'Multiple Boxes', description: 'Several boxes, specify quantity', defaultWeightKg: 50, defaultVolumeM3: 0.5 },
  { id: 'multi_pallets', label: 'Multiple Pallets', description: 'Several pallets, specify quantity', defaultWeightKg: 1000, defaultVolumeM3: 3.0 },
  // Other
  { id: 'crate', label: 'Crate / Case', description: 'Wooden crate or shipping case', defaultWeightKg: 50, defaultVolumeM3: 0.3, lengthCm: 100, widthCm: 60, heightCm: 60 },
  { id: 'drum', label: 'Drum / Barrel', description: 'Barrel, drum, or keg', defaultWeightKg: 100, defaultVolumeM3: 0.2, lengthCm: 60, widthCm: 60, heightCm: 90 },
  { id: 'envelope', label: 'Envelope / Document', description: 'Letter, document, or flat parcel', defaultWeightKg: 1, defaultVolumeM3: 0.002, lengthCm: 35, widthCm: 25, heightCm: 3 },
  { id: 'tube', label: 'Tube / Roll', description: 'Poster tube, rolled carpet, pipe', defaultWeightKg: 10, defaultVolumeM3: 0.02, lengthCm: 120, widthCm: 15, heightCm: 15 },
  { id: 'bag', label: 'Bag / Sack', description: 'Sack, duffle bag, or soft package', defaultWeightKg: 20, defaultVolumeM3: 0.1, lengthCm: 60, widthCm: 40, heightCm: 40 },
  { id: 'ibc', label: 'IBC Container', description: 'Intermediate bulk container (1000L)', defaultWeightKg: 1000, defaultVolumeM3: 1.0, lengthCm: 120, widthCm: 100, heightCm: 115 },
  { id: 'loose', label: 'Loose / Unpackaged', description: 'Furniture, equipment, oversized items', defaultWeightKg: 30, defaultVolumeM3: 0.5 },
  { id: 'custom', label: 'Custom', description: 'Specify your own dimensions and weight', defaultWeightKg: 0, defaultVolumeM3: 0 },
]

export function getPackagingById(id: string): PackagingType | undefined {
  return packagingTypes.find(p => p.id === id)
}

// ─── PACKAGE DEFS (for quote/booking forms) ─────────────────────────────────
// Single source of truth for package type defaults used across pages

export interface PackageDef {
  value: string
  label: string
  defaultL: number
  defaultW: number
  defaultH: number
  defaultKg: number
  isPallet: boolean
}

export const PACKAGE_DEFS: PackageDef[] = [
  { value: 'pallet',         label: 'Full Pallet (UK)',     defaultL: 120, defaultW: 100, defaultH: 150, defaultKg: 600, isPallet: true },
  { value: 'half-pallet',    label: 'Half Euro Pallet',     defaultL: 80,  defaultW: 60,  defaultH: 150, defaultKg: 300, isPallet: true },
  { value: 'quarter-pallet', label: 'Quarter Pallet',       defaultL: 60,  defaultW: 40,  defaultH: 150, defaultKg: 150, isPallet: true },
  { value: 'euro-pallet',    label: 'Euro Pallet (EUR 1)',  defaultL: 120, defaultW: 80,  defaultH: 150, defaultKg: 500, isPallet: true },
  { value: 'industrial-pallet', label: 'Industrial Pallet', defaultL: 120, defaultW: 120, defaultH: 150, defaultKg: 800, isPallet: true },
  { value: 'box',            label: 'Box / Carton',         defaultL: 60,  defaultW: 40,  defaultH: 40,  defaultKg: 25,  isPallet: false },
  { value: 'box-small',      label: 'Small Box',            defaultL: 30,  defaultW: 30,  defaultH: 30,  defaultKg: 5,   isPallet: false },
  { value: 'box-medium',     label: 'Medium Box',           defaultL: 50,  defaultW: 40,  defaultH: 40,  defaultKg: 15,  isPallet: false },
  { value: 'crate',          label: 'Crate',                defaultL: 100, defaultW: 60,  defaultH: 60,  defaultKg: 80,  isPallet: false },
  { value: 'drum',           label: 'Barrel / Drum',        defaultL: 60,  defaultW: 60,  defaultH: 90,  defaultKg: 200, isPallet: false },
  { value: 'envelope',       label: 'Envelope / Document',  defaultL: 35,  defaultW: 25,  defaultH: 3,   defaultKg: 1,   isPallet: false },
  { value: 'tube',           label: 'Tube / Roll',          defaultL: 120, defaultW: 15,  defaultH: 15,  defaultKg: 10,  isPallet: false },
  { value: 'bag',            label: 'Bag / Sack',           defaultL: 60,  defaultW: 40,  defaultH: 40,  defaultKg: 20,  isPallet: false },
  { value: 'ibc',            label: 'IBC Container',        defaultL: 120, defaultW: 100, defaultH: 115, defaultKg: 1000,isPallet: false },
  { value: 'loose',          label: 'Loose Item',           defaultL: 0,   defaultW: 0,   defaultH: 0,   defaultKg: 0,   isPallet: false },
  { value: 'custom',         label: 'Custom Dimensions',    defaultL: 0,   defaultW: 0,   defaultH: 0,   defaultKg: 0,   isPallet: false },
]

export function calcCubicMetres(l: number, w: number, h: number): number {
  if (!l || !w || !h) return 0
  return Math.round(((l / 100) * (w / 100) * (h / 100)) * 10000) / 10000
}

export const vehicleSpecs: VehicleSpec[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SMALL VANS / CAR-DERIVED VANS (under 2.0t GVW typically)
  // ═══════════════════════════════════════════════════════════════════════════

  // Ford
  { make: 'Ford', model: 'Transit Courier', type: 'Small Van', maxPayloadKg: 560, cargoVolumeM3: 2.3, cargoLengthCm: 160, cargoWidthCm: 148, cargoHeightCm: 112, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Courier EV', type: 'Small Van', maxPayloadKg: 490, cargoVolumeM3: 2.3, cargoLengthCm: 160, cargoWidthCm: 148, cargoHeightCm: 112, fuelType: 'Electric' },
  { make: 'Ford', model: 'Transit Connect L1', type: 'Small Van', maxPayloadKg: 625, cargoVolumeM3: 2.9, cargoLengthCm: 180, cargoWidthCm: 155, cargoHeightCm: 120, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Connect L2', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.6, cargoLengthCm: 213, cargoWidthCm: 155, cargoHeightCm: 120, fuelType: 'Diesel' },

  // Volkswagen
  { make: 'Volkswagen', model: 'Caddy Cargo', type: 'Small Van', maxPayloadKg: 720, cargoVolumeM3: 3.3, cargoLengthCm: 190, cargoWidthCm: 155, cargoHeightCm: 113, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Caddy Cargo Maxi', type: 'Small Van', maxPayloadKg: 700, cargoVolumeM3: 4.2, cargoLengthCm: 218, cargoWidthCm: 155, cargoHeightCm: 113, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Kangoo', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Kangoo E-Tech Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Electric' },
  { make: 'Peugeot', model: 'Partner', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Partner Long', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'e-Partner Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },
  { make: 'Citroen', model: 'Berlingo', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Berlingo XL', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'e-Berlingo Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },
  { make: 'Fiat', model: 'Doblo', type: 'Small Van', maxPayloadKg: 750, cargoVolumeM3: 3.4, cargoLengthCm: 183, cargoWidthCm: 152, cargoHeightCm: 120, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Fiorino', type: 'Small Van', maxPayloadKg: 520, cargoVolumeM3: 2.5, cargoLengthCm: 163, cargoWidthCm: 145, cargoHeightCm: 110, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Townstar', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Townstar EV', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Electric' },
  { make: 'Toyota', model: 'Proace City L1', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace City L2', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Combo L1', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Combo-e Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },
  { make: 'MAXUS', model: 'eDeliver 3 SWB', type: 'Small Van', maxPayloadKg: 865, cargoVolumeM3: 4.8, cargoLengthCm: 207, cargoWidthCm: 160, cargoHeightCm: 140, fuelType: 'Electric' },
  { make: 'MAXUS', model: 'eDeliver 3 LWB', type: 'Small Van', maxPayloadKg: 830, cargoVolumeM3: 6.3, cargoLengthCm: 250, cargoWidthCm: 160, cargoHeightCm: 140, fuelType: 'Electric' },

  // ─── MEDIUM VANS ───────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Custom L1H1', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Custom L2H1', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.8, cargoLengthCm: 290, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Custom L1H2', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 6.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 160, fuelType: 'Diesel' },
  { make: 'Ford', model: 'E-Transit Custom Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Electric' },
  { make: 'Volkswagen', model: 'Transporter T6.1 SWB', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.8, cargoLengthCm: 270, cargoWidthCm: 170, cargoHeightCm: 138, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Transporter T6.1 LWB', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.7, cargoLengthCm: 292, cargoWidthCm: 170, cargoHeightCm: 138, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'ID. Buzz Cargo', type: 'Medium Van', maxPayloadKg: 600, cargoVolumeM3: 3.9, cargoLengthCm: 214, cargoWidthCm: 152, cargoHeightCm: 124, fuelType: 'Electric' },
  { make: 'Mercedes-Benz', model: 'Vito L1', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 5.5, cargoLengthCm: 241, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Vito L2', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 6.6, cargoLengthCm: 282, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Vito L3', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.6, cargoLengthCm: 322, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'eVito Electric', type: 'Medium Van', maxPayloadKg: 900, cargoVolumeM3: 6.6, cargoLengthCm: 282, cargoWidthCm: 168, cargoHeightCm: 134, fuelType: 'Electric' },
  { make: 'Renault', model: 'Trafic SL30', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.2, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Trafic LL30', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.0, cargoLengthCm: 280, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Trafic E-Tech Electric', type: 'Medium Van', maxPayloadKg: 950, cargoVolumeM3: 5.8, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Electric' },
  { make: 'Vauxhall', model: 'Vivaro L1', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Vivaro L2', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 6.1, cargoLengthCm: 280, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Vivaro-e Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.3, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Electric' },
  { make: 'Toyota', model: 'Proace L1', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace L2', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 6.1, cargoLengthCm: 282, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Electric' },
  { make: 'Citroen', model: 'Dispatch M', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Dispatch XL', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 6.1, cargoLengthCm: 282, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'e-Dispatch Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Electric' },
  { make: 'Peugeot', model: 'Expert Standard', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Expert Long', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 6.1, cargoLengthCm: 282, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'e-Expert Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Electric' },
  { make: 'Fiat', model: 'Scudo L1', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'E-Scudo Electric', type: 'Medium Van', maxPayloadKg: 950, cargoVolumeM3: 5.3, cargoLengthCm: 242, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Electric' },
  { make: 'Nissan', model: 'Primastar L1', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.2, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Primastar L2', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.0, cargoLengthCm: 280, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'MAXUS', model: 'Deliver 9 L2H2', type: 'Medium Van', maxPayloadKg: 1250, cargoVolumeM3: 9.7, cargoLengthCm: 310, cargoWidthCm: 178, cargoHeightCm: 183, fuelType: 'Diesel' },
  { make: 'MAXUS', model: 'eDeliver 9 Electric', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 9.7, cargoLengthCm: 310, cargoWidthCm: 178, cargoHeightCm: 183, fuelType: 'Electric' },

  // ─── LARGE VANS ────────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit L2H2', type: 'Large Van', maxPayloadKg: 1500, cargoVolumeM3: 9.5, cargoLengthCm: 299, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L3H2', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 11.5, cargoLengthCm: 347, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L3H3', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 13.3, cargoLengthCm: 347, cargoWidthCm: 178, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L4H3', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 15.1, cargoLengthCm: 402, cargoWidthCm: 178, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Ford', model: 'E-Transit L3H2 Electric', type: 'Large Van', maxPayloadKg: 1200, cargoVolumeM3: 11.5, cargoLengthCm: 347, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Electric' },
  { make: 'Ford', model: 'E-Transit L4H3 Electric', type: 'Large Van', maxPayloadKg: 1100, cargoVolumeM3: 15.1, cargoLengthCm: 402, cargoWidthCm: 178, cargoHeightCm: 215, fuelType: 'Electric' },
  { make: 'Mercedes-Benz', model: 'Sprinter 311 L2H2', type: 'Sprinter', maxPayloadKg: 1350, cargoVolumeM3: 10.5, cargoLengthCm: 343, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 314 L3H2', type: 'Sprinter', maxPayloadKg: 1300, cargoVolumeM3: 14.0, cargoLengthCm: 432, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 316 L4H3', type: 'Sprinter', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 479, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'eSprinter L2H2 Electric', type: 'Sprinter', maxPayloadKg: 1000, cargoVolumeM3: 10.5, cargoLengthCm: 343, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Electric' },
  { make: 'Mercedes-Benz', model: 'eSprinter L3H2 Electric', type: 'Sprinter', maxPayloadKg: 900, cargoVolumeM3: 14.0, cargoLengthCm: 432, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Electric' },
  { make: 'Volkswagen', model: 'Crafter L3H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 11.3, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter L3H3', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 14.4, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter L4H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.5, cargoLengthCm: 440, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'e-Crafter Electric', type: 'Large Van', maxPayloadKg: 1000, cargoVolumeM3: 10.7, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Electric' },
  { make: 'Renault', model: 'Master L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.8, cargoLengthCm: 312, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L3H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 216, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master E-Tech Electric', type: 'Large Van', maxPayloadKg: 1100, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Electric' },
  { make: 'Fiat', model: 'Ducato L2H2', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'E-Ducato Electric', type: 'Large Van', maxPayloadKg: 1050, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Electric' },
  { make: 'Peugeot', model: 'Boxer L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'e-Boxer Electric', type: 'Large Van', maxPayloadKg: 1050, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Electric' },
  { make: 'Citroen', model: 'Relay L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'e-Relay Electric', type: 'Large Van', maxPayloadKg: 1050, cargoVolumeM3: 10.0, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Electric' },
  { make: 'Vauxhall', model: 'Movano L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.8, cargoLengthCm: 312, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano-e Electric', type: 'Large Van', maxPayloadKg: 1100, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Electric' },
  { make: 'Iveco', model: 'Daily 35S L3H2', type: 'Large Van', maxPayloadKg: 1700, cargoVolumeM3: 12.0, cargoLengthCm: 357, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 35S L4H3', type: 'Large Van', maxPayloadKg: 1500, cargoVolumeM3: 18.0, cargoLengthCm: 450, cargoWidthCm: 180, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'eDaily Electric', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 12.0, cargoLengthCm: 357, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'Electric' },
  { make: 'MAN', model: 'TGE L3H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 11.3, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGE L4H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.5, cargoLengthCm: 440, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'MAN', model: 'eTGE Electric', type: 'Large Van', maxPayloadKg: 950, cargoVolumeM3: 10.7, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Electric' },
  { make: 'MAXUS', model: 'Deliver 9 L3H2', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 11.6, cargoLengthCm: 357, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'MAXUS', model: 'eDeliver 9 L3H2 Electric', type: 'Large Van', maxPayloadKg: 1200, cargoVolumeM3: 11.6, cargoLengthCm: 357, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Electric' },

  // ─── LUTON VANS ────────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Luton', type: 'Luton Van', maxPayloadKg: 1500, cargoVolumeM3: 18.0, cargoLengthCm: 400, cargoWidthCm: 200, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Luton Tail Lift', type: 'Luton Van', maxPayloadKg: 1400, cargoVolumeM3: 18.0, cargoLengthCm: 400, cargoWidthCm: 200, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Luton', type: 'Luton Van', maxPayloadKg: 1400, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Luton Tail Lift', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Luton Tail Lift', type: 'Luton Van', maxPayloadKg: 1200, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Luton', type: 'Luton Van', maxPayloadKg: 1350, cargoVolumeM3: 19.5, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter Luton', type: 'Luton Van', maxPayloadKg: 1350, cargoVolumeM3: 19.0, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter Luton Tail Lift', type: 'Luton Van', maxPayloadKg: 1250, cargoVolumeM3: 19.0, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.5, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.5, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Movano Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Luton 3.5t', type: 'Luton Van', maxPayloadKg: 1500, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Luton Tail Lift 3.5t', type: 'Luton Van', maxPayloadKg: 1400, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGE Luton', type: 'Luton Van', maxPayloadKg: 1350, cargoVolumeM3: 19.0, cargoLengthCm: 420, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Interstar Luton', type: 'Luton Van', maxPayloadKg: 1300, cargoVolumeM3: 19.0, cargoLengthCm: 410, cargoWidthCm: 205, cargoHeightCm: 220, fuelType: 'Diesel' },

  // ─── REFRIGERATED VANS ─────────────────────────────────────────────────────
  // Medium fridge (based on Transit Custom / Vito class)
  { make: 'Ford', model: 'Transit Custom Fridge', type: 'Refrigerated Van', maxPayloadKg: 800, cargoVolumeM3: 5.0, cargoLengthCm: 250, cargoWidthCm: 165, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Vito Fridge L2', type: 'Refrigerated Van', maxPayloadKg: 850, cargoVolumeM3: 5.5, cargoLengthCm: 270, cargoWidthCm: 160, cargoHeightCm: 128, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Trafic Fridge', type: 'Refrigerated Van', maxPayloadKg: 850, cargoVolumeM3: 4.5, cargoLengthCm: 235, cargoWidthCm: 158, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Transporter Fridge', type: 'Refrigerated Van', maxPayloadKg: 850, cargoVolumeM3: 5.0, cargoLengthCm: 260, cargoWidthCm: 162, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Expert Fridge', type: 'Refrigerated Van', maxPayloadKg: 900, cargoVolumeM3: 4.5, cargoLengthCm: 235, cargoWidthCm: 158, cargoHeightCm: 128, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Dispatch Fridge', type: 'Refrigerated Van', maxPayloadKg: 900, cargoVolumeM3: 4.5, cargoLengthCm: 235, cargoWidthCm: 158, cargoHeightCm: 128, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Vivaro Fridge', type: 'Refrigerated Van', maxPayloadKg: 850, cargoVolumeM3: 4.5, cargoLengthCm: 235, cargoWidthCm: 158, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace Fridge', type: 'Refrigerated Van', maxPayloadKg: 900, cargoVolumeM3: 4.5, cargoLengthCm: 235, cargoWidthCm: 158, cargoHeightCm: 128, fuelType: 'Diesel' },
  // Large fridge (based on Sprinter / Master / Crafter class)
  { make: 'Mercedes-Benz', model: 'Sprinter Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.5, cargoLengthCm: 340, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Fridge L3H2', type: 'Refrigerated Van', maxPayloadKg: 950, cargoVolumeM3: 11.0, cargoLengthCm: 420, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.0, cargoLengthCm: 310, cargoWidthCm: 170, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Fridge L3H2', type: 'Refrigerated Van', maxPayloadKg: 950, cargoVolumeM3: 10.5, cargoLengthCm: 365, cargoWidthCm: 170, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter Fridge L3H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 9.0, cargoLengthCm: 340, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Fridge L3H2', type: 'Refrigerated Van', maxPayloadKg: 1100, cargoVolumeM3: 9.0, cargoLengthCm: 340, cargoWidthCm: 170, cargoHeightCm: 178, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1050, cargoVolumeM3: 8.0, cargoLengthCm: 305, cargoWidthCm: 175, cargoHeightCm: 170, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.0, cargoLengthCm: 305, cargoWidthCm: 175, cargoHeightCm: 170, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay Fridge L2H2', type: 'Refrigerated Van', maxPayloadKg: 1000, cargoVolumeM3: 8.0, cargoLengthCm: 305, cargoWidthCm: 175, cargoHeightCm: 170, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Fridge L2H2 3.5t', type: 'Refrigerated Van', maxPayloadKg: 1200, cargoVolumeM3: 9.0, cargoLengthCm: 340, cargoWidthCm: 175, cargoHeightCm: 180, fuelType: 'Diesel' },

  // ─── PICKUP TRUCKS ─────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Ranger', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.5, cargoLengthCm: 156, cargoWidthCm: 154, cargoHeightCm: 51, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Hilux', type: 'Pickup Truck', maxPayloadKg: 1065, cargoVolumeM3: 1.5, cargoLengthCm: 152, cargoWidthCm: 151, cargoHeightCm: 48, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Amarok', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.6, cargoLengthCm: 160, cargoWidthCm: 156, cargoHeightCm: 50, fuelType: 'Diesel' },
  { make: 'Mitsubishi', model: 'L200', type: 'Pickup Truck', maxPayloadKg: 1050, cargoVolumeM3: 1.4, cargoLengthCm: 147, cargoWidthCm: 147, cargoHeightCm: 47, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Navara', type: 'Pickup Truck', maxPayloadKg: 1050, cargoVolumeM3: 1.5, cargoLengthCm: 151, cargoWidthCm: 153, cargoHeightCm: 47, fuelType: 'Diesel' },
  { make: 'Isuzu', model: 'D-Max', type: 'Pickup Truck', maxPayloadKg: 1100, cargoVolumeM3: 1.5, cargoLengthCm: 152, cargoWidthCm: 154, cargoHeightCm: 48, fuelType: 'Diesel' },

  // ─── BOX TRUCKS ────────────────────────────────────────────────────────────
  // 3.5t class
  { make: 'Iveco', model: 'Daily Box 3.5t', type: 'Box Truck', maxPayloadKg: 1600, cargoVolumeM3: 16.0, cargoLengthCm: 380, cargoWidthCm: 200, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Box 3.5t', type: 'Box Truck', maxPayloadKg: 1350, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1400, cargoVolumeM3: 14.0, cargoLengthCm: 350, cargoWidthCm: 195, cargoHeightCm: 200, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1350, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1350, cargoVolumeM3: 14.5, cargoLengthCm: 360, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay Box Body 3.5t', type: 'Box Truck', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 195, cargoHeightCm: 210, fuelType: 'Diesel' },
  // 5.0–5.5t class
  { make: 'Iveco', model: 'Daily 50C Box 5.2t', type: 'Box Truck', maxPayloadKg: 2700, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 215, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 519 Box 5.0t', type: 'Box Truck', maxPayloadKg: 2500, cargoVolumeM3: 19.0, cargoLengthCm: 420, cargoWidthCm: 210, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master 4.5t Box', type: 'Box Truck', maxPayloadKg: 2200, cargoVolumeM3: 19.0, cargoLengthCm: 420, cargoWidthCm: 210, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato Maxi Box 5.0t', type: 'Box Truck', maxPayloadKg: 2500, cargoVolumeM3: 19.5, cargoLengthCm: 425, cargoWidthCm: 210, cargoHeightCm: 215, fuelType: 'Diesel' },
  // 7.5t class
  { make: 'Iveco', model: 'Daily Box 7.2t', type: 'Box Truck', maxPayloadKg: 3500, cargoVolumeM3: 25.0, cargoLengthCm: 470, cargoWidthCm: 220, cargoHeightCm: 230, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Eurocargo 7.5t Box', type: 'Box Truck', maxPayloadKg: 3800, cargoVolumeM3: 30.0, cargoLengthCm: 520, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego 7.5t Box', type: 'Box Truck', maxPayloadKg: 3800, cargoVolumeM3: 30.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego 7.5t Tail Lift Box', type: 'Box Truck', maxPayloadKg: 3500, cargoVolumeM3: 30.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGL 7.5t Box', type: 'Box Truck', maxPayloadKg: 3700, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGL 7.5t Tail Lift Box', type: 'Box Truck', maxPayloadKg: 3400, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'DAF', model: 'LF 7.5t Box', type: 'Box Truck', maxPayloadKg: 3600, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'DAF', model: 'LF 7.5t Tail Lift Box', type: 'Box Truck', maxPayloadKg: 3300, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'Renault', model: 'D 7.5t Box', type: 'Box Truck', maxPayloadKg: 3600, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'Volvo', model: 'FL 7.5t Box', type: 'Box Truck', maxPayloadKg: 3700, cargoVolumeM3: 29.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'Volvo', model: 'FE Electric 7.5t Box', type: 'Box Truck', maxPayloadKg: 3200, cargoVolumeM3: 29.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Electric' },
  { make: 'Scania', model: 'L-Series 7.5t Box', type: 'Box Truck', maxPayloadKg: 3700, cargoVolumeM3: 29.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'Fuso', model: 'Canter 7C15 Box', type: 'Box Truck', maxPayloadKg: 3500, cargoVolumeM3: 24.0, cargoLengthCm: 460, cargoWidthCm: 215, cargoHeightCm: 225, fuelType: 'Diesel' },
  { make: 'Fuso', model: 'eCanter Electric Box', type: 'Box Truck', maxPayloadKg: 3000, cargoVolumeM3: 24.0, cargoLengthCm: 460, cargoWidthCm: 215, cargoHeightCm: 225, fuelType: 'Electric' },

  // ─── FLATBED TRUCKS ───────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Flatbed', type: 'Flatbed', maxPayloadKg: 1600, cargoVolumeM3: 8.0, cargoLengthCm: 400, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Flatbed 3.5t', type: 'Flatbed', maxPayloadKg: 1800, cargoVolumeM3: 10.0, cargoLengthCm: 420, cargoWidthCm: 215, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Flatbed', type: 'Flatbed', maxPayloadKg: 1500, cargoVolumeM3: 9.0, cargoLengthCm: 430, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master Flatbed', type: 'Flatbed', maxPayloadKg: 1600, cargoVolumeM3: 9.0, cargoLengthCm: 410, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },

  // ─── CURTAIN-SIDE ─────────────────────────────────────────────────────────
  { make: 'Iveco', model: 'Daily Curtain-side 3.5t', type: 'Curtain-side', maxPayloadKg: 1500, cargoVolumeM3: 20.0, cargoLengthCm: 420, cargoWidthCm: 215, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego Curtain-side 7.5t', type: 'Curtain-side', maxPayloadKg: 3500, cargoVolumeM3: 30.0, cargoLengthCm: 500, cargoWidthCm: 240, cargoHeightCm: 240, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGL Curtain-side 7.5t', type: 'Curtain-side', maxPayloadKg: 3400, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },

  // ─── TAIL LIFT VANS ───────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1300, cargoVolumeM3: 11.0, cargoLengthCm: 340, cargoWidthCm: 178, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit L4H3 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1200, cargoVolumeM3: 14.5, cargoLengthCm: 395, cargoWidthCm: 178, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 316 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1100, cargoVolumeM3: 13.0, cargoLengthCm: 430, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter 519 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 2200, cargoVolumeM3: 14.0, cargoLengthCm: 435, cargoWidthCm: 183, cargoHeightCm: 193, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 35S Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1500, cargoVolumeM3: 12.0, cargoLengthCm: 350, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 50C Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 2500, cargoVolumeM3: 16.0, cargoLengthCm: 420, cargoWidthCm: 200, cargoHeightCm: 200, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1200, cargoVolumeM3: 12.5, cargoLengthCm: 365, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Crafter L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1200, cargoVolumeM3: 10.8, cargoLengthCm: 340, cargoWidthCm: 183, cargoHeightCm: 185, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Ducato L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1150, cargoVolumeM3: 12.5, cargoLengthCm: 365, cargoWidthCm: 183, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'Peugeot', model: 'Boxer L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1150, cargoVolumeM3: 12.5, cargoLengthCm: 365, cargoWidthCm: 183, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1150, cargoVolumeM3: 12.5, cargoLengthCm: 365, cargoWidthCm: 183, cargoHeightCm: 175, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGE L3H2 Tail Lift', type: 'Tail Lift Van', maxPayloadKg: 1200, cargoVolumeM3: 10.8, cargoLengthCm: 340, cargoWidthCm: 183, cargoHeightCm: 185, fuelType: 'Diesel' },

  // ─── REFRIGERATED TRUCKS ──────────────────────────────────────────────────
  { make: 'Iveco', model: 'Daily Fridge 3.5t', type: 'Refrigerated Truck', maxPayloadKg: 1200, cargoVolumeM3: 14.0, cargoLengthCm: 380, cargoWidthCm: 190, cargoHeightCm: 195, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego Fridge 7.5t', type: 'Refrigerated Truck', maxPayloadKg: 3000, cargoVolumeM3: 24.0, cargoLengthCm: 480, cargoWidthCm: 220, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'DAF', model: 'LF Fridge 7.5t', type: 'Refrigerated Truck', maxPayloadKg: 2800, cargoVolumeM3: 22.0, cargoLengthCm: 470, cargoWidthCm: 220, cargoHeightCm: 215, fuelType: 'Diesel' },

  // ─── CHASSIS CAB ──────────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Chassis Cab', type: 'Chassis Cab', maxPayloadKg: 1700, cargoVolumeM3: 0, cargoLengthCm: 400, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Chassis Cab 3.5t', type: 'Chassis Cab', maxPayloadKg: 1900, cargoVolumeM3: 0, cargoLengthCm: 430, cargoWidthCm: 215, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Chassis Cab', type: 'Chassis Cab', maxPayloadKg: 1600, cargoVolumeM3: 0, cargoLengthCm: 440, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },

  // ─── CAR WITH TRAILER ───────────────────────────────────────────────────
  { make: 'Land Rover', model: 'Defender + Trailer', type: 'Car with Trailer', maxPayloadKg: 1000, cargoVolumeM3: 4.0, cargoLengthCm: 240, cargoWidthCm: 150, cargoHeightCm: 120, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Land Cruiser + Trailer', type: 'Car with Trailer', maxPayloadKg: 1100, cargoVolumeM3: 4.5, cargoLengthCm: 250, cargoWidthCm: 155, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Touareg + Trailer', type: 'Car with Trailer', maxPayloadKg: 900, cargoVolumeM3: 3.5, cargoLengthCm: 230, cargoWidthCm: 145, cargoHeightCm: 110, fuelType: 'Diesel' },

  // ─── ESTATE CARS ────────────────────────────────────────────────────────
  { make: 'Volvo', model: 'V90 Estate', type: 'Estate Car', maxPayloadKg: 550, cargoVolumeM3: 1.5, cargoLengthCm: 180, cargoWidthCm: 110, cargoHeightCm: 80, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'E-Class Estate', type: 'Estate Car', maxPayloadKg: 520, cargoVolumeM3: 1.4, cargoLengthCm: 175, cargoWidthCm: 105, cargoHeightCm: 78, fuelType: 'Diesel' },
  { make: 'Skoda', model: 'Superb Combi', type: 'Estate Car', maxPayloadKg: 580, cargoVolumeM3: 1.7, cargoLengthCm: 190, cargoWidthCm: 110, cargoHeightCm: 82, fuelType: 'Diesel' },

  // ─── CRANE TRUCKS (HIAB) ───────────────────────────────────────────────
  { make: 'Iveco', model: 'Daily HIAB 3.5t', type: 'Crane Truck (HIAB)', maxPayloadKg: 1200, cargoVolumeM3: 8.0, cargoLengthCm: 350, cargoWidthCm: 210, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Atego HIAB 7.5t', type: 'Crane Truck (HIAB)', maxPayloadKg: 2800, cargoVolumeM3: 15.0, cargoLengthCm: 450, cargoWidthCm: 240, cargoHeightCm: 0, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGL HIAB 7.5t', type: 'Crane Truck (HIAB)', maxPayloadKg: 2700, cargoVolumeM3: 14.0, cargoLengthCm: 440, cargoWidthCm: 240, cargoHeightCm: 0, fuelType: 'Diesel' },

  // ─── MOTORCYCLE COURIER ─────────────────────────────────────────────────
  { make: 'Honda', model: 'PCX 125 Courier', type: 'Motorcycle Courier', maxPayloadKg: 15, cargoVolumeM3: 0.05, cargoLengthCm: 40, cargoWidthCm: 30, cargoHeightCm: 30, fuelType: 'Petrol' },
  { make: 'BMW', model: 'C 400 GT Courier', type: 'Motorcycle Courier', maxPayloadKg: 20, cargoVolumeM3: 0.07, cargoLengthCm: 45, cargoWidthCm: 35, cargoHeightCm: 35, fuelType: 'Petrol' },

  // ─── BOAT TRAILER ──────────────────────────────────────────────────────
  { make: 'Indespension', model: 'Boat Trailer 3.5t', type: 'Boat Trailer', maxPayloadKg: 2500, cargoVolumeM3: 0, cargoLengthCm: 800, cargoWidthCm: 250, cargoHeightCm: 0, fuelType: 'N/A' },
  { make: 'Brian James', model: 'A-Max Boat Trailer', type: 'Boat Trailer', maxPayloadKg: 3000, cargoVolumeM3: 0, cargoLengthCm: 900, cargoWidthCm: 260, cargoHeightCm: 0, fuelType: 'N/A' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL EU/UK MAKES & MODELS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── OPEL (EU equivalent of Vauxhall) ──────────────────────────────────
  // Small
  { make: 'Opel', model: 'Combo Cargo L1', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Combo Cargo L2', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Combo-e Cargo Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },
  // Medium
  { make: 'Opel', model: 'Vivaro L1', type: 'Medium Van', maxPayloadKg: 1200, cargoVolumeM3: 5.3, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Vivaro L2', type: 'Medium Van', maxPayloadKg: 1150, cargoVolumeM3: 6.1, cargoLengthCm: 280, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Vivaro-e Electric', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.3, cargoLengthCm: 240, cargoWidthCm: 166, cargoHeightCm: 137, fuelType: 'Electric' },
  // Large
  { make: 'Opel', model: 'Movano L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.8, cargoLengthCm: 312, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Movano L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Movano L3H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 216, fuelType: 'Diesel' },
  { make: 'Opel', model: 'Movano-e Electric', type: 'Large Van', maxPayloadKg: 1100, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Electric' },

  // ─── MERCEDES-BENZ CITAN (Small Van) ──────────────────────────────────
  { make: 'Mercedes-Benz', model: 'Citan Panel Van', type: 'Small Van', maxPayloadKg: 615, cargoVolumeM3: 2.9, cargoLengthCm: 180, cargoWidthCm: 145, cargoHeightCm: 110, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Citan Long', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 210, cargoWidthCm: 145, cargoHeightCm: 110, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'eCitan Electric', type: 'Small Van', maxPayloadKg: 490, cargoVolumeM3: 2.9, cargoLengthCm: 180, cargoWidthCm: 145, cargoHeightCm: 110, fuelType: 'Electric' },

  // ─── RENAULT EXPRESS VAN ──────────────────────────────────────────────
  { make: 'Renault', model: 'Express Van', type: 'Small Van', maxPayloadKg: 575, cargoVolumeM3: 2.5, cargoLengthCm: 165, cargoWidthCm: 140, cargoHeightCm: 108, fuelType: 'Diesel' },

  // ─── HYUNDAI ──────────────────────────────────────────────────────────
  { make: 'Hyundai', model: 'Staria Load SWB', type: 'Medium Van', maxPayloadKg: 1000, cargoVolumeM3: 5.0, cargoLengthCm: 240, cargoWidthCm: 160, cargoHeightCm: 130, fuelType: 'Diesel' },
  { make: 'Hyundai', model: 'Staria Load LWB', type: 'Large Van', maxPayloadKg: 950, cargoVolumeM3: 6.5, cargoLengthCm: 290, cargoWidthCm: 160, cargoHeightCm: 130, fuelType: 'Diesel' },

  // ─── LEVC (London EV Company) ─────────────────────────────────────────
  { make: 'LEVC', model: 'VN5 Range Extender', type: 'Medium Van', maxPayloadKg: 830, cargoVolumeM3: 5.5, cargoLengthCm: 246, cargoWidthCm: 156, cargoHeightCm: 131, fuelType: 'Electric' },

  // ─── DFSK (EU-available electric vans) ────────────────────────────────
  { make: 'DFSK', model: 'EC35 Electric', type: 'Small Van', maxPayloadKg: 945, cargoVolumeM3: 4.8, cargoLengthCm: 224, cargoWidthCm: 157, cargoHeightCm: 132, fuelType: 'Electric' },

  // ─── PIAGGIO (Micro/city vans) ────────────────────────────────────────
  { make: 'Piaggio', model: 'Porter Electric', type: 'Small Van', maxPayloadKg: 530, cargoVolumeM3: 2.5, cargoLengthCm: 170, cargoWidthCm: 140, cargoHeightCm: 105, fuelType: 'Electric' },
  { make: 'Piaggio', model: 'Porter NP6 Diesel', type: 'Small Van', maxPayloadKg: 630, cargoVolumeM3: 3.0, cargoLengthCm: 198, cargoWidthCm: 142, cargoHeightCm: 108, fuelType: 'Diesel' },

  // ─── KGM (formerly SsangYong) ─────────────────────────────────────────
  { make: 'KGM', model: 'Musso Pickup', type: 'Pickup Truck', maxPayloadKg: 1085, cargoVolumeM3: 1.4, cargoLengthCm: 150, cargoWidthCm: 151, cargoHeightCm: 49, fuelType: 'Diesel' },
  { make: 'KGM', model: 'Musso Grand Pickup', type: 'Pickup Truck', maxPayloadKg: 1060, cargoVolumeM3: 1.6, cargoLengthCm: 165, cargoWidthCm: 151, cargoHeightCm: 49, fuelType: 'Diesel' },

  // ─── MAXUS (additional models) ────────────────────────────────────────
  { make: 'MAXUS', model: 'eDeliver 7 L2H2 Electric', type: 'Large Van', maxPayloadKg: 1150, cargoVolumeM3: 11.0, cargoLengthCm: 338, cargoWidthCm: 180, cargoHeightCm: 188, fuelType: 'Electric' },
  { make: 'MAXUS', model: 'eDeliver 7 L3H3 Electric', type: 'Large Van', maxPayloadKg: 1050, cargoVolumeM3: 14.7, cargoLengthCm: 395, cargoWidthCm: 180, cargoHeightCm: 210, fuelType: 'Electric' },
  { make: 'MAXUS', model: 'T90EV Electric Pickup', type: 'Pickup Truck', maxPayloadKg: 1000, cargoVolumeM3: 1.5, cargoLengthCm: 153, cargoWidthCm: 155, cargoHeightCm: 50, fuelType: 'Electric' },

  // ─── TOYOTA (additional) ──────────────────────────────────────────────
  { make: 'Toyota', model: 'Proace Max L3H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace Max L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Toyota', model: 'Proace Max Electric', type: 'Large Van', maxPayloadKg: 1050, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Electric' },
  { make: 'Toyota', model: 'Proace City Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },

  // ─── FORD (additional) ────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit L2H3', type: 'Large Van', maxPayloadKg: 1450, cargoVolumeM3: 11.0, cargoLengthCm: 299, cargoWidthCm: 178, cargoHeightCm: 215, fuelType: 'Diesel' },
  { make: 'Ford', model: 'Transit Custom PHEV', type: 'Medium Van', maxPayloadKg: 950, cargoVolumeM3: 5.8, cargoLengthCm: 252, cargoWidthCm: 170, cargoHeightCm: 137, fuelType: 'Hybrid' },
  { make: 'Ford', model: 'Ranger Raptor', type: 'Pickup Truck', maxPayloadKg: 620, cargoVolumeM3: 1.5, cargoLengthCm: 156, cargoWidthCm: 154, cargoHeightCm: 51, fuelType: 'Diesel' },

  // ─── VOLKSWAGEN (additional) ──────────────────────────────────────────
  { make: 'Volkswagen', model: 'Transporter T7 SWB', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 5.8, cargoLengthCm: 272, cargoWidthCm: 170, cargoHeightCm: 140, fuelType: 'Diesel' },
  { make: 'Volkswagen', model: 'Transporter T7 LWB', type: 'Medium Van', maxPayloadKg: 1050, cargoVolumeM3: 6.7, cargoLengthCm: 292, cargoWidthCm: 170, cargoHeightCm: 140, fuelType: 'Diesel' },

  // ─── RENAULT (additional) ─────────────────────────────────────────────
  { make: 'Renault', model: 'Master L4H2', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.5, cargoLengthCm: 430, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Master L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 430, cargoWidthCm: 179, cargoHeightCm: 216, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Kangoo Maxi', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Renault', model: 'Kangoo E-Tech Maxi Electric', type: 'Small Van', maxPayloadKg: 550, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 145, cargoHeightCm: 115, fuelType: 'Electric' },

  // ─── CITROEN (additional) ─────────────────────────────────────────────
  { make: 'Citroen', model: 'Relay L4H2', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 180, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Relay L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 434, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Citroen', model: 'Berlingo Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },

  // ─── PEUGEOT (additional) ─────────────────────────────────────────────
  { make: 'Peugeot', model: 'Partner Electric', type: 'Small Van', maxPayloadKg: 600, cargoVolumeM3: 3.3, cargoLengthCm: 183, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Electric' },

  // ─── FIAT (additional) ────────────────────────────────────────────────
  { make: 'Fiat', model: 'Ducato L3H3', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.0, cargoLengthCm: 370, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },
  { make: 'Fiat', model: 'Scudo L2', type: 'Medium Van', maxPayloadKg: 1100, cargoVolumeM3: 6.1, cargoLengthCm: 282, cargoWidthCm: 165, cargoHeightCm: 134, fuelType: 'Diesel' },

  // ─── NISSAN (additional) ──────────────────────────────────────────────
  { make: 'Nissan', model: 'Interstar L2H2', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 10.8, cargoLengthCm: 312, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Interstar L3H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Nissan', model: 'Interstar-e Electric', type: 'Large Van', maxPayloadKg: 1100, cargoVolumeM3: 13.0, cargoLengthCm: 370, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Electric' },

  // ─── VAUXHALL (additional) ────────────────────────────────────────────
  { make: 'Vauxhall', model: 'Combo L2', type: 'Small Van', maxPayloadKg: 650, cargoVolumeM3: 3.9, cargoLengthCm: 213, cargoWidthCm: 156, cargoHeightCm: 115, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano L4H2', type: 'Large Van', maxPayloadKg: 1300, cargoVolumeM3: 15.5, cargoLengthCm: 430, cargoWidthCm: 179, cargoHeightCm: 189, fuelType: 'Diesel' },
  { make: 'Vauxhall', model: 'Movano L4H3', type: 'Large Van', maxPayloadKg: 1250, cargoVolumeM3: 17.0, cargoLengthCm: 430, cargoWidthCm: 179, cargoHeightCm: 216, fuelType: 'Diesel' },

  // ─── IVECO (additional) ───────────────────────────────────────────────
  { make: 'Iveco', model: 'Daily 35S L2H2', type: 'Large Van', maxPayloadKg: 1600, cargoVolumeM3: 10.8, cargoLengthCm: 310, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily 50C Box 5.2t', type: 'Box Truck', maxPayloadKg: 2700, cargoVolumeM3: 20.0, cargoLengthCm: 430, cargoWidthCm: 215, cargoHeightCm: 220, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Natural Power CNG', type: 'Large Van', maxPayloadKg: 1400, cargoVolumeM3: 12.0, cargoLengthCm: 357, cargoWidthCm: 180, cargoHeightCm: 190, fuelType: 'CNG' },

  // ─── MAN (additional) ─────────────────────────────────────────────────
  { make: 'MAN', model: 'TGE L2H2', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 10.7, cargoLengthCm: 310, cargoWidthCm: 183, cargoHeightCm: 190, fuelType: 'Diesel' },
  { make: 'MAN', model: 'TGE L3H3', type: 'Large Van', maxPayloadKg: 1350, cargoVolumeM3: 14.4, cargoLengthCm: 347, cargoWidthCm: 183, cargoHeightCm: 210, fuelType: 'Diesel' },

  // ─── DAF (additional) ─────────────────────────────────────────────────
  { make: 'DAF', model: 'LF 7.5t Curtain-side', type: 'Curtain-side', maxPayloadKg: 3500, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Diesel' },
  { make: 'DAF', model: 'LF Electric 7.5t Box', type: 'Box Truck', maxPayloadKg: 3000, cargoVolumeM3: 28.0, cargoLengthCm: 490, cargoWidthCm: 240, cargoHeightCm: 235, fuelType: 'Electric' },

  // ─── TIPPER TRUCKS ────────────────────────────────────────────────────
  { make: 'Ford', model: 'Transit Tipper', type: 'Tipper Truck', maxPayloadKg: 1500, cargoVolumeM3: 4.0, cargoLengthCm: 300, cargoWidthCm: 200, cargoHeightCm: 40, fuelType: 'Diesel' },
  { make: 'Iveco', model: 'Daily Tipper 3.5t', type: 'Tipper Truck', maxPayloadKg: 1600, cargoVolumeM3: 5.0, cargoLengthCm: 330, cargoWidthCm: 210, cargoHeightCm: 40, fuelType: 'Diesel' },
  { make: 'Mercedes-Benz', model: 'Sprinter Tipper', type: 'Tipper Truck', maxPayloadKg: 1400, cargoVolumeM3: 4.5, cargoLengthCm: 310, cargoWidthCm: 200, cargoHeightCm: 40, fuelType: 'Diesel' },

  // ─── CARGO BIKES ──────────────────────────────────────────────────────
  { make: 'Urban Arrow', model: 'Cargo L', type: 'Cargo Bike', maxPayloadKg: 250, cargoVolumeM3: 0.6, cargoLengthCm: 90, cargoWidthCm: 60, cargoHeightCm: 60, fuelType: 'Electric' },
  { make: 'Riese & Muller', model: 'Packster 70', type: 'Cargo Bike', maxPayloadKg: 200, cargoVolumeM3: 0.4, cargoLengthCm: 80, cargoWidthCm: 55, cargoHeightCm: 50, fuelType: 'Electric' },
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
