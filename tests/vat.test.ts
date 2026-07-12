import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  standardRate, toVatCountryCode, isEuVatCountry, validateVatFormat, normaliseVatNumber,
  determineVat, calcVat, snapshotBookingVat, EU_VAT,
} from '@/lib/vat'

describe('rates & country codes', () => {
  it('has all 27 EU member states with plausible standard rates', () => {
    expect(Object.keys(EU_VAT)).toHaveLength(27)
    for (const [code, v] of Object.entries(EU_VAT)) {
      expect(v.rate, code).toBeGreaterThanOrEqual(15) // EU minimum
      expect(v.rate, code).toBeLessThanOrEqual(27)
    }
  })
  it('uses the 2026 figures that recently changed', () => {
    expect(EU_VAT.EE.rate).toBe(24)   // Estonia
    expect(EU_VAT.FI.rate).toBe(25.5) // Finland
    expect(EU_VAT.RO.rate).toBe(21)   // Romania
    expect(EU_VAT.SK.rate).toBe(23)   // Slovakia
    expect(EU_VAT.LU.rate).toBe(17)   // Luxembourg (lowest)
    expect(EU_VAT.HU.rate).toBe(27)   // Hungary (highest)
  })
  it('normalises names and the Greece EL/GR alias', () => {
    expect(toVatCountryCode('France')).toBe('FR')
    expect(toVatCountryCode('fr')).toBe('FR')
    expect(toVatCountryCode('GR')).toBe('EL')   // ISO → VAT code
    expect(toVatCountryCode('Greece')).toBe('EL')
    expect(standardRate('Greece')).toBe(24)
    expect(toVatCountryCode('United Kingdom')).toBe('GB')
    expect(standardRate('GB')).toBe(20)
    expect(isEuVatCountry('GB')).toBe(false)
    expect(isEuVatCountry('DE')).toBe(true)
  })
})

describe('VAT number format validation', () => {
  it('accepts well-formed numbers and splits the prefix', () => {
    expect(validateVatFormat('FR40303265045').valid).toBe(true)
    expect(validateVatFormat('DE 811 569 869').valid).toBe(true) // spaces stripped
    expect(normaliseVatNumber('nl123456789b01')?.full).toBe('NL123456789B01')
    expect(normaliseVatNumber('EL 090145420')?.country).toBe('EL')
  })
  it('rejects malformed numbers', () => {
    expect(validateVatFormat('12345').valid).toBe(false)              // no prefix
    expect(validateVatFormat('DE12').valid).toBe(false)              // too short
    expect(validateVatFormat('ZZ123456789').valid).toBe(false)       // unknown country
  })
})

describe('calcVat', () => {
  it('rounds VAT to the cent and grosses up', () => {
    expect(calcVat(100, 20)).toEqual({ net: 100, vat: 20, gross: 120, ratePercent: 20 })
    expect(calcVat(1305, 20)).toEqual({ net: 1305, vat: 261, gross: 1566, ratePercent: 20 })
    expect(calcVat(99.99, 21).vat).toBeCloseTo(21.0, 2)
  })
})

describe('determineVat — place of supply', () => {
  const registered = { registered: true }
  it('domestic: supplier and customer in the same country → local rate', () => {
    const d = determineVat({ country: 'FR', ...registered }, { country: 'FR' })
    expect(d.treatment).toBe('DOMESTIC')
    expect(d.ratePercent).toBe(20)
    expect(d.reverseCharge).toBe(false)
  })
  it('intra-EU B2B with a VERIFIED VAT number → reverse charge, 0%', () => {
    const d = determineVat({ country: 'FR', ...registered }, { country: 'DE', vatNumber: 'DE811569869', vatValid: true })
    expect(d.treatment).toBe('REVERSE_CHARGE')
    expect(d.ratePercent).toBe(0)
    expect(d.reverseCharge).toBe(true)
    expect(d.legalRef).toMatch(/196/)
  })
  it('intra-EU with an UNVERIFIED or invalid VAT number → charges VAT (fail-safe, no reverse charge)', () => {
    // vatValid null (VIES down / never checked) must NOT grant reverse charge
    const unverified = determineVat({ country: 'FR', ...registered }, { country: 'DE', vatNumber: 'DE811569869', vatValid: null })
    expect(unverified.treatment).toBe('B2C_EU')
    expect(unverified.ratePercent).toBe(20)
    // an explicitly-invalid number likewise gets charged VAT
    const invalid = determineVat({ country: 'FR', ...registered }, { country: 'DE', vatNumber: 'DEbogus', vatValid: false })
    expect(invalid.reverseCharge).toBe(false)
    // a bare isBusiness flag with no VAT number must NOT grant reverse charge
    const flagged = determineVat({ country: 'FR', ...registered }, { country: 'DE', isBusiness: true })
    expect(flagged.reverseCharge).toBe(false)
    expect(flagged.ratePercent).toBe(20)
  })
  it('intra-EU B2C (no VAT number) → supplier-country rate', () => {
    const d = determineVat({ country: 'FR', ...registered }, { country: 'DE' })
    expect(d.treatment).toBe('B2C_EU')
    expect(d.ratePercent).toBe(20) // France (supplier) rate under the general rule
  })
  it('EU supplier, non-EU customer → out of scope (export)', () => {
    const d = determineVat({ country: 'FR', ...registered }, { country: 'US' })
    expect(d.treatment).toBe('ZERO_RATED_EXPORT')
    expect(d.ratePercent).toBe(0)
  })
  it('GB supplier → GB domestic charges 20%, EU B2B is reverse charge', () => {
    expect(determineVat({ country: 'GB', ...registered }, { country: 'GB' }).ratePercent).toBe(20)
    const eu = determineVat({ country: 'GB', ...registered }, { country: 'IE', vatNumber: 'IE1234567X', vatValid: true })
    expect(eu.treatment).toBe('REVERSE_CHARGE')
    expect(eu.ratePercent).toBe(0)
  })
  it('GB supplier → EU CONSUMER charges 20% UK VAT (general rule), not 0%', () => {
    const d = determineVat({ country: 'GB', ...registered }, { country: 'DE' }) // no VAT number = consumer
    expect(d.ratePercent).toBe(20)          // regression: was wrongly 0% (export)
    expect(d.treatment).not.toBe('ZERO_RATED_EXPORT')
  })
  it('GB supplier → non-EU customer is out of scope', () => {
    expect(determineVat({ country: 'GB', ...registered }, { country: 'US' }).ratePercent).toBe(0)
  })
  it('Art. 50: intra-EU B2C transport of goods is taxed in the departure country', () => {
    // FR supplier, DE consumer, goods departing from Italy → charge IT VAT (22%)
    const d = determineVat({ country: 'FR', ...registered }, { country: 'DE' }, { departureCountry: 'IT' })
    expect(d.ratePercent).toBe(22)              // Italy, not France (20) or Germany
    expect(d.legalRef).toMatch(/50/)
    // GB supplier, EU consumer, goods departing from Spain → charge ES VAT (21%)
    const gb = determineVat({ country: 'GB', ...registered }, { country: 'FR' }, { departureCountry: 'ES' })
    expect(gb.ratePercent).toBe(21)
    // A verified B2B customer is still reverse charge regardless of departure
    const b2b = determineVat({ country: 'FR', ...registered }, { country: 'DE', vatNumber: 'DE811569869', vatValid: true }, { departureCountry: 'IT' })
    expect(b2b.treatment).toBe('REVERSE_CHARGE')
    // Non-EU departure (GB) does not trigger Art. 50 — falls back to general rule
    const nonEuDep = determineVat({ country: 'FR', ...registered }, { country: 'DE' }, { departureCountry: 'GB' })
    expect(nonEuDep.ratePercent).toBe(20)       // France (supplier) general rule
  })
  it('unregistered supplier → never charges VAT', () => {
    const d = determineVat({ country: 'FR', registered: false }, { country: 'FR' })
    expect(d.treatment).toBe('NOT_REGISTERED')
    expect(d.ratePercent).toBe(0)
  })
})

describe('snapshotBookingVat (platform config from env)', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('charges domestic VAT for a same-country consumer', () => {
    process.env.PLATFORM_VAT_COUNTRY = 'FR'
    process.env.PLATFORM_VAT_REGISTERED = 'true'
    const s = snapshotBookingVat(1000, { country: 'FR' })
    expect(s.treatment).toBe('DOMESTIC')
    expect(s.vatRate).toBe(20)
    expect(s.vatAmount).toBe(200)
    expect(s.gross).toBe(1200)
  })
  it('adds no VAT for an intra-EU business (reverse charge)', () => {
    process.env.PLATFORM_VAT_COUNTRY = 'FR'
    const s = snapshotBookingVat(1000, { country: 'DE', vatNumber: 'DE811569869', vatValid: true })
    expect(s.treatment).toBe('REVERSE_CHARGE')
    expect(s.vatAmount).toBe(0)
    expect(s.gross).toBe(1000)
    expect(s.vatCustomerCountry).toBe('DE')
  })
  it('does NOT let an unverified VAT number escape VAT (fail-safe)', () => {
    process.env.PLATFORM_VAT_COUNTRY = 'FR'
    // number provided but never VIES-verified (vatValid null) → still charged VAT
    const s = snapshotBookingVat(1000, { country: 'DE', vatNumber: 'DE811569869', vatValid: null })
    expect(s.vatAmount).toBe(200)
    expect(s.treatment).toBe('B2C_EU')
  })
  it('trusts the verified VAT-number country over a spoofed profile country', () => {
    process.env.PLATFORM_VAT_COUNTRY = 'FR'
    // customer claims to be in the US (to dodge VAT) but has a VERIFIED DE VAT number
    const s = snapshotBookingVat(1000, { country: 'US', vatNumber: 'DE811569869', vatValid: true })
    expect(s.treatment).toBe('REVERSE_CHARGE') // resolved as intra-EU B2B, not export
    expect(s.vatCustomerCountry).toBe('DE')
  })
})
