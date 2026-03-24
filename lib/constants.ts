// ─── SHARED CONSTANTS ─────────────────────────────────────────────────────────
// Single source of truth for all duplicated constants across the app

// ─── CARGO TYPES ────────────────────────────────────────────────────────────

export const CARGO_TYPES = [
  'Provisions & Food',
  'Wine & Spirits',
  'Marine Equipment',
  'Spare Parts',
  'Luxury Goods',
  'Crew Gear & Uniforms',
  'Interior & Decor',
  'Chandlery',
  'Electronics',
  'Sails & Canvas',
  'Cleaning Supplies',
  'Medical Supplies',
  'Safety Equipment',
  'Paints, Solvents & Chemicals',
  'Other',
] as const

export type CargoType = (typeof CARGO_TYPES)[number]

// ─── CURRENCIES ─────────────────────────────────────────────────────────────

export const CURRENCIES = ['EUR', 'GBP', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const sym = CURRENCY_SYMBOLS[currency as Currency] || currency
  return `${sym}${amount.toFixed(2)}`
}

// ─── TRANSPORT METHODS ──────────────────────────────────────────────────────

export const TRANSPORT_METHODS = [
  { value: 'van', label: 'Van / Small Van' },
  { value: 'large_van', label: 'Large Van / Luton' },
  { value: 'refrigerated', label: 'Refrigerated Vehicle' },
  { value: 'truck', label: 'Truck / HGV' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'car_trailer', label: 'Car with Trailer' },
  { value: 'motorcycle', label: 'Motorcycle Courier' },
] as const

// ─── URGENCY OPTIONS ────────────────────────────────────────────────────────

export const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible (cheapest)' },
  { value: 'within_week', label: 'Within a week' },
  { value: 'within_3_days', label: 'Within 3 days' },
  { value: 'next_day', label: 'Next day' },
  { value: 'same_day', label: 'Same day (premium)' },
] as const

// ─── BOOKING STATUS ─────────────────────────────────────────────────────────

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  QUOTE_REQUESTED: 'bg-purple-50 text-purple-700 border-purple-200',
  QUOTED: 'bg-violet-50 text-violet-700 border-violet-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PICKED_UP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CUSTOMS_HOLD: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-stone-100 text-stone-600 border-stone-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  DISPUTED: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const BOOKING_STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] as const

// ─── LISTING STATUS ─────────────────────────────────────────────────────────

export const LISTING_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-stone-50 text-stone-600 border-stone-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FULL: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-stone-100 text-stone-600 border-stone-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

// ─── PAYMENT STATUS ─────────────────────────────────────────────────────────

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
}

// ─── INSURANCE TIERS ────────────────────────────────────────────────────────

export const INSURANCE_TIER_COLORS: Record<string, string> = {
  basic: 'bg-stone-100 text-stone-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
}

// ─── DISPUTE STATUS ─────────────────────────────────────────────────────────

export const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  APPEALED: 'bg-purple-100 text-purple-700',
}
