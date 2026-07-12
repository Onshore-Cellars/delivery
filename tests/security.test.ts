import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { getClientIP } from '@/lib/rate-limit'
import { generateToken, verifyToken } from '@/lib/auth'
import { checkMessageForPII } from '@/lib/pii-filter'

// Minimal NextRequest stub exposing only what getClientIP reads.
function reqWith(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest
}

describe('getClientIP — trusted-hop derivation', () => {
  const prev = process.env.TRUSTED_PROXY_COUNT
  afterEach(() => { process.env.TRUSTED_PROXY_COUNT = prev })

  it('prefers the platform-set x-real-ip', () => {
    const ip = getClientIP(reqWith({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' }))
    expect(ip).toBe('203.0.113.7')
  })

  it('does NOT trust the forgeable leftmost X-Forwarded-For entry', () => {
    // Attacker prepends a spoofed IP; real client appended by our proxy is rightmost.
    const ip = getClientIP(reqWith({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }))
    expect(ip).toBe('203.0.113.9')
    expect(ip).not.toBe('6.6.6.6')
  })

  it('respects TRUSTED_PROXY_COUNT for multiple proxy hops', () => {
    process.env.TRUSTED_PROXY_COUNT = '2'
    const ip = getClientIP(reqWith({ 'x-forwarded-for': 'spoof, 203.0.113.5, 10.0.0.1' }))
    expect(ip).toBe('203.0.113.5')
  })

  it('falls back to "unknown" with no headers', () => {
    expect(getClientIP(reqWith({}))).toBe('unknown')
  })
})

describe('JWT sign/verify', () => {
  it('round-trips a payload', () => {
    const token = generateToken({ userId: 'u1', email: 'a@b.com', role: 'CARRIER' })
    const decoded = verifyToken(token)
    expect(decoded?.userId).toBe('u1')
    expect(decoded?.role).toBe('CARRIER')
  })

  it('rejects a tampered token', () => {
    const token = generateToken({ userId: 'u1', email: 'a@b.com', role: 'SHIPPER' })
    const tampered = token.slice(0, -3) + 'xyz'
    expect(verifyToken(tampered)).toBeNull()
  })

  it('rejects garbage', () => {
    expect(verifyToken('not-a-jwt')).toBeNull()
  })
})

describe('PII / circumvention filter', () => {
  it('blocks email addresses', () => {
    expect(checkMessageForPII('reach me at bob@example.com').blocked).toBe(true)
  })
  it('blocks phone numbers', () => {
    expect(checkMessageForPII('call 07911 123456 to arrange').blocked).toBe(true)
  })
  it('blocks URLs', () => {
    expect(checkMessageForPII('see https://wa.me/44123 for details').blocked).toBe(true)
  })
  it('allows a normal operational message', () => {
    const res = checkMessageForPII('The cargo is 3 boxes, please deliver to the marina office.')
    expect(res.blocked).toBe(false)
  })
})
