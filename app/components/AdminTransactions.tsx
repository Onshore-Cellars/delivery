'use client'

import { useCallback, useEffect, useState } from 'react'

type Txn = {
  id: string; date: string; type: string; amount: number; currency: string
  stripeRef: string | null; note: string | null; tracking: string | null; party: string; route: string | null
}
type Data = { transactions: Txn[]; totals: Record<string, { count: number; amount: number }>; netToPlatform: number }

const TYPE_STYLE: Record<string, string> = {
  CHARGE: 'bg-[var(--c-success)]/12 text-[var(--c-success)]',
  PAYOUT: 'bg-[var(--c-info)]/12 text-[var(--c-info)]',
  PAYOUT_REVERSAL: 'bg-[var(--c-warning)]/15 text-[var(--c-warning)]',
  REFUND: 'bg-[var(--c-error)]/12 text-[var(--c-error)]',
}
const TYPE_LABEL: Record<string, string> = { CHARGE: 'Charge', PAYOUT: 'Payout', PAYOUT_REVERSAL: 'Payout reversal', REFUND: 'Refund' }
const yearStart = () => `${new Date().getFullYear()}-01-01`
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function AdminTransactions({ token }: { token: string }) {
  const [from, setFrom] = useState(yearStart())
  const [to, setTo] = useState(todayISO())
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ from, to })
      if (type) p.set('type', type)
      if (q) p.set('q', q)
      const res = await fetch(`/api/admin/transactions?${p}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [from, to, type, q, token])

  useEffect(() => { load() }, [load])

  const money = (n: number, cur: string) => `${cur} ${n.toFixed(2)}`
  const downloadCsv = async () => {
    const p = new URLSearchParams({ from, to, format: 'csv' })
    if (type) p.set('type', type); if (q) p.set('q', q)
    const res = await fetch(`/api/admin/transactions?${p}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a'); a.href = url; a.download = 'onshore-transactions.csv'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[var(--c-ink)] mb-1">Transactions ledger</h3>
        <p className="text-xs text-[var(--c-text-2)] mb-5">Every money movement — charges, payouts, reversals and refunds — to reconcile against Stripe.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" /></div>
          <div><label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" /></div>
          <div><label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]">
              <option value="">All</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div className="flex-1 min-w-[160px]"><label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Search</label>
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="tracking, name, Stripe ref" className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" /></div>
          <button onClick={load} disabled={loading} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">{loading ? '…' : 'Run'}</button>
          <button onClick={downloadCsv} disabled={!data} className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-canvas-2)] disabled:opacity-50">CSV</button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['CHARGE', 'PAYOUT', 'PAYOUT_REVERSAL', 'REFUND'] as const).map(t => (
            <div key={t} className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-4">
              <div className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)]">{TYPE_LABEL[t]}</div>
              <div className="mt-1 text-lg font-bold text-[var(--c-ink)]">{(data.totals[t]?.amount || 0).toFixed(2)}</div>
              <div className="text-[11px] text-[var(--c-text-3)]">{data.totals[t]?.count || 0} entries</div>
            </div>
          ))}
          <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)]">Net to platform</div>
            <div className="mt-1 text-lg font-bold text-[var(--c-accent)]">{data.netToPlatform.toFixed(2)}</div>
            <div className="text-[11px] text-[var(--c-text-3)]">charges − payouts − refunds</div>
          </div>
        </div>
      )}

      <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[var(--c-text-3)] bg-[var(--c-canvas-2)]">
                <th className="text-left font-semibold px-4 py-2">Date</th>
                <th className="text-left font-semibold px-4 py-2">Type</th>
                <th className="text-left font-semibold px-4 py-2">Party</th>
                <th className="text-left font-semibold px-4 py-2">Booking</th>
                <th className="text-right font-semibold px-4 py-2">Amount</th>
                <th className="text-left font-semibold px-4 py-2">Ref</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--c-text-3)]">{loading ? 'Loading…' : 'No transactions in this range.'}</td></tr>
              ) : data.transactions.map(t => (
                <tr key={t.id} className="border-t border-[var(--c-border)]">
                  <td className="px-4 py-2 text-[var(--c-text-2)] whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                  <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${TYPE_STYLE[t.type] || ''}`}>{TYPE_LABEL[t.type] || t.type}</span></td>
                  <td className="px-4 py-2 text-[var(--c-ink)]">{t.party}</td>
                  <td className="px-4 py-2 text-[var(--c-text-2)]">{t.tracking || '—'}{t.route ? <span className="block text-[11px] text-[var(--c-text-3)]">{t.route}</span> : null}</td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--c-ink)] whitespace-nowrap">{money(t.amount, t.currency)}</td>
                  <td className="px-4 py-2 text-[var(--c-text-3)] font-mono text-[11px] max-w-[140px] truncate" title={t.stripeRef || ''}>{t.stripeRef || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
