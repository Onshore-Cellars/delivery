// Cargo safety data for yacht provisioning and delivery operations
// Includes ADR (European Agreement concerning the International Carriage
// of Dangerous Goods by Road) classifications where applicable.

export const ADR_CLASSES: Record<string, string> = {
  "1": "Class 1 - Explosives",
  "2": "Class 2 - Gases",
  "2.1": "Class 2.1 - Flammable Gases",
  "2.2": "Class 2.2 - Non-Flammable, Non-Toxic Gases",
  "2.3": "Class 2.3 - Toxic Gases",
  "3": "Class 3 - Flammable Liquids",
  "4.1": "Class 4.1 - Flammable Solids",
  "4.2": "Class 4.2 - Spontaneously Combustible",
  "4.3": "Class 4.3 - Dangerous When Wet",
  "5.1": "Class 5.1 - Oxidizing Substances",
  "5.2": "Class 5.2 - Organic Peroxides",
  "6.1": "Class 6.1 - Toxic Substances",
  "6.2": "Class 6.2 - Infectious Substances",
  "7": "Class 7 - Radioactive Material",
  "8": "Class 8 - Corrosive Substances",
  "9": "Class 9 - Miscellaneous Dangerous Goods",
};

export interface CargoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  warnings: string[];
  requirements: string[];
  adrClass?: string;
}

export const CARGO_CATEGORIES: CargoCategory[] = [
  {
    id: "provisions-food",
    name: "Provisions & Food",
    description:
      "Perishable food items, dry goods, and fresh produce for yacht provisioning.",
    icon: "🍎",
    warnings: [
      "Perishable goods require continuous cold chain maintenance",
      "Temperature-sensitive items must be monitored throughout transit",
      "Customs declarations required for meat, dairy, and animal products",
      "Cross-border transport may require phytosanitary or veterinary certificates",
      "Allergen labelling must be preserved and visible",
    ],
    requirements: [
      "Refrigerated or insulated transport vehicle",
      "Temperature logging device installed and active",
      "Health and hygiene certificates for handler",
      "Customs documentation for meat, dairy, and restricted produce",
      "HACCP-compliant packaging and handling",
    ],
  },
  {
    id: "wine-spirits",
    name: "Wine & Spirits",
    description:
      "Alcoholic beverages including fine wines, champagne, and spirits for onboard service.",
    icon: "🍷",
    warnings: [
      "Alcohol import/export regulations vary by country and port",
      "Fragile glass bottles require careful handling and padding",
      "Heavy cargo - wine pallets can exceed standard weight limits",
      "Excise duty and tax documentation required at borders",
      "Temperature extremes can damage wine quality",
    ],
    requirements: [
      "Excise duty documentation and alcohol transport licence",
      "Shock-absorbent packaging for glass bottles",
      "Climate-controlled storage for fine wines (12-16 C)",
      "Weight assessment for vehicle load planning",
      "Age verification and chain-of-custody records",
    ],
  },
  {
    id: "flowers-plants",
    name: "Flowers & Plants",
    description:
      "Fresh flowers, live plants, and floral arrangements for yacht decoration.",
    icon: "🌸",
    warnings: [
      "Highly perishable - shelf life measured in hours once cut",
      "Phytosanitary certificates required for cross-border transport",
      "Temperature must be controlled (2-8 C for most cut flowers)",
      "Time-critical delivery - wilting risk increases with delay",
      "Some plants are restricted or prohibited in certain countries",
    ],
    requirements: [
      "Phytosanitary certificate from origin country",
      "Temperature-controlled transport (2-8 C recommended)",
      "Express delivery scheduling with minimal transit time",
      "Moisture management during transport",
      "CITES documentation for protected species",
    ],
  },
  {
    id: "batteries-electronics",
    name: "Batteries & Electronics",
    description:
      "Lithium batteries, electronic equipment, AV systems, and navigation electronics.",
    icon: "🔋",
    warnings: [
      "Lithium batteries classified as ADR Class 9 dangerous goods",
      "IATA and IMDG restrictions apply for air and sea freight",
      "Fire risk from damaged or short-circuited lithium cells",
      "Specific labelling and packaging required by regulation",
      "State of charge limits may apply (max 30% for air freight)",
    ],
    requirements: [
      "ADR Class 9 labelling and documentation",
      "UN-tested packaging for lithium batteries (UN3481/UN3091)",
      "IATA/IMDG compliant shipping declarations",
      "Fire-resistant packaging or containment for bulk battery shipments",
      "Trained dangerous goods handler certification",
    ],
    adrClass: "9",
  },
  {
    id: "marine-equipment",
    name: "Marine Equipment",
    description:
      "Anchors, winches, tenders, davits, and heavy marine hardware.",
    icon: "⚓",
    warnings: [
      "Heavy items requiring specialist lifting equipment",
      "Oversized cargo may need route planning for road transport",
      "Crush and drop hazards during loading/unloading",
      "Salt-water corrosion risk if not properly packaged",
      "Some items require crane or forklift access at delivery point",
    ],
    requirements: [
      "Load assessment and vehicle weight capacity check",
      "Lifting equipment and trained riggers for heavy items",
      "Oversized cargo permits if exceeding standard dimensions",
      "Corrosion-resistant packaging for exposed metal parts",
      "Quayside or marina access coordination",
    ],
  },
  {
    id: "spare-parts",
    name: "Spare Parts",
    description:
      "Engine parts, mechanical spares, filters, belts, and engineering consumables.",
    icon: "🔧",
    warnings: [
      "Oil and grease contamination on used or reconditioned parts",
      "Heavy individual items (engine blocks, shafts, propellers)",
      "Precision parts require vibration-free transport",
      "Some parts contain hazardous materials (asbestos gaskets, lead)",
      "Customs classification can be complex for mixed shipments",
    ],
    requirements: [
      "Oil-proof packaging and spill containment",
      "Weight and dimension assessment for transport planning",
      "Anti-vibration packaging for precision components",
      "Material safety data sheets for hazardous components",
      "Accurate customs tariff codes for each part type",
    ],
  },
  {
    id: "fuel-lubricants",
    name: "Fuel & Lubricants",
    description:
      "Marine diesel, engine oils, hydraulic fluids, and lubricants.",
    icon: "⛽",
    warnings: [
      "ADR Class 3 - Flammable liquids, strictly regulated transport",
      "Significant fire and explosion risk",
      "Environmental pollution risk from spills",
      "Requires certified dangerous goods vehicle and driver",
      "Storage quantity limits per vehicle apply",
    ],
    requirements: [
      "ADR Class 3 certified vehicle and trained driver",
      "Spill containment kit and fire extinguisher onboard",
      "UN-approved containers and packaging",
      "Dangerous goods transport document (ADR consignment note)",
      "Route planning to avoid tunnels and restricted zones",
      "Emergency contact and TREMCARD available",
    ],
    adrClass: "3",
  },
  {
    id: "chemicals-cleaning",
    name: "Chemicals & Cleaning",
    description:
      "Industrial cleaning agents, solvents, descalers, and sanitation products.",
    icon: "🧪",
    warnings: [
      "May fall under ADR Class 8 (corrosive) or Class 9 (miscellaneous)",
      "Corrosive substances can damage other cargo and vehicles",
      "Environmental hazard if released into waterways",
      "Mixing incompatible chemicals can cause toxic reactions",
      "Strict segregation rules apply during transport",
    ],
    requirements: [
      "ADR classification check for each product (Class 8 or 9)",
      "Safety data sheets (SDS) for every chemical product",
      "Compatible packaging - corrosion-resistant containers",
      "Segregation from foodstuffs and incompatible chemicals",
      "Personal protective equipment for handlers",
      "Spill kit and neutralising agents available",
    ],
    adrClass: "8",
  },
  {
    id: "medical-supplies",
    name: "Medical Supplies",
    description:
      "Onboard medical kit replenishment, first aid supplies, and prescription medications.",
    icon: "🏥",
    warnings: [
      "Temperature-controlled storage required for many medications",
      "Controlled substances subject to strict national regulations",
      "Chain of custody must be documented and maintained",
      "Expiry date verification required before delivery",
      "Some items require import permits in certain jurisdictions",
    ],
    requirements: [
      "Temperature-controlled transport for sensitive medications",
      "Controlled substance licence and documentation",
      "Chain of custody log with signatures at each handover",
      "Tamper-evident packaging for controlled items",
      "Import/export permits for restricted medications",
    ],
  },
  {
    id: "luxury-goods",
    name: "Luxury Goods",
    description:
      "High-value items including jewellery, watches, art, designer furnishings, and collectibles.",
    icon: "💎",
    warnings: [
      "High monetary value increases theft and fraud risk",
      "Insurance requirements may exceed standard cargo policies",
      "Customs duties and luxury tax applicable in most jurisdictions",
      "Fragile items require specialist packing and handling",
      "Discrete transport recommended to reduce theft exposure",
    ],
    requirements: [
      "Enhanced insurance coverage with declared value",
      "Secure, locked, and tracked transport vehicle",
      "Proof of provenance and purchase documentation",
      "Customs declarations with accurate valuations",
      "Signature-on-delivery and photo proof of handover",
    ],
  },
  {
    id: "crew-gear",
    name: "Crew Gear & Uniforms",
    description:
      "Crew personal effects, uniforms, safety gear, and PPE.",
    icon: "👕",
    warnings: [
      "Generally low risk - standard transport procedures apply",
      "Check for restricted items in personal effects (knives, tools)",
      "Uniform deliveries may be time-sensitive for crew changes",
    ],
    requirements: [
      "Standard packaging and transport",
      "Delivery scheduling aligned with crew changeover dates",
      "Inventory list for customs clearance if crossing borders",
    ],
  },
  {
    id: "interior-decor",
    name: "Interior & Decor",
    description:
      "Furniture, artwork, mirrors, glassware, and decorative items for yacht interiors.",
    icon: "🖼️",
    warnings: [
      "Fragile items prone to breakage during transport",
      "Oversized furniture may not fit standard delivery vehicles",
      "Artwork requires climate-controlled and vibration-free transport",
      "Custom items are irreplaceable - extreme care required",
      "Access through yacht hatches and corridors may be very tight",
    ],
    requirements: [
      "Custom crating and foam-padded packaging",
      "Climate-controlled transport for artwork and antiques",
      "Oversized vehicle or specialist art transport service",
      "White-glove delivery with onboard placement",
      "Pre-delivery survey of access routes on yacht",
    ],
  },
  {
    id: "chandlery",
    name: "Chandlery",
    description:
      "General marine supplies, ropes, fenders, cleaning products, deck hardware, and consumables.",
    icon: "🪢",
    warnings: [
      "Mixed cargo - check individual items for hazardous classification",
      "Some chandlery items (solvents, resins) may be ADR regulated",
      "Rope and line coils can be heavy and awkward to handle",
      "Ensure no incompatible items are packed together",
    ],
    requirements: [
      "Item-by-item hazard check for mixed consignments",
      "Standard packaging with weight distribution planning",
      "Segregation of any hazardous items from general goods",
      "Delivery manifest with itemised contents list",
    ],
  },
  {
    id: "paint-coatings",
    name: "Paint & Coatings",
    description:
      "Marine paint, antifouling, varnishes, primers, and protective coatings.",
    icon: "🎨",
    warnings: [
      "ADR Class 3 - Flammable liquids (solvent-based paints)",
      "Toxic fumes require adequate ventilation during handling",
      "Environmental hazard - antifouling paints contain biocides",
      "Vapour accumulation risk in enclosed vehicles",
      "Some coatings are restricted or banned in certain waters",
    ],
    requirements: [
      "ADR Class 3 transport compliance for solvent-based products",
      "Ventilated transport vehicle",
      "Safety data sheets for all products",
      "Spill containment and cleanup materials",
      "Environmental compliance documentation for antifouling products",
    ],
    adrClass: "3",
  },
  {
    id: "gas-cylinders",
    name: "Gas Cylinders",
    description:
      "Compressed gas cylinders including propane, CO2, oxygen, acetylene, and refrigerants.",
    icon: "🔴",
    warnings: [
      "ADR Class 2 - Pressurised gases, extreme danger if ruptured",
      "Explosion risk from heat exposure or physical damage",
      "Toxic or asphyxiation risk from gas leaks in enclosed spaces",
      "Strict stacking and securing requirements during transport",
      "Acetylene and oxygen must never be transported together",
    ],
    requirements: [
      "ADR Class 2 certified vehicle and trained driver",
      "Cylinder securing racks or cradles to prevent rolling",
      "Gas-specific segregation rules strictly enforced",
      "Ventilated vehicle body - never fully enclosed",
      "Leak detection equipment and emergency breathing apparatus",
      "Valve protection caps fitted at all times during transport",
    ],
    adrClass: "2",
  },
  {
    id: "fireworks-pyrotechnics",
    name: "Fireworks / Pyrotechnics",
    description:
      "Maritime distress flares, signal rockets, and display fireworks for events.",
    icon: "🎆",
    warnings: [
      "ADR Class 1 - Explosives, most severely restricted category",
      "Requires specialist explosives transport licence",
      "Strict quantity limits per vehicle and per journey",
      "No co-loading with most other cargo types",
      "Storage, handling, and transport subject to national explosive regulations",
      "Accidental ignition risk from friction, heat, or impact",
    ],
    requirements: [
      "ADR Class 1 explosives transport licence",
      "Specialist explosives-rated vehicle",
      "Quantity limits verified against national regulations",
      "Route planning to avoid populated areas and tunnels",
      "Police or authority notification may be required",
      "No co-loading with incompatible goods",
      "Emergency procedures and fire suppression equipment",
    ],
    adrClass: "1",
  },
  {
    id: "pharmaceuticals",
    name: "Pharmaceuticals",
    description:
      "Prescription drugs, vaccines, controlled substances, and pharmaceutical supplies.",
    icon: "💊",
    warnings: [
      "Controlled substances require strict chain of custody documentation",
      "Temperature excursions can render medications ineffective or dangerous",
      "Import/export of pharmaceuticals is heavily regulated",
      "Counterfeit risk requires verified supply chain",
      "Some items classified as dangerous goods (flammable, toxic)",
    ],
    requirements: [
      "GDP (Good Distribution Practice) compliant transport",
      "Temperature-controlled vehicle with continuous monitoring",
      "Controlled substance licence and chain of custody log",
      "Tamper-evident and serialised packaging",
      "Import/export permits and customs pre-clearance",
      "Qualified Person release documentation",
    ],
  },
  {
    id: "textiles-furnishings",
    name: "Textiles & Soft Furnishings",
    description:
      "Curtains, cushions, bedding, towels, carpets, and upholstery for yacht interiors.",
    icon: "🛋️",
    warnings: [
      "Generally low risk - standard transport procedures apply",
      "Must be kept dry - water damage ruins textiles",
      "Bulky items may require large vehicle despite low weight",
      "Moth and pest contamination possible on natural fibres",
    ],
    requirements: [
      "Weatherproof and moisture-proof packaging",
      "Clean, dry transport vehicle",
      "Pest-free certification for cross-border wool/silk shipments",
      "Vacuum packaging for space optimisation where possible",
    ],
  },
];

/**
 * Returns warnings, requirements, risk level, and ADR class for a given cargo type.
 */
export function getCargoWarnings(cargoType: string): {
  warnings: string[];
  requirements: string[];
  adrClass?: string;
  riskLevel: "low" | "medium" | "high" | "extreme";
} {
  const category = CARGO_CATEGORIES.find(
    (c) =>
      c.id === cargoType ||
      c.name.toLowerCase() === cargoType.toLowerCase()
  );

  if (!category) {
    return {
      warnings: ["Unknown cargo type - conduct a risk assessment before transport"],
      requirements: ["Verify cargo classification and applicable regulations"],
      riskLevel: "medium",
    };
  }

  const riskLevel = determineRiskLevel(category);

  return {
    warnings: category.warnings,
    requirements: category.requirements,
    adrClass: category.adrClass,
    riskLevel,
  };
}

function determineRiskLevel(
  category: CargoCategory
): "low" | "medium" | "high" | "extreme" {
  if (!category.adrClass) {
    // Non-ADR items: check for specific high-risk indicators
    const highRiskIds = ["luxury-goods", "medical-supplies", "pharmaceuticals"];
    const lowRiskIds = ["crew-gear", "textiles-furnishings", "chandlery"];

    if (lowRiskIds.includes(category.id)) return "low";
    if (highRiskIds.includes(category.id)) return "high";
    return "medium";
  }

  // ADR-classified cargo
  switch (category.adrClass) {
    case "1":
      return "extreme";
    case "2":
    case "3":
      return "high";
    case "8":
    case "9":
      return "medium";
    default:
      return "high";
  }
}

/**
 * Returns the human-readable ADR class name for a given class code.
 */
export function getADRLabel(adrClass: string): string {
  const label = ADR_CLASSES[adrClass];
  if (!label) {
    return `Unknown ADR Class (${adrClass})`;
  }
  return label;
}
