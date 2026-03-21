// Transporter specialization tags — what makes a carrier yacht-approved
// Used in profile, search filters, and verification badges

export interface Specialization {
  id: string
  label: string
  icon: string      // emoji for display
  description: string
  requirements: string[]
}

export const specializations: Specialization[] = [
  {
    id: 'wine_spirits',
    label: 'Wine & Spirits',
    icon: '🍷',
    description: 'Certified for temperature-controlled wine and spirits transport',
    requirements: [
      'Temperature-controlled vehicle or insulated cargo area',
      'Understanding of wine storage requirements (12-16°C)',
      'Vibration-dampened racking or suspension',
      'Appropriate insurance for high-value alcohol',
    ],
  },
  {
    id: 'refrigerated',
    label: 'Refrigerated Goods',
    icon: '❄️',
    description: 'Equipped for chilled and frozen provisions delivery',
    requirements: [
      'Working refrigeration unit with temperature logging',
      'HACCP or food hygiene awareness',
      'Temperature monitoring and proof capability',
      'Backup power for extended journeys',
    ],
  },
  {
    id: 'hazmat',
    label: 'Hazmat / ADR',
    icon: '⚠️',
    description: 'Licensed for dangerous goods (paints, solvents, gas, flares)',
    requirements: [
      'Valid ADR driver certificate',
      'ADR-compliant vehicle and placarding',
      'Dangerous goods safety equipment on board',
      'Knowledge of IMDG code for port deliveries',
    ],
  },
  {
    id: 'oversized',
    label: 'Oversized & Heavy',
    icon: '📐',
    description: 'Capable of handling oversized yacht equipment, masts, and tenders',
    requirements: [
      'Flatbed, low-loader, or extended vehicle',
      'Crane or HIAB equipment where needed',
      'Experience with securing oversized loads',
      'Knowledge of bridge heights and route restrictions',
    ],
  },
  {
    id: 'fine_art',
    label: 'Fine Art & Valuables',
    icon: '🖼️',
    description: 'Specialist handling for artwork, antiques, and high-value interior items',
    requirements: [
      'Climate-controlled vehicle',
      'White-glove handling procedures',
      'High-value goods insurance (£100k+)',
      'Experience with fragile and irreplaceable items',
    ],
  },
  {
    id: 'electronics',
    label: 'Marine Electronics',
    icon: '📡',
    description: 'Specialist in navigation, AV, and communication equipment',
    requirements: [
      'Anti-static handling procedures',
      'Appropriate packaging and cushioning',
      'Understanding of marine electronic systems',
      'Insurance covering electronic equipment',
    ],
  },
  {
    id: 'provisions',
    label: 'Provisions & Catering',
    icon: '🥘',
    description: 'Food-safe transport for yacht provisioning and catering supplies',
    requirements: [
      'Food hygiene certificate (Level 2 minimum)',
      'Temperature-controlled or insulated vehicle',
      'Clean, food-grade cargo area',
      'Understanding of allergen and dietary requirements',
    ],
  },
  {
    id: 'sails_rigging',
    label: 'Sails & Rigging',
    icon: '⛵',
    description: 'Experience with sail lofts, rigging, and large canvas items',
    requirements: [
      'Long-wheelbase or extended vehicle for sail bags',
      'Knowledge of handling carbon fibre and composite materials',
      'Experience with sail loft collections and deliveries',
      'Understanding of furling systems and mast sections',
    ],
  },
  {
    id: 'medical',
    label: 'Medical Supplies',
    icon: '🏥',
    description: 'Certified for medical and pharmaceutical deliveries to yachts',
    requirements: [
      'Temperature-controlled storage for medications',
      'Understanding of controlled substance regulations',
      'Chain of custody documentation',
      'Knowledge of maritime medical kit requirements (MCA/flag state)',
    ],
  },
  {
    id: 'cross_border',
    label: 'Cross-Border EU/UK',
    icon: '🇪🇺',
    description: 'Experienced with customs, T1/T2 transit, and EU-UK border procedures',
    requirements: [
      'Understanding of EU/UK customs declarations',
      'Experience with GVMS and goods movement references',
      'Knowledge of T1/T2 transit procedures',
      'Dover/Calais and Channel Tunnel freight experience',
    ],
  },
  {
    id: 'island_ferry',
    label: 'Island & Ferry Routes',
    icon: '⛴️',
    description: 'Experienced with ferry crossings to islands (IOW, Balearics, Corsica, Sardinia)',
    requirements: [
      'Experience booking commercial vehicle ferry slots',
      'Knowledge of vehicle height/weight ferry restrictions',
      'Understanding of island road restrictions',
      'Relationships with ferry operators for priority booking',
    ],
  },
]

// Helper: Get specialization by id
export function getSpecializationById(id: string): Specialization | undefined {
  return specializations.find(s => s.id === id)
}

// Helper: Get multiple specializations
export function getSpecializations(ids: string[]): Specialization[] {
  return ids.map(id => specializations.find(s => s.id === id)).filter(Boolean) as Specialization[]
}

// Verification badge levels
export interface VerificationBadge {
  id: string
  label: string
  color: string
  requirements: string
}

export const verificationBadges: VerificationBadge[] = [
  {
    id: 'marine_approved',
    label: 'Marine Approved',
    color: '#1a5276',
    requirements: 'Completed marine logistics training, 10+ successful yacht deliveries, background checked',
  },
  {
    id: 'verified_carrier',
    label: 'Verified Carrier',
    color: '#27ae60',
    requirements: 'Identity verified, valid insurance, vehicle MOT current, goods-in-transit cover active',
  },
  {
    id: 'trusted_partner',
    label: 'Trusted Partner',
    color: '#C6904D',
    requirements: '50+ completed deliveries, 4.5+ average rating, zero unresolved disputes',
  },
  {
    id: 'superyacht_specialist',
    label: 'Superyacht Specialist',
    color: '#8e44ad',
    requirements: 'Experience with 30m+ vessels, port access permits for major marinas, premium insurance',
  },
]
