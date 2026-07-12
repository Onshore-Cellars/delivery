// ─────────────────────────────────────────────────────────────────────────────
//  EU / UK VAT engine
//
//  Responsibilities:
//    1. Authoritative standard VAT rates for all 27 EU member states (+ GB).
//    2. VAT-number format validation (per-country) and live VIES verification.
//    3. Place-of-supply determination for a cross-border service supply:
//       domestic, intra-EU reverse charge, export (out of scope), or B2C.
//
//  Scope & honesty: this covers the standard B2B/B2C place-of-supply rules for
//  services (general rule, Art. 44/45 EU VAT Directive) plus domestic and
//  export cases — which is the overwhelming majority of a logistics
//  marketplace's transactions. It deliberately does NOT try to encode every
//  edge case (margin schemes, specific exemptions, the special B2C
//  transport-of-goods departure rule, distance-selling/OSS for goods). Those
//  are flagged in notes where relevant. Rates change over time — see
//  RATES_EFFECTIVE and keep this table maintained.
// ─────────────────────────────────────────────────────────────────────────────

/** Date the rate table below was last verified against published rates. */
export const RATES_EFFECTIVE = '2026-01-01'

// Standard VAT rates, verified for 2026. Reduced/super-reduced rates are out of
// scope here (a logistics service is taxed at the standard rate).
// NB: for VAT purposes Greece's country code is EL (not ISO GR), and Northern
// Ireland uses XI for goods.
export const EU_VAT: Record<string, { name: string; rate: number }> = {
  AT: { name: 'Austria', rate: 20 },
  BE: { name: 'Belgium', rate: 21 },
  BG: { name: 'Bulgaria', rate: 20 },
  HR: { name: 'Croatia', rate: 25 },
  CY: { name: 'Cyprus', rate: 19 },
  CZ: { name: 'Czech Republic', rate: 21 },
  DK: { name: 'Denmark', rate: 25 },
  EE: { name: 'Estonia', rate: 24 },   // rose 22→24 Jul 2025
  FI: { name: 'Finland', rate: 25.5 }, // rose 24→25.5 Sep 2024
  FR: { name: 'France', rate: 20 },
  DE: { name: 'Germany', rate: 19 },
  EL: { name: 'Greece', rate: 24 },    // VAT code EL, not GR
  HU: { name: 'Hungary', rate: 27 },
  IE: { name: 'Ireland', rate: 23 },
  IT: { name: 'Italy', rate: 22 },
  LV: { name: 'Latvia', rate: 21 },
  LT: { name: 'Lithuania', rate: 21 },
  LU: { name: 'Luxembourg', rate: 17 },
  MT: { name: 'Malta', rate: 18 },
  NL: { name: 'Netherlands', rate: 21 },
  PL: { name: 'Poland', rate: 23 },
  PT: { name: 'Portugal', rate: 23 },
  RO: { name: 'Romania', rate: 21 },   // rose 19→21 Aug 2025
  SK: { name: 'Slovakia', rate: 23 },  // rose 20→23 Jan 2025
  SI: { name: 'Slovenia', rate: 22 },
  ES: { name: 'Spain', rate: 21 },
  SE: { name: 'Sweden', rate: 25 },
}

// Non-EU rates we still need for domestic determination when the platform is
// established there.
const NON_EU_VAT: Record<string, { name: string; rate: number }> = {
  GB: { name: 'United Kingdom', rate: 20 },
}

export const EU_CODES = new Set(Object.keys(EU_VAT))

// ─── Country-code normalisation ──────────────────────────────────────────────
// Accepts ISO codes, VAT codes, or full country names and returns the VAT
// country code (EL for Greece). Returns null if unrecognised.
const NAME_TO_CODE: Record<string, string> = {
  ...Object.fromEntries(Object.entries(EU_VAT).map(([c, v]) => [v.name.toLowerCase(), c])),
  ...Object.fromEntries(Object.entries(NON_EU_VAT).map(([c, v]) => [v.name.toLowerCase(), c])),
  greece: 'EL', hellas: 'EL',
  'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  'czechia': 'CZ', 'the netherlands': 'NL', holland: 'NL', 'republic of ireland': 'IE',
}

export function toVatCountryCode(input: string | null | undefined): string | null {
  if (!input) return null
  const s = input.trim()
  if (!s) return null
  const upper = s.toUpperCase()
  if (upper === 'GR') return 'EL'       // ISO → VAT code for Greece
  if (EU_VAT[upper] || NON_EU_VAT[upper]) return upper
  const byName = NAME_TO_CODE[s.toLowerCase()]
  return byName || null
}

export function isEuVatCountry(input: string | null | undefined): boolean {
  const code = toVatCountryCode(input)
  return !!code && EU_CODES.has(code)
}

/** Standard VAT rate for a country (EU or GB), or null if unknown. */
export function standardRate(input: string | null | undefined): number | null {
  const code = toVatCountryCode(input)
  if (!code) return null
  return (EU_VAT[code] || NON_EU_VAT[code])?.rate ?? null
}

// ─── VAT-number format validation ────────────────────────────────────────────
// Per-country structural patterns (after stripping the 2-letter prefix). These
// catch typos before a VIES round-trip; VIES is the source of truth for
// *validity*. Patterns are the widely-used community set.
const VAT_PATTERNS: Record<string, RegExp> = {
  AT: /^U\d{8}$/,
  BE: /^0?\d{9}$/,
  BG: /^\d{9,10}$/,
  HR: /^\d{11}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-Z0-9]{2}\d{9}$/,
  GB: /^(\d{9}|\d{12}|(GD|HA)\d{3})$/,
  HU: /^\d{8}$/,
  IE: /^(\d{7}[A-W]|\d[A-Z*+]\d{5}[A-W]|\d{7}[A-W][AH])$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{12}$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
  XI: /^(\d{9}|\d{12}|(GD|HA)\d{3})$/, // Northern Ireland (goods)
}

export type VatNumberParts = { country: string; number: string; full: string }

/** Split a raw VAT number into its country prefix + body, normalised (upper, no spaces/punctuation). */
export function normaliseVatNumber(raw: string): VatNumberParts | null {
  if (!raw) return null
  const cleaned = raw.toUpperCase().replace(/[\s.\-_]/g, '')
  const m = cleaned.match(/^([A-Z]{2})(.+)$/)
  if (!m) return null
  let country = m[1]
  if (country === 'GR') country = 'EL'
  return { country, number: m[2], full: country + m[2] }
}

export type FormatResult = { valid: boolean; country: string | null; number: string | null; reason?: string }

/** Structural (offline) validation of a VAT number. */
export function validateVatFormat(raw: string): FormatResult {
  const parts = normaliseVatNumber(raw)
  if (!parts) return { valid: false, country: null, number: null, reason: 'Missing 2-letter country prefix' }
  const pattern = VAT_PATTERNS[parts.country]
  if (!pattern) return { valid: false, country: parts.country, number: parts.number, reason: `Unsupported country code ${parts.country}` }
  if (!pattern.test(parts.number)) return { valid: false, country: parts.country, number: parts.number, reason: 'Number does not match the expected format for ' + parts.country }
  return { valid: true, country: parts.country, number: parts.number }
}

// ─── VIES live verification ──────────────────────────────────────────────────
export type ViesResult = {
  valid: boolean
  country: string | null
  number: string | null
  name?: string | null
  address?: string | null
  checkedAt: string
  source: 'vies' | 'format' | 'unavailable'
  reason?: string
}

const VIES_ENDPOINT = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number'

/**
 * Verify a VAT number against the EU VIES service. Falls back gracefully:
 *   - invalid format            → { valid:false, source:'format' }
 *   - VIES down / GB / non-EU   → { valid:<format>, source:'unavailable' } (never blocks)
 *   - VIES answered             → { valid:<vies>, name, address, source:'vies' }
 */
export async function checkVatNumber(raw: string, timeoutMs = 6000): Promise<ViesResult> {
  const fmt = validateVatFormat(raw)
  const now = new Date().toISOString()
  if (!fmt.valid || !fmt.country || !fmt.number) {
    return { valid: false, country: fmt.country, number: fmt.number, checkedAt: now, source: 'format', reason: fmt.reason }
  }
  // VIES only covers EU member states (XI included). GB numbers can only be
  // format-checked here (HMRC has a separate service).
  if (!EU_CODES.has(fmt.country) && fmt.country !== 'XI') {
    return { valid: true, country: fmt.country, number: fmt.number, checkedAt: now, source: 'unavailable', reason: 'Live check not available for this country; format valid' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(VIES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ countryCode: fmt.country, vatNumber: fmt.number }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`VIES HTTP ${res.status}`)
    const data = await res.json() as Record<string, unknown>
    // The REST API returns `valid`; be defensive about `isValid` too.
    const valid = (data.valid ?? data.isValid) === true
    const clean = (v: unknown) => { const s = String(v ?? '').trim(); return s && s !== '---' ? s : null }
    return {
      valid,
      country: fmt.country,
      number: fmt.number,
      name: clean(data.name),
      address: clean(data.address),
      checkedAt: (data.requestDate as string) || now,
      source: 'vies',
    }
  } catch (err) {
    // Never let a VIES outage block a booking — fall back to the format result.
    return { valid: fmt.valid, country: fmt.country, number: fmt.number, checkedAt: now, source: 'unavailable', reason: 'VIES unavailable; format valid' }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Place-of-supply determination ───────────────────────────────────────────
export type VatTreatment =
  | 'DOMESTIC'            // charge supplier-country VAT
  | 'REVERSE_CHARGE'      // intra-EU B2B — customer self-accounts, 0% charged
  | 'B2C_EU'             // cross-border EU consumer — general rule, supplier-country VAT
  | 'ZERO_RATED_EXPORT'   // customer outside EU — out of scope of supplier VAT
  | 'OUT_OF_SCOPE'        // supplier not in a VAT area we handle
  | 'NOT_REGISTERED'      // supplier not VAT registered — no VAT

export type VatParty = {
  country: string | null
  vatNumber?: string | null
  vatValid?: boolean | null
  isBusiness?: boolean | null
}

export type VatDetermination = {
  treatment: VatTreatment
  ratePercent: number          // the rate applied to net (0 for reverse charge / export / unregistered)
  reverseCharge: boolean
  note: string                 // human-readable statement for the invoice
  legalRef: string | null      // the directive/article cited
  supplierCountry: string | null
  customerCountry: string | null
}

export type PlatformVatConfig = {
  country: string              // VAT country code where the platform is established
  vatNumber: string | null
  registered: boolean
}

/** Read platform VAT establishment from env (single place to configure). */
export function platformVatConfig(): PlatformVatConfig {
  const country = toVatCountryCode(process.env.PLATFORM_VAT_COUNTRY || 'GB') || 'GB'
  return {
    country,
    vatNumber: process.env.PLATFORM_VAT_NUMBER || null,
    // Registered unless explicitly turned off.
    registered: (process.env.PLATFORM_VAT_REGISTERED || 'true').toLowerCase() !== 'false',
  }
}

/**
 * Determine how VAT applies to a service supplied by `supplier` to `customer`.
 * The general place-of-supply rule for services is used (Art. 44 B2B / Art. 45
 * B2C EU VAT Directive). Treats a customer with a valid VAT number as a
 * business (B2B).
 *
 * `opts.departureCountry` enables the transport-of-goods special rule: for a
 * B2C intra-EU transport of goods, the place of supply is the country of
 * DEPARTURE (Art. 50), not the supplier's country. Pass the shipment's origin
 * country to apply it.
 */
export function determineVat(
  supplier: VatParty & { registered?: boolean },
  customer: VatParty,
  opts?: { departureCountry?: string | null },
): VatDetermination {
  const supplierCountry = toVatCountryCode(supplier.country)
  const customerCountry = toVatCountryCode(customer.country)
  const departureCountry = toVatCountryCode(opts?.departureCountry)
  const base = { supplierCountry, customerCountry }

  // Art. 50 — intra-EU transport of goods to a consumer is taxed where the
  // transport begins. Only applies when departure is an EU member state.
  const b2cTransport = (): VatDetermination | null => {
    if (departureCountry && EU_CODES.has(departureCountry)) {
      return { treatment: 'B2C_EU', ratePercent: standardRate(departureCountry) ?? 0, reverseCharge: false,
        note: `Intra-EU transport of goods for a consumer — taxed in the country of departure (${departureCountry} VAT).`,
        legalRef: 'Art. 50 EU VAT Directive 2006/112/EC', ...base }
    }
    return null
  }

  if (supplier.registered === false) {
    return { treatment: 'NOT_REGISTERED', ratePercent: 0, reverseCharge: false,
      note: 'Onshore is not VAT registered — no VAT has been charged.', legalRef: null, ...base }
  }
  if (!supplierCountry || (!EU_CODES.has(supplierCountry) && !NON_EU_VAT[supplierCountry])) {
    return { treatment: 'OUT_OF_SCOPE', ratePercent: 0, reverseCharge: false,
      note: 'VAT not determined — supplier country not configured.', legalRef: null, ...base }
  }

  const supplierEU = EU_CODES.has(supplierCountry)
  const customerEU = !!customerCountry && EU_CODES.has(customerCountry)
  const sameCountry = !!customerCountry && supplierCountry === customerCountry
  // Reverse charge (and B2B treatment) requires a *positively verified* VAT
  // number — a present number that VIES confirmed valid (vatValid === true).
  // Anything less (unverified during a VIES outage, format-only, missing, or a
  // bare isBusiness flag) is treated as B2C and CHARGED VAT. This fails safe:
  // relying on Art. 196 with an unverified customer VAT ID would leave the
  // supplier liable for the uncollected VAT.
  const customerHasVerifiedVat = !!customer.vatNumber && customer.vatValid === true
  // A B2C transport-of-goods caveat we surface but do not auto-encode.
  const B2C_TRANSPORT_CAVEAT = ' Note: intra-EU transport of goods to a consumer may instead be taxable in the country of departure (Art. 50) — review if applicable.'

  // 1) Domestic — same country (works for GB→GB and EU→same-EU).
  if (sameCountry) {
    return { treatment: 'DOMESTIC', ratePercent: standardRate(supplierCountry) ?? 0, reverseCharge: false,
      note: `Domestic supply — ${supplierCountry} VAT applied.`,
      legalRef: 'Arts. 44–45 EU VAT Directive 2006/112/EC', ...base }
  }

  // 2) Supplier in the EU.
  if (supplierEU) {
    // Customer outside the EU — export of services, outside scope.
    if (!customerEU) {
      return { treatment: 'ZERO_RATED_EXPORT', ratePercent: 0, reverseCharge: false,
        note: 'Outside the scope of EU VAT — customer established outside the EU.',
        legalRef: 'Art. 44 / 59 EU VAT Directive 2006/112/EC', ...base }
    }
    if (customerHasVerifiedVat) {
      return { treatment: 'REVERSE_CHARGE', ratePercent: 0, reverseCharge: true,
        note: 'Reverse charge — VAT to be accounted for by the customer (intra-EU B2B service).',
        legalRef: 'Art. 196 EU VAT Directive 2006/112/EC', ...base }
    }
    // Cross-border EU consumer. For transport of goods the place of supply is
    // the departure country (Art. 50); otherwise the general rule (supplier).
    return b2cTransport() || { treatment: 'B2C_EU', ratePercent: standardRate(supplierCountry) ?? 0, reverseCharge: false,
      note: `Supplied to an EU consumer — ${supplierCountry} VAT applied (general place-of-supply rule).${B2C_TRANSPORT_CAVEAT}`,
      legalRef: 'Art. 45 EU VAT Directive 2006/112/EC', ...base }
  }

  // 3) Supplier outside the EU (e.g. GB, post-Brexit). Domestic handled above.
  //    - Customer outside the EU → outside the supplier's VAT scope.
  //    - EU business (verified VAT) → outside supplier scope; customer reverse
  //      charges in their own country.
  //    - EU consumer → general rule places supply in the supplier's country, so
  //      supplier-country VAT IS charged (e.g. GB→EU consumer = 20% UK VAT).
  if (!customerEU) {
    return { treatment: 'ZERO_RATED_EXPORT', ratePercent: 0, reverseCharge: false,
      note: `Outside the scope of ${supplierCountry} VAT — cross-border supply of services.`,
      legalRef: null, ...base }
  }
  if (customerHasVerifiedVat) {
    return { treatment: 'REVERSE_CHARGE', ratePercent: 0, reverseCharge: true,
      note: `Outside the scope of ${supplierCountry} VAT — reverse charge applies in the customer's country.`,
      legalRef: 'Customer to self-account under Art. 196 EU VAT Directive', ...base }
  }
  // Non-EU (e.g. GB) supplier → EU consumer. Intra-EU transport of goods is
  // taxed in the EU country of departure (Art. 50 — the supplier may need to
  // register there); otherwise supplier-country VAT under the general rule.
  return b2cTransport() || { treatment: 'DOMESTIC', ratePercent: standardRate(supplierCountry) ?? 0, reverseCharge: false,
    note: `Supplied to an EU consumer — ${supplierCountry} VAT applied (general place-of-supply rule).${B2C_TRANSPORT_CAVEAT}`,
    legalRef: null, ...base }
}

/** Round-half-up VAT on a net amount at a percentage rate. */
export function calcVat(net: number, ratePercent: number): { net: number; vat: number; gross: number; ratePercent: number } {
  const vat = Math.round(net * (ratePercent / 100) * 100) / 100
  return { net: Math.round(net * 100) / 100, vat, gross: Math.round((net + vat) * 100) / 100, ratePercent }
}

export type BookingVatSnapshot = {
  treatment: VatTreatment
  vatRate: number
  vatAmount: number
  net: number
  gross: number
  note: string
  legalRef: string | null
  vatSupplierNumber: string | null
  vatCustomerNumber: string | null
  vatCustomerCountry: string | null
}

/**
 * Compute the VAT to apply to a booking, from the platform's establishment
 * (supplier) to the customer, and return a snapshot to persist. `net` is the
 * VAT-exclusive service value (the current booking.totalPrice basis).
 */
export function snapshotBookingVat(
  net: number,
  customer: { country: string | null; vatNumber?: string | null; vatValid?: boolean | null; isBusiness?: boolean | null },
  opts?: { departureCountry?: string | null },
): BookingVatSnapshot {
  const platform = platformVatConfig()
  // When the customer has a verified VAT number, trust the country encoded in
  // that number (VIES-validated) over the self-editable profile country — this
  // stops a customer forcing reverse charge / export by mistyping their country.
  const verifiedVatCountry = customer.vatNumber && customer.vatValid === true
    ? normaliseVatNumber(customer.vatNumber)?.country ?? null
    : null
  const det = determineVat(
    { country: platform.country, vatNumber: platform.vatNumber, registered: platform.registered },
    { ...customer, country: verifiedVatCountry || customer.country },
    { departureCountry: opts?.departureCountry },
  )
  const { vat, gross } = calcVat(net, det.ratePercent)
  return {
    treatment: det.treatment,
    vatRate: det.ratePercent,
    vatAmount: vat,
    net: Math.round(net * 100) / 100,
    gross,
    note: det.note,
    legalRef: det.legalRef,
    vatSupplierNumber: platform.vatNumber,
    vatCustomerNumber: customer.vatNumber ?? null,
    // Record the country actually used for the determination (the verified
    // VAT-number country when available, else the profile country).
    vatCustomerCountry: verifiedVatCountry || toVatCountryCode(customer.country),
  }
}
