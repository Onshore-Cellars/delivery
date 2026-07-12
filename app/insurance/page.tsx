'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface InsuranceClaim {
  claimId: string
  bookingId: string
  trackingCode?: string
  cargoDescription?: string
  bookingTotal: number
  currency: string
  insuranceTier: string
  insurancePremium?: number
  insuredValue?: number
  claimType: string
  claimStatus: string
  claimAmount?: number
  description: string
  filedAt: string
}

interface InsuredBooking {
  bookingId: string
  trackingCode?: string
  cargoDescription?: string
  insuranceTier: string
  insurancePremium?: number
  insuredValue?: number
  status: string
  currency: string
}

const tierColors: Record<string, string> = {
  basic: 'bg-[var(--c-canvas-2)] text-[var(--c-text-2)]',
  standard: 'bg-[#1F5E86]/15 text-[var(--c-info)]',
  premium: 'bg-[#1F5E86]/15 text-[var(--c-info)]',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#B23A2E]/10 text-[var(--c-error)]',
  UNDER_REVIEW: 'bg-[var(--c-accent)]/15 text-[var(--c-accent)]',
  RESOLVED: 'bg-[var(--c-success)]/15 text-[var(--c-success)]',
}

export default function InsurancePage() {
  const { user, token, loading: authLoading } = useAuth()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [insuredBookings, setInsuredBookings] = useState<InsuredBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'coverage' | 'claims' | 'calculator'>('coverage')

  // Calculator state
  const [calcValue, setCalcValue] = useState('')
  const [calcCategory, setCalcCategory] = useState('marine_equipment')
  const [calcCrossBorder, setCalcCrossBorder] = useState(false)
  const [estimates, setEstimates] = useState<{ tier: { id: string; name: string; description: string; features: string[]; excessGBP: number }; premiumGBP: number; premiumEUR: number; recommended: boolean }[] | null>(null)
  const [calcError, setCalcError] = useState('')
  const [calcLoading, setCalcLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/insurance/claims', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setClaims(data.claims || [])
        setInsuredBookings(data.insuredBookings || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const getEstimate = async () => {
    if (!calcValue || parseFloat(calcValue) <= 0) return
    setCalcError('')
    setCalcLoading(true)
    setEstimates(null)
    try {
      const res = await fetch(`/api/insurance?value=${calcValue}&category=${calcCategory}&crossBorder=${calcCrossBorder}`)
      if (res.ok) {
        const data = await res.json()
        setEstimates(data.estimates)
      } else {
        setCalcError('Failed to get estimate. Please try again.')
      }
    } catch {
      setCalcError('Could not connect to the server. Please try again.')
    } finally {
      setCalcLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-[var(--c-ink)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Insurance</h1>

        <div className="flex gap-2 mb-6">
          {(['coverage', 'claims', 'calculator'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-surface)] border border-black/10 text-[var(--c-ink)]'}`}>
              {t === 'coverage' ? 'My Coverage' : t === 'claims' ? `Claims (${claims.length})` : 'Calculator'}
            </button>
          ))}
        </div>

        {tab === 'coverage' && (
          loading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-[var(--c-surface)] rounded-lg border animate-pulse" />)}</div>
          ) : insuredBookings.length === 0 ? (
            <div className="text-center py-16 bg-[var(--c-surface)] rounded-lg border border-black/10">
              <p className="text-[var(--c-text-3)] mb-2">No insured bookings</p>
              <p className="text-xs text-[var(--c-text-2)]">Add insurance when booking a delivery for cargo protection</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insuredBookings.map(b => (
                <div key={b.bookingId} className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-[var(--c-ink)]">{b.trackingCode || b.bookingId.slice(0, 8)}</div>
                      <div className="text-xs text-[var(--c-text-2)]">{b.cargoDescription}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[b.insuranceTier || ''] || 'bg-[var(--c-canvas-2)]'}`}>
                      {b.insuranceTier} cover
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--c-text-3)]">
                    {b.insuredValue && <span>Insured: {fmt(b.insuredValue, b.currency)}</span>}
                    {b.insurancePremium && <span>Premium: {fmt(b.insurancePremium, b.currency)}</span>}
                    <span>Status: {b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'claims' && (
          claims.length === 0 ? (
            <div className="text-center py-16 bg-[var(--c-surface)] rounded-lg border border-black/10">
              <p className="text-[var(--c-text-3)] mb-2">No insurance claims</p>
              <p className="text-xs text-[var(--c-text-2)]">File a claim from the <Link href="/disputes" className="text-[var(--c-accent)]">disputes</Link> page for insured bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map(c => (
                <div key={c.claimId} className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--c-ink)]">{c.claimType === 'DAMAGE' ? 'Damage Claim' : 'Loss Claim'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.claimStatus] || 'bg-[var(--c-canvas-2)]'}`}>
                          {c.claimStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--c-text-2)] mt-0.5">{c.trackingCode} — {c.cargoDescription}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.insuranceTier || ''] || 'bg-[var(--c-canvas-2)]'}`}>
                      {c.insuranceTier}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--c-text-2)] mb-3">{c.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--c-text-3)]">
                    {c.claimAmount && <span className="font-medium">Claim: {fmt(c.claimAmount, c.currency)}</span>}
                    <span>Insured: {fmt(c.insuredValue || 0, c.currency)}</span>
                    <span>Premium paid: {fmt(c.insurancePremium || 0, c.currency)}</span>
                    <span>{new Date(c.filedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'calculator' && (
          <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-6">
            <h2 className="font-semibold text-[var(--c-ink)] mb-4">Insurance Premium Calculator</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Declared Value (GBP)</label>
                <input type="number" min="0" step="100" value={calcValue} onChange={e => setCalcValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[var(--c-accent)] outline-none"
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Cargo Category</label>
                <select value={calcCategory} onChange={e => setCalcCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-[var(--c-accent)] outline-none">
                  {[
                    ['provisions', 'Provisions & Food'], ['wine', 'Wine & Spirits'], ['marine_equipment', 'Marine Equipment'],
                    ['spare_parts', 'Spare Parts'], ['electronics', 'Electronics & Navigation'], ['luxury', 'Luxury Goods'],
                    ['sails', 'Sails & Canvas'], ['chandlery', 'Chandlery & Deck Hardware'], ['safety', 'Safety Equipment'],
                    ['crew_gear', 'Crew Gear'], ['cleaning', 'Cleaning Supplies'], ['medical', 'Medical Supplies'],
                    ['hazmat', 'Paints, Solvents & Chemicals'],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Cross-Border?</label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={calcCrossBorder} onChange={e => setCalcCrossBorder(e.target.checked)} className="rounded" />
                  <span className="text-sm text-[var(--c-text-2)]">Yes, crossing borders</span>
                </label>
              </div>
            </div>
            <button onClick={getEstimate} disabled={calcLoading}
              className="px-5 py-2.5 bg-[var(--c-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--c-accent-hover)] disabled:opacity-50 transition-colors mb-6">
              {calcLoading ? 'Calculating...' : 'Calculate'}
            </button>

            {calcError && <div className="mb-4 p-3 bg-[#B23A2E]/10 border border-[#B23A2E]/30 rounded-lg text-sm text-[var(--c-error)]">{calcError}</div>}

            {estimates && (
              <div className="grid sm:grid-cols-3 gap-4">
                {estimates.map(e => (
                  <div key={e.tier.id} className={`rounded-lg border-2 p-5 ${e.recommended ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/30' : 'border-black/10'}`}>
                    {e.recommended && <div className="text-[10px] font-bold text-[var(--c-accent)] uppercase tracking-wider mb-2">Recommended</div>}
                    <div className="font-semibold text-[var(--c-ink)] mb-1">{e.tier.name}</div>
                    <div className="text-xs text-[var(--c-text-2)] mb-3">{e.tier.description}</div>
                    <div className="text-2xl font-bold text-[var(--c-ink)] mb-1">\u00A3{e.premiumGBP.toFixed(2)}</div>
                    <div className="text-xs text-[var(--c-text-2)] mb-3">\u20AC{e.premiumEUR.toFixed(2)} | Excess: \u00A3{e.tier.excessGBP}</div>
                    <ul className="space-y-1">
                      {e.tier.features.map((f, i) => (
                        <li key={i} className="text-xs text-[var(--c-text-2)] flex items-start gap-1">
                          <span className="text-[var(--c-success)] mt-0.5">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
