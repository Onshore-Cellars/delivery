import { describe, it, expect, vi } from 'vitest'

// lib/invoice pulls in prisma + stripe; stub them so we can unit-test the pure
// model/auth logic without a database.
vi.mock('@/lib/prisma', () => ({ default: { booking: {} } }))
vi.mock('@/lib/stripe', () => ({
  currencySymbol: (c: string) => (c === 'GBP' ? '£' : c === 'USD' ? '$' : '€'),
}))

import { buildInvoiceModel, resolveInvoiceViewer } from '@/lib/invoice'
import { generateInvoiceToken, generateToken } from '@/lib/auth'

const booking = (over: Record<string, unknown> = {}): any => ({
  id: 'ckbooking0001abcd4f9a2c71',
  invoiceNumber: 'OD-2026-4F9A2C71', invoiceIssuedAt: new Date('2026-07-10'),
  createdAt: new Date('2026-07-09'), paidAt: new Date('2026-07-10'), currency: 'EUR',
  totalPrice: 1450, platformFee: 145, carrierPayout: 1305, paymentStatus: 'PAID', status: 'DELIVERED',
  trackingCode: 'OD-QA12345', cargoDescription: 'Teak panels', cargoType: 'Fragile', specialHandling: null,
  weightKg: 320, volumeM3: 2.4, itemCount: 6, actualDelivery: new Date('2026-07-11'),
  podNotes: null, podSignature: null, podPhotoUrl: null, podRecipientName: null,
  stripeTransferId: 'tr_1', payoutTransferredAt: new Date('2026-07-11'),
  listing: {
    originPort: 'Southampton', destinationPort: 'Antibes', vehicleType: 'Van', vehicleName: null,
    departureDate: new Date('2026-07-09'), estimatedArrival: new Date('2026-07-11'),
    carrier: { id: 'carrier1', name: 'Jon', email: 'jon@c.eu', company: 'Blue Wake', phone: null, address: null, city: 'Lyon', country: 'France' },
  },
  shipper: { id: 'shipper1', name: 'Ella', email: 'ella@y.com', company: 'Riviera', phone: null, address: null, city: 'Soton', country: 'UK' },
  ...over,
})

describe('buildInvoiceModel — shipper invoice', () => {
  it('breaks the charge into transport + fee that sum to the total paid', () => {
    const m = buildInvoiceModel(booking(), 'shipper')
    expect(m.kind).toBe('INVOICE')
    const sum = m.lines.reduce((s, l) => s + l.amount, 0)
    expect(sum).toBeCloseTo(m.total, 2)      // 1305 + 145 === 1450
    expect(m.total).toBe(1450)
    expect(m.feePercent).toBe(10)
    expect(m.billedTo.name).toBe('Riviera') // billed to the shipper
  })
})

describe('buildInvoiceModel — carrier remittance', () => {
  it('nets gross minus commission to the payout', () => {
    const m = buildInvoiceModel(booking(), 'carrier')
    expect(m.kind).toBe('REMITTANCE')
    expect(m.total).toBe(1305)               // net payout
    const gross = m.lines.find(l => !l.negative)!.amount
    const commission = m.lines.find(l => l.negative)!.amount
    expect(gross - commission).toBeCloseTo(m.total, 2) // 1450 - 145 === 1305
    expect(m.billedTo.name).toBe('Blue Wake') // payable to the carrier
    expect(m.payoutReference).toBe('tr_1')
  })
})

describe('resolveInvoiceViewer', () => {
  const b = booking()
  it('gives the shipper an invoice and the carrier a remittance from their session tokens', () => {
    const shipperTok = generateToken({ userId: 'shipper1', email: 'ella@y.com', role: 'USER' })
    const carrierTok = generateToken({ userId: 'carrier1', email: 'jon@c.eu', role: 'USER' })
    expect(resolveInvoiceViewer(`Bearer ${shipperTok}`, null, b, null)).toBe('shipper')
    expect(resolveInvoiceViewer(`Bearer ${carrierTok}`, null, b, null)).toBe('carrier')
  })

  it('honours a scoped invoice token and pins it to the right booking + viewpoint', () => {
    const tok = generateInvoiceToken(b.id, 'carrier')
    expect(resolveInvoiceViewer(null, tok, b, null)).toBe('carrier')
    // a token minted for a different booking must not unlock this one
    const other = generateInvoiceToken('someotherbooking', 'shipper')
    expect(resolveInvoiceViewer(null, other, b, null)).toBeNull()
  })

  it('rejects strangers and missing tokens', () => {
    const strangerTok = generateToken({ userId: 'nobody', email: 'no@x.com', role: 'USER' })
    expect(resolveInvoiceViewer(`Bearer ${strangerTok}`, null, b, null)).toBeNull()
    expect(resolveInvoiceViewer(null, null, b, null)).toBeNull()
    expect(resolveInvoiceViewer(null, 'garbage.token.value', b, null)).toBeNull()
  })

  it('lets an admin force either document with ?doc=', () => {
    const adminTok = generateToken({ userId: 'admin1', email: 'a@x.com', role: 'ADMIN' })
    expect(resolveInvoiceViewer(`Bearer ${adminTok}`, null, b, 'remittance')).toBe('carrier')
    expect(resolveInvoiceViewer(`Bearer ${adminTok}`, null, b, null)).toBe('admin')
  })
})
