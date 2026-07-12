'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface AnalyticsData {
  carrier: {
    totalRevenue: number; revenue30d: number; avgBookingValue: number
    totalDeliveries: number; bookings30d: number; bookings90d: number
    totalWeightKg: number; totalVolumeM3: number
    monthlyRevenue: { month: string; revenue: number; bookings: number }[]
    topRoutes: { route: string; count: number; revenue: number }[]
    activeListings: number; totalListings: number; totalViews: number; conversionRate: number
  }
  shipper: {
    totalSpent: number; spent30d: number; totalShipments: number; activeShipments: number
    monthlySpending: { month: string; spent: number; shipments: number }[]
  }
  rating: { average: number; average30d: number; totalReviews: number; trend: string }
  statusDistribution: Record<string, number>
  currency: string
}

export default function AnalyticsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'carrier' | 'shipper'>('carrier')

  const fetchAnalytics = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  useEffect(() => {
    if (user && !user.canCarry) setTab('shipper')
  }, [user])

  if (authLoading) return <div className="min-h-screen bg-[var(--c-canvas)]" />
  if (!user) return (
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center">
      <p className="text-[var(--c-text-3)]">Please <Link href="/login" className="text-[var(--c-accent)]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number) => {
    const sym = data?.currency === 'GBP' ? '\u00A3' : data?.currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  const maxBar = (values: number[]) => Math.max(...values, 1)

  return (
    <div id="main-content" className="min-h-screen bg-[var(--c-canvas)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--c-ink)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Analytics</h1>

        {user.canCarry && (
          <div className="flex gap-2 mb-6">
            {(['carrier', 'shipper'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-surface)] border border-black/10 text-[var(--c-ink)]'}`}>
                {t === 'carrier' ? 'Carrier' : 'Shipper'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--c-surface)] rounded-lg border border-black/10 animate-pulse" />)}
          </div>
        ) : !data ? (
          <div className="text-center py-16 bg-[var(--c-surface)] rounded-lg border border-black/10">
            <p className="text-[var(--c-text-3)]">No analytics data available yet</p>
          </div>
        ) : tab === 'carrier' ? (
          <>
            {/* Carrier Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Revenue" value={fmt(data.carrier.totalRevenue)} color="text-[var(--c-success)]" />
              <StatCard label="Last 30 Days" value={fmt(data.carrier.revenue30d)} color="text-[var(--c-success)]" />
              <StatCard label="Deliveries" value={String(data.carrier.totalDeliveries)} />
              <StatCard label="Avg Booking" value={fmt(data.carrier.avgBookingValue)} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Monthly Revenue Chart */}
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5">
                <h3 className="font-semibold text-[var(--c-ink)] mb-4">Monthly Revenue</h3>
                <div className="space-y-3">
                  {data.carrier.monthlyRevenue.map(m => (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--c-text-3)] w-16 flex-shrink-0">{m.month}</span>
                      <div className="flex-1 bg-[var(--c-canvas-2)] rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-[var(--c-success)]/100 h-full rounded-full transition-all"
                          style={{ width: `${(m.revenue / maxBar(data.carrier.monthlyRevenue.map(x => x.revenue))) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-medium text-[var(--c-text-2)]">
                          {fmt(m.revenue)} ({m.bookings})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Routes */}
              <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5">
                <h3 className="font-semibold text-[var(--c-ink)] mb-4">Top Routes</h3>
                {data.carrier.topRoutes.length === 0 ? (
                  <p className="text-sm text-[var(--c-text-2)]">No routes yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.carrier.topRoutes.map((r, i) => (
                      <div key={r.route} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[var(--c-accent)]/10 text-[var(--c-accent)] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-[var(--c-ink)]">{r.route}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-[var(--c-ink)]">{r.count} bookings</div>
                          <div className="text-xs text-[var(--c-text-2)]">{fmt(r.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* More Carrier Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Weight" value={`${data.carrier.totalWeightKg.toLocaleString()} kg`} />
              <StatCard label="Total Volume" value={`${data.carrier.totalVolumeM3} m\u00B3`} />
              <StatCard label="Active Listings" value={`${data.carrier.activeListings}/${data.carrier.totalListings}`} />
              <StatCard label="Conversion Rate" value={`${data.carrier.conversionRate}%`} />
            </div>

            {/* Listing Performance */}
            <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5 mb-8">
              <h3 className="font-semibold text-[var(--c-ink)] mb-2">Listing Performance</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--c-ink)]">{data.carrier.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-[var(--c-text-2)]">Total Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--c-ink)]">{data.carrier.bookings30d}</div>
                  <div className="text-xs text-[var(--c-text-2)]">Bookings (30d)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--c-ink)]">{data.carrier.bookings90d}</div>
                  <div className="text-xs text-[var(--c-text-2)]">Bookings (90d)</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Shipper Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Spent" value={fmt(data.shipper.totalSpent)} color="text-[var(--c-info)]" />
              <StatCard label="Last 30 Days" value={fmt(data.shipper.spent30d)} color="text-[var(--c-info)]" />
              <StatCard label="Completed" value={String(data.shipper.totalShipments)} />
              <StatCard label="Active" value={String(data.shipper.activeShipments)} color="text-[var(--c-accent)]" />
            </div>

            {/* Monthly Spending Chart */}
            <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5 mb-8">
              <h3 className="font-semibold text-[var(--c-ink)] mb-4">Monthly Spending</h3>
              <div className="space-y-3">
                {data.shipper.monthlySpending.map(m => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--c-text-3)] w-16 flex-shrink-0">{m.month}</span>
                    <div className="flex-1 bg-[var(--c-canvas-2)] rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-[var(--c-brand)]/150 h-full rounded-full transition-all"
                        style={{ width: `${(m.spent / maxBar(data.shipper.monthlySpending.map(x => x.spent))) * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-medium text-[var(--c-text-2)]">
                        {fmt(m.spent)} ({m.shipments})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Rating & Review Stats (shown for both) */}
        {data && (
          <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5 mb-8">
            <h3 className="font-semibold text-[var(--c-ink)] mb-4">Rating</h3>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-4xl font-bold text-[var(--c-ink)]">{data.rating.average}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-lg ${s <= Math.round(data.rating.average) ? 'text-[var(--c-accent)]' : 'text-[var(--c-text-3)]'}`}>★</span>
                  ))}
                </div>
                <div className="text-xs text-[var(--c-text-2)] mt-1">{data.rating.totalReviews} reviews</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--c-text-3)]">30-day avg:</span>
                  <span className="text-sm font-semibold text-[var(--c-ink)]">{data.rating.average30d}</span>
                  {data.rating.trend === 'up' && <span className="text-[var(--c-success)] text-xs">↑ Improving</span>}
                  {data.rating.trend === 'down' && <span className="text-[var(--c-error)] text-xs">↓ Declining</span>}
                  {data.rating.trend === 'stable' && <span className="text-[var(--c-text-2)] text-xs">→ Stable</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Distribution */}
        {data && Object.keys(data.statusDistribution).length > 0 && (
          <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5">
            <h3 className="font-semibold text-[var(--c-ink)] mb-4">Booking Status Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.statusDistribution).map(([status, count]) => (
                <div key={status} className="px-3 py-2 rounded-lg bg-[var(--c-canvas)] border border-black/10">
                  <div className="text-lg font-bold text-[var(--c-ink)]">{count}</div>
                  <div className="text-[10px] text-[var(--c-text-2)] uppercase tracking-wider">{status.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-[var(--c-ink)]' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-4">
      <p className="text-xs text-[var(--c-text-2)] font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
