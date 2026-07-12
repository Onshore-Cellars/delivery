'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import RecurringDeliveryScheduler from '../components/RecurringDeliveryScheduler'

type Item = {
  id: string; frequency: string; nextRunAt: string; active: boolean; remainingCount: number | null
  cargoDescription: string; weightKg: number; volumeM3: number
  listing: { title: string; originPort: string; destinationPort: string; currency: string }
}
type ListingOpt = { id: string; title: string; originPort: string; destinationPort: string }

export default function RecurringPage() {
  const { token, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [listings, setListings] = useState<ListingOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ listingId: '', cargoDescription: '', weightKg: '', volumeM3: '', cargoType: '' })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [r, l] = await Promise.all([
        fetch('/api/recurring', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/listings?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (r.ok) setItems((await r.json()).items || [])
      if (l.ok) { const d = await l.json(); setListings((d.listings || d.items || []).map((x: ListingOpt) => ({ id: x.id, title: x.title, originPort: x.originPort, destinationPort: x.destinationPort }))) }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const cancel = async (id: string) => {
    if (!token) return
    await fetch(`/api/recurring?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const create = async (schedule: { frequency: string; dayOfWeek?: number; dayOfMonth?: number; startDate: string; endDate?: string; count?: number; timeWindow: string; notes?: string }) => {
    if (!token) return
    setError(''); setMsg('')
    if (!form.listingId || !form.cargoDescription || !(parseFloat(form.weightKg) > 0) || !(parseFloat(form.volumeM3) > 0)) {
      setError('Pick a listing and enter cargo, weight and volume.'); return
    }
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, weightKg: parseFloat(form.weightKg), volumeM3: parseFloat(form.volumeM3), ...schedule }),
      })
      const d = await res.json()
      if (res.ok) { setMsg('Recurring shipment scheduled.'); setCreating(false); setForm({ listingId: '', cargoDescription: '', weightKg: '', volumeM3: '', cargoType: '' }); load() }
      else setError(d.error || 'Failed to create')
    } catch { setError('Failed to create') }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-[var(--c-canvas)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-[var(--c-ink)]" style={{ fontFamily: 'var(--font-display)' }}>Recurring shipments</h1>
          <button onClick={() => setCreating(v => !v)} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)]">
            {creating ? 'Close' : 'New recurring shipment'}
          </button>
        </div>
        <p className="text-sm text-[var(--c-text-2)] mb-6">Set up a shipment that repeats on a schedule. Each occurrence creates a booking and prompts you to pay through the normal secure checkout — cards are never charged automatically.</p>

        {msg && <div className="mb-4 rounded-lg border border-[var(--c-success)]/30 bg-[var(--c-success)]/10 p-3 text-sm text-[var(--c-success)]">{msg}</div>}
        {error && <div className="mb-4 rounded-lg border border-[var(--c-error)]/30 bg-[var(--c-error)]/10 p-3 text-sm text-[var(--c-error)]">{error}</div>}

        {creating && (
          <div className="mb-8 bg-[var(--c-surface)] rounded-xl border border-black/10 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Listing (carrier route)</label>
                <select value={form.listingId} onChange={e => setForm({ ...form, listingId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]">
                  <option value="">Select a route…</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title} — {l.originPort} → {l.destinationPort}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Cargo description</label>
                <input value={form.cargoDescription} onChange={e => setForm({ ...form, cargoDescription: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Weight (kg)</label>
                <input type="number" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Volume (m³)</label>
                <input type="number" value={form.volumeM3} onChange={e => setForm({ ...form, volumeM3: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
              </div>
            </div>
            <RecurringDeliveryScheduler listingId={form.listingId} onSchedule={create} onClose={() => setCreating(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-[var(--c-text-3)]">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-8 text-center text-[var(--c-text-3)]">No recurring shipments yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map(it => (
              <div key={it.id} className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-[var(--c-ink)]">{it.listing.originPort} → {it.listing.destinationPort}</div>
                  <div className="text-xs text-[var(--c-text-2)] mt-0.5">{it.cargoDescription} · {it.weightKg}kg · {it.volumeM3}m³</div>
                  <div className="text-xs text-[var(--c-text-3)] mt-1">
                    <span className="capitalize">{it.frequency}</span>
                    {it.active ? <> · next {new Date(it.nextRunAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</> : ' · cancelled'}
                    {it.remainingCount != null && <> · {it.remainingCount} left</>}
                  </div>
                </div>
                {it.active && (
                  <button onClick={() => cancel(it.id)} className="px-3 py-1.5 rounded-lg border border-black/10 text-xs font-medium text-[var(--c-text-2)] hover:bg-[var(--c-canvas-2)]">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
