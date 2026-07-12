import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
const findUnique = vi.fn()
const update = vi.fn(() => Promise.resolve({}))
vi.mock('@/lib/prisma', () => ({
  default: { booking: { findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => update(...a) } },
}))

const createTransfer = vi.fn(() => Promise.resolve({ id: 'tr_test' }))
const reverseTransfer = vi.fn(() => Promise.resolve({ id: 'trr_test' }))
vi.mock('@/lib/stripe', () => ({
  createTransfer: (...a: unknown[]) => createTransfer(...a),
  reverseTransfer: (...a: unknown[]) => reverseTransfer(...a),
  currencySymbol: () => '€',
  calculateCarrierPayout: (n: number) => Math.round(n * 0.9 * 100) / 100,
}))
vi.mock('@/lib/notifications', () => ({ createNotification: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/email', () => ({ carrierPayoutEmail: vi.fn(() => ({ subject: '', html: '', text: '' })) }))
vi.mock('@/lib/email-queue', () => ({ queueEmail: vi.fn(() => Promise.resolve()) }))

import { releaseCarrierPayout, reverseCarrierPayout } from '@/lib/payout'

const paidBooking = (over: Record<string, unknown> = {}) => ({
  id: 'b1', paymentStatus: 'PAID', payoutTransferredAt: null,
  carrierPayout: 90, totalPrice: 100, platformFee: 10, currency: 'EUR', trackingCode: 'OD-1',
  listing: { carrierId: 'c1', carrier: { stripeAccountId: 'acct_1', name: 'Carrier', email: 'c@x.com' } },
  ...over,
})

beforeEach(() => { vi.clearAllMocks() })

describe('releaseCarrierPayout', () => {
  it('transfers the carrier payout and records the transfer when eligible', async () => {
    findUnique.mockResolvedValue(paidBooking())
    await releaseCarrierPayout('b1')
    expect(createTransfer).toHaveBeenCalledOnce()
    expect(createTransfer.mock.calls[0][0]).toMatchObject({ amount: 90, destination: 'acct_1', bookingId: 'b1' })
    expect(update).toHaveBeenCalledOnce()
    expect(update.mock.calls[0][0].data).toMatchObject({ stripeTransferId: 'tr_test' })
  })

  it('is idempotent — does nothing if already paid out', async () => {
    findUnique.mockResolvedValue(paidBooking({ payoutTransferredAt: new Date() }))
    await releaseCarrierPayout('b1')
    expect(createTransfer).not.toHaveBeenCalled()
  })

  it('does not pay out unpaid bookings', async () => {
    findUnique.mockResolvedValue(paidBooking({ paymentStatus: 'PROCESSING' }))
    await releaseCarrierPayout('b1')
    expect(createTransfer).not.toHaveBeenCalled()
  })

  it('leaves the payout pending if the carrier has not onboarded Stripe Connect', async () => {
    findUnique.mockResolvedValue(paidBooking({ listing: { carrierId: 'c1', carrier: { stripeAccountId: null, name: 'C', email: 'c@x.com' } } }))
    await releaseCarrierPayout('b1')
    expect(createTransfer).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})

describe('reverseCarrierPayout', () => {
  it('no-ops when the payout was never transferred (pre-delivery refund)', async () => {
    findUnique.mockResolvedValue({ stripeTransferId: null, payoutTransferredAt: null, carrierPayout: 90 })
    await reverseCarrierPayout('b1', 100)
    expect(reverseTransfer).not.toHaveBeenCalled()
  })

  it('reverses the transfer, clamped to the carrier payout', async () => {
    findUnique.mockResolvedValue({ stripeTransferId: 'tr_test', payoutTransferredAt: new Date(), carrierPayout: 90 })
    await reverseCarrierPayout('b1', 100) // refund exceeds payout → clamp to 90
    expect(reverseTransfer).toHaveBeenCalledWith('tr_test', 90)
  })
})
