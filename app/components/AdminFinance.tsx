'use client'

import { useCallback, useEffect, useState } from 'react'

type Row = { key: string; count: number; net: number; vat: number }
type Summary = {
  bookings: number; netRevenue: number; vatCollected: number; grossRevenue: number
  platformFees: number; carrierPayouts: number; refunds: number; refundedGross: number
  vatReversed: number; netVatDue: number
}
type CurrencyReport = { currency: string; summary: Summary; byTreatment: Row[]; byRate: Row[]; byCountry: Row[] }
type Report = {
  period: { from: string; to: string }
  currencies: string[]
  byCurrency: CurrencyReport[]
}

const TREATMENT_LABELS: Record<string, string> = {
  DOMESTIC: 'Domestic VAT',
  REVERSE_CHARGE: 'Reverse charge (intra-EU B2B)',
  B2C_EU: 'EU consumer',
  ZERO_RATED_EXPORT: 'Export / out of scope',
  NOT_REGISTERED: 'Not VAT registered',
  OUT_OF_SCOPE: 'Out of scope',
  UNSPECIFIED: 'Unspecified (legacy)',
}

const todayISO = () => new Date().toISOString().slice(0, 10)
const yearStartISO = () => `${new Date().getFullYear()}-01-01`

export default function AdminFinance({ token }: { token: string }) {
  const [from, setFrom] = useState(yearStartISO())
  const [to, setTo] = useState(todayISO())
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/finance?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setReport(data)
      else setError(data.error || 'Failed to load report')
    } catch { setError('Failed to load report') }
    finally { setLoading(false) }
  }, [from, to, token])

  useEffect(() => { load() }, [load])

  const money = (n: number, cur: string) => `${cur ? cur + ' ' : ''}${n.toFixed(2)}`

  const downloadCsv = async () => {
    const res = await fetch(`/api/admin/finance?from=${from}&to=${to}&format=csv`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { setError('CSV export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `onshore-vat-${from}_${to}.csv`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const card = (label: string, value: string, accent?: boolean) => (
    <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-4">
      <div className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? 'text-[var(--c-accent)]' : 'text-[var(--c-ink)]'}`}>{value}</div>
    </div>
  )

  const table = (title: string, rows: Row[], cur: string, labelMap?: Record<string, string>) => (
    <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--c-border)] text-sm font-bold text-[var(--c-ink)]">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)] bg-[var(--c-canvas-2)]">
              <th className="text-left font-semibold px-4 py-2">Category</th>
              <th className="text-right font-semibold px-4 py-2">Bookings</th>
              <th className="text-right font-semibold px-4 py-2">Net</th>
              <th className="text-right font-semibold px-4 py-2">VAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--c-text-3)]">No data in this period.</td></tr>
            ) : rows.map(r => (
              <tr key={r.key} className="border-t border-[var(--c-border)]">
                <td className="px-4 py-2 text-[var(--c-ink)]">{labelMap?.[r.key] || r.key}</td>
                <td className="px-4 py-2 text-right text-[var(--c-text-2)]">{r.count}</td>
                <td className="px-4 py-2 text-right text-[var(--c-text-2)]">{money(r.net, cur)}</td>
                <td className="px-4 py-2 text-right font-semibold text-[var(--c-ink)]">{money(r.vat, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[var(--c-ink)] mb-1">VAT / Finance report</h3>
        <p className="text-xs text-[var(--c-text-2)] mb-5">VAT collected and revenue over a period, broken down by treatment, rate and customer country. Export as CSV for your accountant.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
          </div>
          <button onClick={load} disabled={loading} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">{loading ? 'Loading…' : 'Run'}</button>
          <button onClick={downloadCsv} disabled={!report} className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-canvas-2)] disabled:opacity-50">Download CSV</button>
        </div>
        {report && report.currencies.length > 1 && (
          <p className="mt-3 text-xs text-[var(--c-text-2)]">Bookings span {report.currencies.length} currencies ({report.currencies.join(', ')}) — each is reported separately below for filing.</p>
        )}
      </div>

      {error && <div className="bg-[var(--c-surface)] border border-[var(--c-error)]/30 rounded-xl p-4 text-sm text-[var(--c-error)]">{error}</div>}

      {report && report.byCurrency.length === 0 && (
        <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-8 text-center text-[var(--c-text-3)]">No paid bookings in this period.</div>
      )}

      {report && report.byCurrency.map(c => (
        <div key={c.currency} className="space-y-4">
          {report.byCurrency.length > 1 && (
            <h3 className="text-base font-bold text-[var(--c-ink)] pt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[var(--c-accent)] text-white text-xs">{c.currency}</span>
              <span className="text-[var(--c-text-2)] font-medium text-sm">reporting group</span>
            </h3>
          )}
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {card('Net revenue', money(c.summary.netRevenue, c.currency))}
            {card('VAT collected', money(c.summary.vatCollected, c.currency), true)}
            {card('Gross revenue', money(c.summary.grossRevenue, c.currency))}
            {card('Net VAT due', money(c.summary.netVatDue, c.currency), true)}
            {card('Platform fees', money(c.summary.platformFees, c.currency))}
            {card('Carrier payouts', money(c.summary.carrierPayouts, c.currency))}
            {card('Paid bookings', String(c.summary.bookings))}
            {card('Refunds', `${c.summary.refunds} · ${money(c.summary.vatReversed, c.currency)} VAT`)}
          </div>
          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {table('VAT by treatment', c.byTreatment, c.currency, TREATMENT_LABELS)}
            {table('VAT by rate', c.byRate, c.currency)}
          </div>
          {table('VAT by customer country', c.byCountry, c.currency)}
        </div>
      ))}

      {report && report.byCurrency.length > 0 && (
        <p className="text-xs text-[var(--c-text-3)]">
          &ldquo;Net VAT due&rdquo; is VAT collected minus VAT reversed on refunds in this period, per currency. This is a reporting aid, not a filed return — confirm figures with your accountant before submitting.
        </p>
      )}
    </div>
  )
}
