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
  basic: 'bg-[#102535] text-[#9AADB8]',
  standard: 'bg-blue-100 text-[#268CB5]',
  premium: 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-300',
  UNDER_REVIEW: 'bg-[#FF6A2A]/15 text-[#FF6A2A]',
  RESOLVED: 'bg-[#9ED36A]/15 text-[#9ED36A]',
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

  if (authLoading) return <div className="min-h-screen bg-[#0B1F2A]" />
  if (!user) return (
    <div className="min-h-screen bg-[#0B1F2A] flex items-center justify-center">
      <p className="text-[#6B7C86]">Please <Link href="/login" className="text-[#FF6A2A]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number, currency: string) => {
    const sym = currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#0B1F2A] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#F7F9FB] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Insurance</h1>

        <div className="flex gap-2 mb-6">
          {(['coverage', 'claims', 'calculator'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[#FF6A2A] text-white' : 'bg-[#162E3D] border border-white/10 text-[#F7F9FB]'}`}>
              {t === 'coverage' ? 'My Coverage' : t === 'claims' ? `Claims (${claims.length})` : 'Calculator'}
            </button>
          ))}
        </div>

        {tab === 'coverage' && (
          loading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-[#162E3D] rounded-lg border animate-pulse" />)}</div>
          ) : insuredBookings.length === 0 ? (
            <div className="text-center py-16 bg-[#162E3D] rounded-lg border border-white/10">
              <p className="text-[#6B7C86] mb-2">No insured bookings</p>
              <p className="text-xs text-slate-400">Add insurance when booking a delivery for cargo protection</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insuredBookings.map(b => (
                <div key={b.bookingId} className="bg-[#162E3D] rounded-lg border border-white/10 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-[#F7F9FB]">{b.trackingCode || b.bookingId.slice(0, 8)}</div>
                      <div className="text-xs text-slate-400">{b.cargoDescription}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColors[b.insuranceTier || ''] || 'bg-[#102535]'}`}>
                      {b.insuranceTier} cover
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-[#6B7C86]">
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
            <div className="text-center py-16 bg-[#162E3D] rounded-lg border border-white/10">
              <p className="text-[#6B7C86] mb-2">No insurance claims</p>
              <p className="text-xs text-slate-400">File a claim from the <Link href="/disputes" className="text-[#FF6A2A]">disputes</Link> page for insured bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map(c => (
                <div key={c.claimId} className="bg-[#162E3D] rounded-lg border border-white/10 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F7F9FB]">{c.claimType === 'DAMAGE' ? 'Damage Claim' : 'Loss Claim'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.claimStatus] || 'bg-[#102535]'}`}>
                          {c.claimStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.trackingCode} — {c.cargoDescription}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[c.insuranceTier || ''] || 'bg-[#102535]'}`}>
                      {c.insuranceTier}
                    </span>
                  </div>
                  <p className="text-sm text-[#9AADB8] mb-3">{c.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#6B7C86]">
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
          <div className="bg-[#162E3D] rounded-lg border border-white/10 p-6">
            <h2 className="font-semibold text-[#F7F9FB] mb-4">Insurance Premium Calculator</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Declared Value (GBP)</label>
                <input type="number" min="0" step="100" value={calcValue} onChange={e => setCalcValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 text-sm focus:border-[#FF6A2A] outline-none"
                  placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Cargo Category</label>
                <select value={calcCategory} onChange={e => setCalcCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 text-sm focus:border-[#FF6A2A] outline-none">
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
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Cross-Border?</label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={calcCrossBorder} onChange={e => setCalcCrossBorder(e.target.checked)} className="rounded" />
                  <span className="text-sm text-[#9AADB8]">Yes, crossing borders</span>
                </label>
              </div>
            </div>
            <button onClick={getEstimate} disabled={calcLoading}
              className="px-5 py-2.5 bg-[#FF6A2A] text-white rounded-lg text-sm font-semibold hover:bg-[#E85A1C] disabled:opacity-50 transition-colors mb-6">
              {calcLoading ? 'Calculating...' : 'Calculate'}
            </button>

            {calcError && <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400">{calcError}</div>}

            {estimates && (
              <div className="grid sm:grid-cols-3 gap-4">
                {estimates.map(e => (
                  <div key={e.tier.id} className={`rounded-lg border-2 p-5 ${e.recommended ? 'border-[#FF6A2A] bg-[#FF6A2A]/10/30' : 'border-white/10'}`}>
                    {e.recommended && <div className="text-[10px] font-bold text-[#FF6A2A] uppercase tracking-wider mb-2">Recommended</div>}
                    <div className="font-semibold text-[#F7F9FB] mb-1">{e.tier.name}</div>
                    <div className="text-xs text-slate-400 mb-3">{e.tier.description}</div>
                    <div className="text-2xl font-bold text-[#F7F9FB] mb-1">\u00A3{e.premiumGBP.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mb-3">\u20AC{e.premiumEUR.toFixed(2)} | Excess: \u00A3{e.tier.excessGBP}</div>
                    <ul className="space-y-1">
                      {e.tier.features.map((f, i) => (
                        <li key={i} className="text-xs text-[#9AADB8] flex items-start gap-1">
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
