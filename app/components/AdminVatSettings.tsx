'use client'

import { useEffect, useState } from 'react'

type Settings = {
  vatCountry: string; vatNumber: string; vatRegistered: boolean
  source: { vatCountry: string; vatNumber: string; vatRegistered: string }
}

export default function AdminVatSettings({ token }: { token: string }) {
  const [s, setS] = useState<Settings | null>(null)
  const [country, setCountry] = useState('')
  const [number, setNumber] = useState('')
  const [registered, setRegistered] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.settings) { setS(d.settings); setCountry(d.settings.vatCountry); setNumber(d.settings.vatNumber); setRegistered(d.settings.vatRegistered) } })
      .catch(() => {})
  }, [token])

  const save = async () => {
    setSaving(true); setMsg(''); setErr('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vatCountry: country.trim(), vatNumber: number.trim(), vatRegistered: registered }),
      })
      const d = await res.json()
      if (res.ok) { setS(d.settings); setMsg('Saved. New bookings will use these settings.') }
      else setErr(d.error || 'Failed to save')
    } catch { setErr('Failed to save') }
    finally { setSaving(false) }
  }

  const tag = (src?: string) => src === 'db' ? <span className="text-[10px] text-[var(--c-success)] ml-1">· saved</span> : <span className="text-[10px] text-[var(--c-text-3)] ml-1">· from env</span>

  return (
    <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
      <h3 className="text-lg font-bold text-[var(--c-ink)] mb-1">Platform VAT</h3>
      <p className="text-xs text-[var(--c-text-2)] mb-5">
        Where Onshore is VAT-established. Applies to VAT on new bookings from now on (existing bookings keep their captured snapshot). Overrides the <code className="text-[11px]">PLATFORM_VAT_*</code> environment defaults.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">VAT country {s && tag(s.source.vatCountry)}</label>
          <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="GB or an EU code (FR, IE…)" className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] uppercase outline-none focus:border-[var(--c-accent)]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">VAT number {s && tag(s.source.vatNumber)}</label>
          <input value={number} onChange={e => setNumber(e.target.value)} placeholder="e.g. GB123456789" className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-sm font-semibold text-[var(--c-ink)]">VAT registered {s && tag(s.source.vatRegistered)}</div>
          <div className="text-xs text-[var(--c-text-3)]">Off = no VAT charged (below threshold / not yet registered)</div>
        </div>
        <button type="button" role="switch" aria-checked={registered} onClick={() => setRegistered(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${registered ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-canvas-2)]'}`}>
          <span className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-[var(--c-surface)] shadow transition-transform ${registered ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      {msg && <p className="mt-4 text-sm text-[var(--c-success)]">{msg}</p>}
      {err && <p className="mt-4 text-sm text-[var(--c-error)]">{err}</p>}
      <button onClick={save} disabled={saving} className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">{saving ? 'Saving…' : 'Save VAT settings'}</button>
    </div>
  )
}
