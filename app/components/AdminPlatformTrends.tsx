'use client'

import { useEffect, useState } from 'react'

type Month = { month: string; gmv: number; fees: number; bookings: number }
type RankRoute = { route: string; count: number; gmv: number }
type RankCarrier = { name: string; count: number; gmv: number }
type Data = {
  headline: {
    gmv12mo: number; fees12mo: number; bookings12mo: number; avgBookingValue: number
    deliveryRate: number; activeCarriers: number; activeListings: number; totalBookings: number
    multiCurrency: boolean; currencies: string[]
  }
  months: Month[]; topRoutes: RankRoute[]; topCarriers: RankCarrier[]
}

export default function AdminPlatformTrends({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled && d?.headline) setData(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token])

  if (!data) return null
  const h = data.headline
  const maxGmv = Math.max(1, ...data.months.map(m => m.gmv))
  const cur = data.headline.multiCurrency ? '' : (data.headline.currencies[0] || '')
  const money = (n: number) => `${cur ? cur + ' ' : ''}${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

  const kpi = (label: string, value: string, sub?: string) => (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-4">
      <div className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)]">{label}</div>
      <div className="mt-1 text-xl font-bold text-[var(--c-ink)]">{value}</div>
      {sub && <div className="text-[11px] text-[var(--c-text-3)] mt-0.5">{sub}</div>}
    </div>
  )

  return (
    <div className="bg-[var(--c-surface)] rounded-xl shadow-sm border border-[var(--c-border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--c-ink)]">Platform trends · last 12 months</h3>
        {h.multiCurrency && <span className="text-[11px] text-[var(--c-text-3)]">mixed currencies ({h.currencies.join(', ')}) — values summed</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpi('GMV (12mo)', money(h.gmv12mo))}
        {kpi('Platform fees', money(h.fees12mo))}
        {kpi('Bookings', String(h.bookings12mo), `avg ${money(h.avgBookingValue)}`)}
        {kpi('Delivery rate', `${h.deliveryRate}%`, `${h.activeCarriers} carriers · ${h.activeListings} live listings`)}
      </div>

      {/* GMV bar chart */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-[var(--c-text-2)] mb-2">Monthly GMV</div>
        <div className="flex items-end gap-1.5 h-32">
          {data.months.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center justify-end group">
              <div className="w-full rounded-t bg-[var(--c-accent)] hover:bg-[var(--c-accent-hover)] transition-colors relative" style={{ height: `${(m.gmv / maxGmv) * 100}%`, minHeight: m.gmv > 0 ? 2 : 0 }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-[var(--c-ink)] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">{money(m.gmv)} · {m.bookings}</div>
              </div>
              <div className="text-[9px] text-[var(--c-text-3)] mt-1 rotate-0">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold text-[var(--c-text-2)] mb-2">Top routes</div>
          {data.topRoutes.length === 0 ? <p className="text-xs text-[var(--c-text-3)]">No data.</p> : (
            <div className="space-y-1.5">
              {data.topRoutes.map(r => (
                <div key={r.route} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--c-ink)] truncate pr-2">{r.route}</span>
                  <span className="text-[var(--c-text-2)] whitespace-nowrap">{money(r.gmv)} <span className="text-[var(--c-text-3)]">· {r.count}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--c-text-2)] mb-2">Top carriers</div>
          {data.topCarriers.length === 0 ? <p className="text-xs text-[var(--c-text-3)]">No data.</p> : (
            <div className="space-y-1.5">
              {data.topCarriers.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--c-ink)] truncate pr-2">{c.name}</span>
                  <span className="text-[var(--c-text-2)] whitespace-nowrap">{money(c.gmv)} <span className="text-[var(--c-text-3)]">· {c.count}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
