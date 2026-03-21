// Transit insurance estimator for yacht deliveries
// Provides indicative quotes for goods-in-transit cover

export interface InsuranceTier {
  id: string
  name: string
  description: string
  coverageMultiplier: number  // multiply declared value
  excessGBP: number
  features: string[]
}

export const insuranceTiers: InsuranceTier[] = [
  {
    id: 'basic',
    name: 'Basic Cover',
    description: 'Standard goods-in-transit insurance for general cargo',
    coverageMultiplier: 0.008,  // 0.8% of declared value
    excessGBP: 250,
    features: [
      'Accidental damage during transit',
      'Theft from locked vehicle',
      'Fire and explosion',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Cover',
    description: 'Enhanced cover including loading/unloading and storage',
    coverageMultiplier: 0.015,  // 1.5% of declared value
    excessGBP: 150,
    features: [
      'All basic cover benefits',
      'Loading and unloading damage',
      'Overnight storage (up to 72 hours)',
      'Water damage',
      'Breakage of fragile items',
    ],
  },
  {
    id: 'premium',
    name: 'Marine Premium',
    description: 'Comprehensive cover designed for high-value yacht supplies',
    coverageMultiplier: 0.025,  // 2.5% of declared value
    excessGBP: 100,
    features: [
      'All standard cover benefits',
      'Temperature deviation (refrigerated goods)',
      'Customs delay and damage',
      'Pairs and sets clause',
      'Contamination cover (wine & provisions)',
      'Electronic equipment surge protection',
      'Named-perils all-risks',
    ],
  },
]

export interface CargoCategory {
  id: string
  label: string
  riskFactor: number       // multiplier on base rate
  minCoverRecommended: string  // tier id
  notes?: string
}

export const cargoCategories: CargoCategory[] = [
  { id: 'provisions', label: 'Provisions & Food', riskFactor: 1.2, minCoverRecommended: 'standard', notes: 'Temperature control recommended' },
  { id: 'wine', label: 'Wine & Spirits', riskFactor: 1.5, minCoverRecommended: 'premium', notes: 'Temperature and vibration sensitive. Premium cover recommended for fine wines.' },
  { id: 'marine_equipment', label: 'Marine Equipment', riskFactor: 1.0, minCoverRecommended: 'standard' },
  { id: 'spare_parts', label: 'Spare Parts', riskFactor: 0.8, minCoverRecommended: 'basic' },
  { id: 'electronics', label: 'Electronics & Navigation', riskFactor: 1.8, minCoverRecommended: 'premium', notes: 'High value per kg. Surge and water damage common.' },
  { id: 'luxury', label: 'Luxury Goods & Interior', riskFactor: 2.0, minCoverRecommended: 'premium', notes: 'Artwork, furnishings, custom fittings. High declared values.' },
  { id: 'sails', label: 'Sails & Canvas', riskFactor: 1.0, minCoverRecommended: 'standard', notes: 'Oversized items, water damage risk.' },
  { id: 'chandlery', label: 'Chandlery & Deck Hardware', riskFactor: 0.8, minCoverRecommended: 'basic' },
  { id: 'safety', label: 'Safety Equipment', riskFactor: 1.0, minCoverRecommended: 'standard', notes: 'Life rafts, EPIRBs — some items are hazmat.' },
  { id: 'crew_gear', label: 'Crew Gear & Uniforms', riskFactor: 0.7, minCoverRecommended: 'basic' },
  { id: 'cleaning', label: 'Cleaning & Maintenance Supplies', riskFactor: 0.6, minCoverRecommended: 'basic' },
  { id: 'medical', label: 'Medical Supplies', riskFactor: 1.3, minCoverRecommended: 'standard', notes: 'Temperature-controlled storage may be required.' },
  { id: 'hazmat', label: 'Paints, Solvents & Chemicals', riskFactor: 2.5, minCoverRecommended: 'premium', notes: 'ADR regulations apply. Specialist carrier required.' },
]

export interface InsuranceEstimate {
  tier: InsuranceTier
  premiumGBP: number
  premiumEUR: number
  coverageAmount: number
  excessGBP: number
  recommended: boolean
}

// Estimate insurance premium
export function estimateInsurance(
  declaredValueGBP: number,
  cargoCategory: string,
  crossBorder: boolean = false,
): InsuranceEstimate[] {
  const category = cargoCategories.find(c => c.id === cargoCategory)
  const riskFactor = category?.riskFactor ?? 1.0
  const crossBorderSurcharge = crossBorder ? 1.3 : 1.0
  const minCover = category?.minCoverRecommended ?? 'basic'

  return insuranceTiers.map(tier => {
    const basePremium = declaredValueGBP * tier.coverageMultiplier * riskFactor * crossBorderSurcharge
    const premiumGBP = Math.max(25, Math.round(basePremium * 100) / 100)  // minimum £25
    const premiumEUR = Math.round(premiumGBP * 1.16 * 100) / 100  // approx GBP to EUR

    return {
      tier,
      premiumGBP,
      premiumEUR,
      coverageAmount: declaredValueGBP,
      excessGBP: tier.excessGBP,
      recommended: tier.id === minCover,
    }
  })
}

// Get category by id
export function getCargoCategoryById(id: string): CargoCategory | undefined {
  return cargoCategories.find(c => c.id === id)
}
