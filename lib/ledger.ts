import prisma from './prisma'

export type TransactionType = 'CHARGE' | 'PAYOUT' | 'PAYOUT_REVERSAL' | 'REFUND'

/**
 * Append an entry to the money ledger. Best-effort: a ledger write must never
 * break the actual money movement, so callers fire-and-forget (errors logged).
 */
export async function recordTransaction(entry: {
  bookingId?: string | null
  type: TransactionType
  amount: number
  currency?: string
  stripeRef?: string | null
  actorId?: string | null
  note?: string | null
}): Promise<void> {
  try {
    await prisma.transaction.create({
      data: {
        bookingId: entry.bookingId ?? null,
        type: entry.type,
        amount: Math.round(Math.abs(entry.amount) * 100) / 100,
        currency: entry.currency || 'EUR',
        stripeRef: entry.stripeRef ?? null,
        actorId: entry.actorId ?? null,
        note: entry.note ?? null,
      },
    })
  } catch (err) {
    console.error('Ledger write failed:', err)
  }
}
