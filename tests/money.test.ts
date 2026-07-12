import { describe, it, expect } from 'vitest'
import {
  calculatePlatformFee,
  calculateCarrierPayout,
  currencySymbol,
} from '@/lib/stripe'
import { estimateInsurance } from '@/lib/insurance'

describe('platform fee / carrier payout math', () => {
  it('takes a 10% platform fee', () => {
    expect(calculatePlatformFee(100)).toBe(10)
    expect(calculatePlatformFee(1000)).toBe(100)
    expect(calculatePlatformFee(0)).toBe(0)
  })

  it('pays the carrier the remaining 90%', () => {
    expect(calculateCarrierPayout(100)).toBe(90)
    expect(calculateCarrierPayout(1000)).toBe(900)
  })

  it('fee + payout always reconciles to the gross amount', () => {
    for (const amount of [0, 12.34, 99.99, 250, 1000.5, 4823.17]) {
      const sum = calculatePlatformFee(amount) + calculateCarrierPayout(amount)
      // allow for rounding to the cent
      expect(Math.abs(sum - amount)).toBeLessThanOrEqual(0.01)
    }
  })

  it('rounds fees to the cent (no fractional pennies)', () => {
    const fee = calculatePlatformFee(33.33)
    expect(fee).toBe(Math.round(fee * 100) / 100)
  })
})

describe('currencySymbol', () => {
  it('maps supported currencies', () => {
    expect(currencySymbol('EUR')).toBe('€')
    expect(currencySymbol('GBP')).toBe('£')
    expect(currencySymbol('USD')).toBe('$')
  })
  it('is case-insensitive', () => {
    expect(currencySymbol('gbp')).toBe('£')
  })
  it('falls back to euro for unknown/empty', () => {
    expect(currencySymbol('')).toBe('€')
    expect(currencySymbol(null)).toBe('€')
    expect(currencySymbol(undefined)).toBe('€')
    expect(currencySymbol('JPY')).toBe('€')
  })
})

describe('insurance premium estimate', () => {
  it('never quotes below the £25 minimum', () => {
    const quotes = estimateInsurance(10, 'general', false)
    for (const q of quotes) expect(q.premiumGBP).toBeGreaterThanOrEqual(25)
  })

  it('applies the cross-border surcharge (dearer than domestic)', () => {
    const domestic = estimateInsurance(100000, 'general', false)
    const crossBorder = estimateInsurance(100000, 'general', true)
    // At a high declared value the minimum floor is not binding, so the
    // cross-border surcharge must make every tier at least as expensive.
    for (let i = 0; i < domestic.length; i++) {
      expect(crossBorder[i].premiumGBP).toBeGreaterThan(domestic[i].premiumGBP)
    }
  })
})
