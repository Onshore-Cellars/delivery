'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface EarningsData {
  totalRevenue: number
  totalBookings: number
  completedDeliveries: number
  pendingPayouts: number
  currency: string
  recentBookings: {
    id: string
    trackingCode?: string
    cargoDescription?: string
    totalPrice: number
    carrierPayout: number
    platformFee: number
    currency: string
    status: string
    createdAt: string
    shipper: { name: string }
  }[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-[var(--c-accent)]/15 text-[var(--c-accent)]',
  CONFIRMED: 'bg-[var(--c-info)]/15 text-[var(--c-info)]',
  PICKED_UP: 'bg-[var(--c-info)]/15 text-[var(--c-info)]',
  IN_TRANSIT: 'bg-[var(--c-info)]/15 text-[var(--c-info)]',
  DELIVERED: 'bg-[var(--c-success)]/15 text-[var(--c-success)]',
  CANCELLED: 'bg-[var(--c-canvas-2)] text-[var(--c-text-2)]',
  DISPUTED: 'bg-[var(--c-error)]/10 text-[var(--c-error)]',
}

interface PayoutStatus {
  connected: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export default function EarningsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payout, setPayout] = useState<PayoutStatus | null>(null)
  const [connecting, setConnecting] = useState(false)

  const fetchPayout = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/stripe/connect', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setPayout(await res.json())
    } catch { /* ignore */ }
  }, [token])

  const connectPayouts = useCallback(async () => {
    if (!token) return
    setConnecting(true)
    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      })
      const result = await res.json()
      if (res.ok && result.url) {
        window.location.href = result.url
        return
      }
      alert(result.error || 'Could not start payout onboarding.')
    } catch {
      alert('Could not start payout onboarding.')
    } finally {
      setConnecting(false)
    }
  }, [token])

  const fetchEarnings = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/bookings?role=carrier&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const result = await res.json()
        const bookings = result.bookings || []
        const completed = bookings.filter((b: { status: string }) => b.status === 'DELIVERED')
        const pending = bookings.filter((b: { status: string }) => ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'].includes(b.status))

        setData({
          totalRevenue: completed.reduce((s: number, b: { carrierPayout: number }) => s + (b.carrierPayout || 0), 0),
          totalBookings: bookings.length,
          completedDeliveries: completed.length,
          pendingPayouts: pending.reduce((s: number, b: { carrierPayout: number }) => s + (b.carrierPayout || 0), 0),
          currency: bookings[0]?.currency || 'EUR',
          recentBookings: bookings.slice(0, 20),
        })
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchEarnings(); fetchPayout() }, [fetchEarnings, fetchPayout])

  if (authLoading) return <div className="min-h-screen bg-[var(--c-canvas)]" />
  if (!user) return (
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center">
      <p className="text-[var(--c-text-3)]">Please <Link href="/login" className="text-[var(--c-accent)]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number, currency: string) => {
    const sym = currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  return (
    <div id="main-content" className="min-h-screen bg-[var(--c-canvas)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--c-ink)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Earnings</h1>

        {/* Payout onboarding — carriers must connect Stripe to receive payouts */}
        {payout && !payout.payoutsEnabled && (
          <div className="mb-6 rounded-lg border border-[var(--c-accent)]/30 bg-[var(--c-accent)]/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--c-ink)]">
                {payout.connected ? 'Finish setting up payouts' : 'Set up payouts to get paid'}
              </p>
              <p className="text-xs text-[var(--c-text-2)] mt-0.5">
                {payout.connected
                  ? 'Your Stripe account needs a few more details before you can receive payouts.'
                  : 'Connect a Stripe account to receive your carrier payouts. Without it, bookings can’t pay out to you.'}
              </p>
            </div>
            <button
              onClick={connectPayouts}
              disabled={connecting}
              className="shrink-0 rounded-lg bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--c-accent-hover)] disabled:opacity-60"
            >
              {connecting ? 'Redirecting…' : payout.connected ? 'Continue setup' : 'Connect payouts'}
            </button>
          </div>
        )}
        {payout?.payoutsEnabled && (
          <div className="mb-6 rounded-lg border border-[var(--c-success)]/30 bg-[var(--c-success)]/10 p-3 flex items-center gap-2">
            <span className="text-[var(--c-success)]">✓</span>
            <p className="text-sm text-[var(--c-ink)]">Payouts are active — you’re all set to receive carrier payments.</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--c-surface)] rounded-lg border border-black/10 animate-pulse" />)}
          </div>
        ) : !data || data.totalBookings === 0 ? (
          <div className="text-center py-16 bg-[var(--c-surface)] rounded-lg border border-black/10">
            <p className="text-[var(--c-text-3)] mb-2">No earnings yet</p>
            <p className="text-xs text-[var(--c-text-2)] mb-4">Complete deliveries to start earning</p>
            <Link href="/marketplace" className="text-[var(--c-accent)] font-medium hover:underline">Browse available bookings</Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-4">
                <p className="text-xs text-[var(--c-text-2)] font-medium uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-[var(--c-success)]">{fmt(data.totalRevenue, data.currency)}</p>
              </div>
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-4">
                <p className="text-xs text-[var(--c-text-2)] font-medium uppercase tracking-wider mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-[var(--c-accent)]">{fmt(data.pendingPayouts, data.currency)}</p>
              </div>
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-4">
                <p className="text-xs text-[var(--c-text-2)] font-medium uppercase tracking-wider mb-1">Deliveries</p>
                <p className="text-2xl font-bold text-[var(--c-ink)]">{data.completedDeliveries}</p>
              </div>
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-4">
                <p className="text-xs text-[var(--c-text-2)] font-medium uppercase tracking-wider mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-[var(--c-ink)]">{data.totalBookings}</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <h2 className="text-lg font-semibold text-[var(--c-ink)] mb-4">Recent Bookings</h2>
            <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-[var(--c-canvas)]">
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Booking</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Shipper</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Status</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Total</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Your Payout</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[var(--c-text-3)] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBookings.map(b => (
                      <tr key={b.id} className="border-b border-black/10 last:border-0 hover:bg-[var(--c-canvas)]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--c-ink)]">{b.trackingCode || b.id.slice(0, 8)}</div>
                          <div className="text-xs text-[var(--c-text-2)] truncate max-w-[200px]">{b.cargoDescription}</div>
                        </td>
                        <td className="px-4 py-3 text-[var(--c-text-2)]">{b.shipper?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-[var(--c-canvas-2)] text-[var(--c-text-3)]'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--c-text-2)]">{fmt(b.totalPrice, b.currency)}</td>
                        <td className="px-4 py-3 text-right font-medium text-[var(--c-success)]">{fmt(b.carrierPayout, b.currency)}</td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--c-text-2)]">{new Date(b.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
