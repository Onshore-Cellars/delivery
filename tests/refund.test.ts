import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
const findUnique = vi.fn()
const updateMany = vi.fn(() => Promise.resolve({ count: 1 }))
const update = vi.fn(() => Promise.resolve({}))
vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findUnique: (...a: any[]) => (findUnique as any)(...a),
      updateMany: (...a: any[]) => (updateMany as any)(...a),
      update: (...a: any[]) => (update as any)(...a),
    },
    listing: { update: vi.fn(() => Promise.resolve({})) },
  },
}))

const createRefund = vi.fn(() => Promise.resolve({ id: 're_test' }))
vi.mock('@/lib/stripe', () => ({ createRefund: (...a: any[]) => (createRefund as any)(...a) }))

const reverseCarrierPayout = vi.fn(() => Promise.resolve())
vi.mock('@/lib/payout', async () => {
  const actual = await vi.importActual<any>('@/lib/payout')
  return { reverseCarrierPayout: (...a: any[]) => (reverseCarrierPayout as any)(...a), carrierRefundShare: actual.carrierRefundShare }
})

import { processRefund } from '@/lib/refund'

// net 1000 + VAT 200 = gross 1200; carrier payout 900
const booking = (over: Record<string, unknown> = {}) => ({
  id: 'b1', totalPrice: 1000, vatAmount: 200, carrierPayout: 900,
  paymentStatus: 'PAID', stripePaymentIntentId: 'pi_1', refundedAmount: 0,
  routeDirection: null, weightKg: 10, volumeM3: 1, listingId: 'l1', ...over,
})

beforeEach(() => {
  findUnique.mockReset(); updateMany.mockReset(); update.mockReset(); createRefund.mockReset(); reverseCarrierPayout.mockReset()
  updateMany.mockResolvedValue({ count: 1 }); update.mockResolvedValue({}); createRefund.mockResolvedValue({ id: 're_test' }); reverseCarrierPayout.mockResolvedValue(undefined)
})

describe('processRefund', () => {
  it('full refund → REFUNDED, full Stripe refund, full payout reversal', async () => {
    findUnique.mockResolvedValue(booking())
    const r = await processRefund('b1') // no amount = full remaining
    expect(r.ok).toBe(true)
    if (r.ok) { expect(r.fullyRefunded).toBe(true); expect(r.refundAmount).toBe(1200) }
    // claim writes REFUNDED + refundedAmount 1200
    expect((updateMany.mock.calls[0] as any[])[0].data).toMatchObject({ paymentStatus: 'REFUNDED', refundedAmount: 1200 })
    // Stripe called with undefined amount (full) + an idempotency key
    const [, amount, opts] = (createRefund.mock.calls[0] as any[])
    expect(amount).toBeUndefined()
    expect(opts.idempotencyKey).toContain('refund:b1:')
    // full payout reversal → undefined
    expect((reverseCarrierPayout.mock.calls[0] as any[])[1]).toBeUndefined()
  })

  it('partial refund → PARTIALLY_REFUNDED, tracks refundedAmount, proportional payout claw', async () => {
    findUnique.mockResolvedValue(booking())
    const r = await processRefund('b1', 600) // half the gross
    expect(r.ok).toBe(true)
    if (r.ok) { expect(r.fullyRefunded).toBe(false); expect(r.cumulativeRefunded).toBe(600) }
    expect((updateMany.mock.calls[0] as any[])[0].data).toMatchObject({ paymentStatus: 'PARTIALLY_REFUNDED', refundedAmount: 600 })
    // carrier claw = 600 * 900/1200 = 450
    expect((reverseCarrierPayout.mock.calls[0] as any[])[1]).toBe(450)
  })

  it('a second partial that reaches gross completes the refund (REFUNDED)', async () => {
    findUnique.mockResolvedValue(booking({ paymentStatus: 'PARTIALLY_REFUNDED', refundedAmount: 600 }))
    const r = await processRefund('b1', 600)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.fullyRefunded).toBe(true)
    expect((updateMany.mock.calls[0] as any[])[0].data).toMatchObject({ paymentStatus: 'REFUNDED', refundedAmount: 1200 })
  })

  it('rejects an amount exceeding the remaining balance', async () => {
    findUnique.mockResolvedValue(booking({ refundedAmount: 1000 })) // 200 remaining
    const r = await processRefund('b1', 500)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
    expect(createRefund).not.toHaveBeenCalled()
  })

  it('refuses a non-refundable booking', async () => {
    findUnique.mockResolvedValue(booking({ paymentStatus: 'PENDING' }))
    const r = await processRefund('b1', 100)
    expect(r.ok).toBe(false)
    expect(createRefund).not.toHaveBeenCalled()
  })

  it('rejects a concurrent double-refund (claim wins only once)', async () => {
    findUnique.mockResolvedValue(booking())
    updateMany.mockResolvedValueOnce({ count: 0 }) // another request already claimed
    const r = await processRefund('b1', 300)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(409)
    expect(createRefund).not.toHaveBeenCalled()
  })

  it('rolls the claim back if Stripe fails', async () => {
    findUnique.mockResolvedValue(booking())
    createRefund.mockRejectedValueOnce(new Error('stripe down'))
    const r = await processRefund('b1', 300)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(502)
    // two updateMany calls: the claim, then the rollback restoring refundedAmount 0
    expect(updateMany).toHaveBeenCalledTimes(2)
    expect((updateMany.mock.calls[1] as any[])[0].data).toMatchObject({ refundedAmount: 0, paymentStatus: 'PAID' })
  })
})
