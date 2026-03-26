'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface Dispute {
  id: string
  type: string
  status: string
  description: string
  evidence: string[]
  claimAmount?: number
  priority?: string
  createdAt: string
  updatedAt: string
  booking: { id: string; trackingCode?: string; cargoDescription?: string; totalPrice?: number; currency?: string }
  raisedBy: { id: string; name: string; company?: string }
  against: { id: string; name: string; company?: string }
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-[#FF6A2A]/15 text-[#FF6A2A]',
  RESOLVED: 'bg-[#9ED36A]/15 text-[#9ED36A]',
  APPEALED: 'bg-purple-100 text-purple-700',
}

const typeLabels: Record<string, string> = {
  DAMAGE: 'Cargo Damage',
  LOSS: 'Cargo Loss',
  LATE_DELIVERY: 'Late Delivery',
  OVERCHARGE: 'Overcharge',
  MISSING_ITEMS: 'Missing Items',
  OTHER: 'Other',
}

export default function DisputesPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [assessingId, setAssessingId] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<Record<string, { recommendation: string; reasoning: string; suggestedResolution: string; fairnessScore: number }>>({})

  const assessDispute = async (d: Dispute) => {
    if (!token || user?.role !== 'ADMIN') return
    setAssessingId(d.id)
    try {
      const res = await fetch('/api/ai/dispute-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          disputeType: d.type,
          description: d.description,
          claimAmount: d.claimAmount,
          bookingTotal: d.booking.totalPrice,
          cargoDescription: d.booking.cargoDescription,
          trackingEvents: [],
          messages: [],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAssessments(prev => ({ ...prev, [d.id]: data }))
      }
    } catch { /* ignore */ }
    finally { setAssessingId(null) }
  }
  const [createForm, setCreateForm] = useState({ bookingId: '', type: 'DAMAGE', description: '', claimAmount: '' })

  const fetchDisputes = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/disputes', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setDisputes(data.disputes || [])
      }
    } catch { setError('Failed to load disputes') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  const handleCreate = async () => {
    if (!createForm.bookingId || !createForm.description) { setError('Booking ID and description are required'); return }
    if (createForm.claimAmount && parseFloat(createForm.claimAmount) < 0) { setError('Claim amount cannot be negative'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...createForm,
          claimAmount: createForm.claimAmount ? parseFloat(createForm.claimAmount) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) { setShowCreate(false); setCreateForm({ bookingId: '', type: 'DAMAGE', description: '', claimAmount: '' }); fetchDisputes() }
      else setError(data.error || 'Failed to create dispute')
    } catch { setError('Failed to create dispute') }
    finally { setCreating(false) }
  }

  if (authLoading) return <div className="min-h-screen bg-[#faf9f7]" />
  if (!user) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <p className="text-[#6B7C86]">Please <Link href="/login" className="text-[#FF6A2A]">sign in</Link></p>
    </div>
  )

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none'

  return (
    <div id="main-content" className="min-h-screen bg-[#faf9f7] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-display)' }}>Disputes</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors">
            {showCreate ? 'Cancel' : 'Raise Dispute'}
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-200 rounded-lg text-sm text-red-400 flex justify-between"><span>{error}</span><button onClick={() => setError('')} className="text-red-400">&times;</button></div>}

        {showCreate && (
          <div className="bg-[#162E3D] rounded-lg border border-[#e8e4de] p-5 mb-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-4">Raise a Dispute</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Booking ID or Tracking Code</label>
                <input className={inputClass} placeholder="e.g. OD-ABC123" value={createForm.bookingId} onChange={e => setCreateForm({...createForm, bookingId: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Dispute Type</label>
                <select className={inputClass} value={createForm.type} onChange={e => setCreateForm({...createForm, type: e.target.value})}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Description</label>
                <textarea className={inputClass} rows={4} placeholder="Describe what happened..." value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Claim Amount (optional)</label>
                <input className={inputClass} type="number" step="0.01" placeholder="0.00" value={createForm.claimAmount} onChange={e => setCreateForm({...createForm, claimAmount: e.target.value})} />
              </div>
            </div>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
              {creating ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-[#162E3D] rounded-lg border border-[#e8e4de] animate-pulse" />)}</div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-16 bg-[#162E3D] rounded-lg border border-[#e8e4de]">
            <p className="text-[#6B7C86] mb-2">No disputes</p>
            <p className="text-xs text-slate-400">Disputes you raise or receive will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map(d => (
              <div key={d.id} className="bg-[#162E3D] rounded-lg border border-[#e8e4de] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#1a1a1a]">{typeLabels[d.type] || d.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] || 'bg-slate-100 text-[#6B7C86]'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                      {d.priority && <span className="text-xs text-slate-400">Priority: {d.priority}</span>}
                    </div>
                    {d.booking.trackingCode && (
                      <p className="text-xs text-slate-400">Booking: {d.booking.trackingCode}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-[#9AADB8] mb-3">{d.description}</p>

                <div className="flex flex-wrap gap-4 text-xs text-[#6B7C86]">
                  {d.claimAmount && <span className="font-medium">Claim: {d.booking.currency === 'GBP' ? '£' : d.booking.currency === 'EUR' ? '\u20AC' : '$'}{d.claimAmount.toFixed(2)}</span>}
                  <span>Raised by: {d.raisedBy.name}{d.raisedBy.id === user?.id ? ' (you)' : ''}</span>
                  <span>Against: {d.against.name}{d.against.id === user?.id ? ' (you)' : ''}</span>
                </div>

                {/* AI Assessment (admin only) */}
                {user?.role === 'ADMIN' && (
                  <div className="mt-3 pt-3 border-t border-[#e8e4de]">
                    {assessments[d.id] ? (
                      <div className="bg-[#faf9f7] rounded p-3 text-xs space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-[#1a1a1a]">AI Assessment</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FF6A2A]/10 text-[#FF6A2A] font-medium">Fairness: {assessments[d.id].fairnessScore}/10</span>
                        </div>
                        <p className="text-[#9AADB8]"><strong>Recommendation:</strong> {assessments[d.id].recommendation}</p>
                        <p className="text-[#6B7C86]">{assessments[d.id].reasoning}</p>
                        <p className="text-[#9AADB8]"><strong>Suggested Resolution:</strong> {assessments[d.id].suggestedResolution}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => assessDispute(d)}
                        disabled={assessingId === d.id}
                        className="px-3 py-1.5 bg-[#FF6A2A] text-white rounded text-xs font-medium hover:bg-[#b07d3f] disabled:opacity-50 transition-colors"
                      >
                        {assessingId === d.id ? 'Assessing...' : 'AI Assess'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
