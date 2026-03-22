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
  basic: 'bg-slate-100 text-slate-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
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
    try {
      const res = await fetch(`/api/insurance?value=${calcValue}&category=${calcCategory}&crossBorder=${calcCrossBorder}`)
      if (res.ok) {
        const data = await res.json()
        setEstimates(data.estimates)
      }
    } catch { /* ignore */ }
  }

  if (authLoading) return <div className="min-h-screen bg-[#faf9f7]" />
  if (!user) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <p className="text-slate-500">Please <Link href="/login" className="text-[#C6904D]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number, currency: string) => {
    const sym = currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#faf9f7] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Insurance</h1>

        <div className="flex gap-2 mb-6">
          {(['coverage', 'claims', 'calculator'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e4de] text-[#1a1a1a]'}`}>
              {t === 'coverage' ? 'My Coverage' : t === 'claims' ? `Claims (${claims.length})` : 'Calculator'}
            </button>
          ))}
        </div>

        {tab === 'coverage' && (
          loading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-white rounded-lg border animate-pulse" />)}</div>
          ) : insuredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-[#e8e4de]">
              <p className="text-slate-500 mb-2">No insured bookings</p>
              <p className="text-xs text-slate-400">Add insurance when booking a delivery for cargo protection</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insuredBookings.map(b => (
                <div key={b.bookingId} className="bg-white rounded-lg border border-[#e8e4de] p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-[#1a1a1a]">{b.trackingCode || b.bookingId.slice(0, 8)}</div>
                      <div className="text-xs text-slate-400">{b.cargoDescription}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[b.insuranceTier || ''] || 'bg-slate-100'}`}>
                      {b.insuranceTier} cover
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
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
            <div className="text-center py-16 bg-white rounded-lg border border-[#e8e4de]">
              <p className="text-slate-500 mb-2">No insurance claims</p>
              <p className="text-xs text-slate-400">File a claim from the <Link href="/disputes" className="text-[#C6904D]">disputes</Link> page for insured bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map(c => (
                <div key={c.claimId} className="bg-white rounded-lg border border-[#e8e4de] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1a1a1a]">{c.claimType === 'DAMAGE' ? 'Damage Claim' : 'Loss Claim'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.claimStatus] || 'bg-slate-100'}`}>
                          {c.claimStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.trackingCode} — {c.cargoDescription}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.insuranceTier || ''] || 'bg-slate-100'}`}>
                      {c.insuranceTier}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{c.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
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
          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Insurance Premium Calculator</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Declared Value (GBP)</label>
                <input type="number" min="0" step="100" value={calcValue} onChange={e => setCalcValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#C6904D] outline-none"
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Cargo Category</label>
                <select value={calcCategory} onChange={e => setCalcCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#C6904D] outline-none">
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
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Cross-Border?</label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={calcCrossBorder} onChange={e => setCalcCrossBorder(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-600">Yes, crossing borders</span>
                </label>
              </div>
            </div>
            <button onClick={getEstimate}
              className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors mb-6">
              Calculate
            </button>

            {estimates && (
              <div className="grid sm:grid-cols-3 gap-4">
                {estimates.map(e => (
                  <div key={e.tier.id} className={`rounded-lg border-2 p-5 ${e.recommended ? 'border-[#C6904D] bg-amber-50/30' : 'border-[#e8e4de]'}`}>
                    {e.recommended && <div className="text-[10px] font-bold text-[#C6904D] uppercase tracking-wider mb-2">Recommended</div>}
                    <div className="font-semibold text-[#1a1a1a] mb-1">{e.tier.name}</div>
                    <div className="text-xs text-slate-400 mb-3">{e.tier.description}</div>
                    <div className="text-2xl font-bold text-[#1a1a1a] mb-1">\u00A3{e.premiumGBP.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mb-3">\u20AC{e.premiumEUR.toFixed(2)} | Excess: \u00A3{e.tier.excessGBP}</div>
                    <ul className="space-y-1">
                      {e.tier.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">✓</span>{f}
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
