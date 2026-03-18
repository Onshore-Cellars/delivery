'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

interface Quote {
  id: string
  originPort: string
  destinationPort: string
  cargoDescription: string
  cargoType?: string
  weightKg: number
  volumeM3: number
  preferredDate?: string
  specialRequirements?: string
  quotedPrice?: number
  quotedCurrency: string
  validUntil?: string
  responseMessage?: string
  status: string
  createdAt: string
  requesterId: string
  providerId?: string
  requester: { id: string; name: string; company?: string }
  provider?: { id: string; name: string; company?: string }
  listing?: { id: string; title: string }
}

interface QuoteForm {
  originPort: string
  destinationPort: string
  cargoDescription: string
  cargoType: string
  weightKg: string
  volumeM3: string
  preferredDate: string
  specialRequirements: string
}

interface RespondForm {
  quotedPrice: string
  validUntil: string
  responseMessage: string
}

const emptyQuoteForm: QuoteForm = {
  originPort: '',
  destinationPort: '',
  cargoDescription: '',
  cargoType: '',
  weightKg: '',
  volumeM3: '',
  preferredDate: '',
  specialRequirements: '',
}

const emptyRespondForm: RespondForm = {
  quotedPrice: '',
  validUntil: '',
  responseMessage: '',
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
  QUOTED: { label: 'Quoted', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  ACCEPTED: { label: 'Accepted', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  EXPIRED: { label: 'Expired', classes: 'bg-slate-50 text-slate-500 border border-slate-200' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-50 text-red-600 border border-red-200' },
}

export default function QuotesPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [showNewForm, setShowNewForm] = useState(false)
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuoteForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [respondForm, setRespondForm] = useState<RespondForm>(emptyRespondForm)
  const [responding, setResponding] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/quotes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      } else {
        setError('Failed to load quotes')
      }
    } catch {
      setError('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    fetchQuotes()
  }, [authLoading, user, router, fetchQuotes])

  const receivedQuotes = quotes.filter(q => q.providerId === user?.id)
  const sentQuotes = quotes.filter(q => q.requesterId === user?.id)
  const displayedQuotes = activeTab === 'received' ? receivedQuotes : sentQuotes

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(quoteForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quote request')
      setQuoteForm(emptyQuoteForm)
      setShowNewForm(false)
      fetchQuotes()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create quote request')
    } finally {
      setCreating(false)
    }
  }

  const handleRespond = async (quoteId: string) => {
    if (!token) return
    setResponding(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'respond', ...respondForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to respond')
      setRespondingTo(null)
      setRespondForm(emptyRespondForm)
      fetchQuotes()
    } catch (err) {
      console.error(err)
    } finally {
      setResponding(false)
    }
  }

  const handleAccept = async (quoteId: string) => {
    if (!token) return
    setActionLoading(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to accept quote')
      }
      fetchQuotes()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (quoteId: string) => {
    if (!token) return
    setActionLoading(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel quote')
      }
      fetchQuotes()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-shimmer w-64 h-8 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-[0.15em] mb-1">Pricing</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">Quotes</h1>
            <p className="text-sm text-slate-500 mt-1">Request, manage, and respond to shipping quotes</p>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn-primary text-sm !py-2.5 !px-5"
          >
            {showNewForm ? 'Cancel' : '+ Request Quote'}
          </button>
        </div>

        {/* New Quote Form */}
        {showNewForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#1d1d1f] mb-4">Request a Quote</h2>
            {createError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Origin Port *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    placeholder="e.g. Antibes, France"
                    value={quoteForm.originPort}
                    onChange={e => setQuoteForm({ ...quoteForm, originPort: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Destination Port *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    placeholder="e.g. Palma de Mallorca, Spain"
                    value={quoteForm.destinationPort}
                    onChange={e => setQuoteForm({ ...quoteForm, destinationPort: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Cargo Description *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                  placeholder="e.g. Engine spare parts for MY Eclipse"
                  value={quoteForm.cargoDescription}
                  onChange={e => setQuoteForm({ ...quoteForm, cargoDescription: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Cargo Type</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none bg-white"
                    value={quoteForm.cargoType}
                    onChange={e => setQuoteForm({ ...quoteForm, cargoType: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="Provisions">Provisions</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Wine & Spirits">Wine &amp; Spirits</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    placeholder="e.g. 250"
                    value={quoteForm.weightKg}
                    onChange={e => setQuoteForm({ ...quoteForm, weightKg: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Volume (m&sup3;) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    placeholder="e.g. 1.5"
                    value={quoteForm.volumeM3}
                    onChange={e => setQuoteForm({ ...quoteForm, volumeM3: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Preferred Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    value={quoteForm.preferredDate}
                    onChange={e => setQuoteForm({ ...quoteForm, preferredDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Special Requirements</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none"
                    placeholder="e.g. Refrigerated, fragile, time-sensitive"
                    value={quoteForm.specialRequirements}
                    onChange={e => setQuoteForm({ ...quoteForm, specialRequirements: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNewForm(false); setQuoteForm(emptyQuoteForm); setCreateError('') }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-sm !py-2.5 !px-6 disabled:opacity-50"
                >
                  {creating ? 'Submitting...' : 'Submit Quote Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm border border-slate-100 p-1">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'received'
                ? 'bg-[#1d1d1f] text-white'
                : 'text-slate-500 hover:text-[#1d1d1f] hover:bg-slate-50'
            }`}
          >
            Received
            {receivedQuotes.length > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {receivedQuotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'sent'
                ? 'bg-[#1d1d1f] text-white'
                : 'text-slate-500 hover:text-[#1d1d1f] hover:bg-slate-50'
            }`}
          >
            Sent
            {sentQuotes.length > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                activeTab === 'sent' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {sentQuotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Quotes List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="loading-shimmer h-40 rounded-xl" />
            ))}
          </div>
        ) : displayedQuotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
            <svg className="mx-auto w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 mb-2">
              {activeTab === 'received' ? 'No received quotes yet' : 'No sent quote requests yet'}
            </p>
            <p className="text-sm text-slate-400">
              {activeTab === 'received'
                ? 'Quote requests from shippers will appear here'
                : 'Create a quote request to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedQuotes.map(quote => {
              const isRequester = quote.requesterId === user.id
              const isProvider = quote.providerId === user.id
              const otherParty = isRequester ? quote.provider : quote.requester
              const status = statusConfig[quote.status] || statusConfig.PENDING
              const isRespondingToThis = respondingTo === quote.id

              return (
                <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6">
                    {/* Top row: route + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-[#1d1d1f] truncate">{quote.originPort}</span>
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="font-semibold text-[#1d1d1f] truncate">{quote.destinationPort}</span>
                        </div>
                      </div>
                      <span className={`badge ${status.classes} flex-shrink-0 ml-3`}>{status.label}</span>
                    </div>

                    {/* Cargo details */}
                    <p className="text-sm text-slate-600 mb-3">{quote.cargoDescription}</p>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
                      <div>
                        <span className="text-slate-400">Weight:</span>{' '}
                        <span className="font-medium text-[#1d1d1f]">{quote.weightKg.toFixed(1)} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Volume:</span>{' '}
                        <span className="font-medium text-[#1d1d1f]">{quote.volumeM3.toFixed(1)} m&sup3;</span>
                      </div>
                      {quote.cargoType && (
                        <div>
                          <span className="text-slate-400">Type:</span>{' '}
                          <span className="font-medium text-[#1d1d1f]">{quote.cargoType}</span>
                        </div>
                      )}
                      {quote.preferredDate && (
                        <div>
                          <span className="text-slate-400">Preferred:</span>{' '}
                          <span className="font-medium text-[#1d1d1f]">{formatDate(quote.preferredDate)}</span>
                        </div>
                      )}
                    </div>

                    {quote.specialRequirements && (
                      <p className="text-xs text-slate-400 mb-4 italic">
                        Special: {quote.specialRequirements}
                      </p>
                    )}

                    {/* Quoted price + response */}
                    {quote.quotedPrice != null && (
                      <div className="bg-[#f5f5f7] rounded-lg p-4 border border-[#d2d2d7] mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-[#0071e3] uppercase tracking-wider mb-0.5">Quoted Price</div>
                            <div className="text-2xl font-bold text-[#1d1d1f]">
                              {formatCurrency(quote.quotedPrice, quote.quotedCurrency)}
                            </div>
                          </div>
                          {quote.validUntil && (
                            <div className="text-right">
                              <div className="text-xs text-[#0071e3] uppercase tracking-wider mb-0.5">Valid Until</div>
                              <div className="text-sm font-semibold text-[#1d1d1f]">{formatDate(quote.validUntil)}</div>
                            </div>
                          )}
                        </div>
                        {quote.responseMessage && (
                          <p className="text-sm text-[#1d1d1f] mt-3 pt-3 border-t border-[#d2d2d7]">
                            {quote.responseMessage}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer: other party + actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {otherParty && (
                          <>
                            <div className="w-6 h-6 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-semibold text-[#1d1d1f]">
                                {otherParty.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span>{isRequester ? 'Provider' : 'Requester'}: <span className="font-medium text-[#1d1d1f]">{otherParty.name}</span></span>
                            {otherParty.company && <span className="text-slate-400">&middot; {otherParty.company}</span>}
                          </>
                        )}
                        {!otherParty && (
                          <span className="text-slate-400">Open request &middot; no provider assigned</span>
                        )}
                        <span className="text-slate-300 ml-2">&middot;</span>
                        <span className="text-slate-400">{formatDate(quote.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Carrier: respond to pending quote */}
                        {isProvider && quote.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setRespondingTo(isRespondingToThis ? null : quote.id)
                              setRespondForm(emptyRespondForm)
                            }}
                            className="btn-primary text-xs !py-1.5 !px-3"
                          >
                            {isRespondingToThis ? 'Close' : 'Respond'}
                          </button>
                        )}

                        {/* Requester: accept a quoted quote */}
                        {isRequester && quote.status === 'QUOTED' && (
                          <button
                            onClick={() => handleAccept(quote.id)}
                            disabled={actionLoading === quote.id}
                            className="btn-primary text-xs !py-1.5 !px-3 disabled:opacity-50"
                          >
                            {actionLoading === quote.id ? 'Accepting...' : 'Accept Quote'}
                          </button>
                        )}

                        {/* Either party: cancel active quotes */}
                        {(isRequester || isProvider) &&
                          (quote.status === 'PENDING' || quote.status === 'QUOTED') && (
                            <button
                              onClick={() => handleCancel(quote.id)}
                              disabled={actionLoading === quote.id}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === quote.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Respond form (carrier only) */}
                  {isRespondingToThis && (
                    <div className="bg-slate-50 border-t border-slate-100 p-6">
                      <h3 className="text-sm font-bold text-[#1d1d1f] mb-3">Respond to Quote Request</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Price (EUR) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none bg-white"
                            placeholder="e.g. 1500.00"
                            value={respondForm.quotedPrice}
                            onChange={e => setRespondForm({ ...respondForm, quotedPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Valid Until</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none bg-white"
                            value={respondForm.validUntil}
                            onChange={e => setRespondForm({ ...respondForm, validUntil: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Message</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none bg-white"
                            placeholder="Optional note..."
                            value={respondForm.responseMessage}
                            onChange={e => setRespondForm({ ...respondForm, responseMessage: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setRespondingTo(null); setRespondForm(emptyRespondForm) }}
                          className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRespond(quote.id)}
                          disabled={responding || !respondForm.quotedPrice}
                          className="btn-primary text-xs !py-2 !px-4 disabled:opacity-50"
                        >
                          {responding ? 'Sending...' : 'Send Quote'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
