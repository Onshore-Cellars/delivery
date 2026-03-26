'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

interface Listing {
  id: string
  title: string
  originPort: string
  destinationPort: string
  departureDate: string
  status: string
  availableKg: number
  availableM3: number
  totalCapacityKg: number
  totalCapacityM3: number
  _count?: { bookings: number }
}

interface Booking {
  id: string
  cargoDescription: string
  weightKg: number
  volumeM3: number
  totalPrice: number
  platformFee: number
  carrierPayout: number
  currency: string
  status: string
  paymentStatus: string
  trackingCode: string
  createdAt: string
  listing: {
    title: string
    originPort: string
    destinationPort: string
    departureDate: string
    carrier: { name: string; company?: string }
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-[#9ED36A]/10 text-[#9ED36A] border-green-500/30',
  FULL: 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20',
  COMPLETED: 'bg-[#102535] text-[#9AADB8] border-white/10',
  CANCELLED: 'bg-red-900/20 text-red-300 border-red-500/30',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PENDING: 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20',
  CONFIRMED: 'bg-[#9ED36A]/10 text-[#9ED36A] border-green-500/30',
  PICKED_UP: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-[#102535] text-[#9AADB8] border-white/10',
}

function PaymentBanner() {
  const searchParams = useSearchParams()
  const payment = searchParams.get('payment')
  if (!payment) return null
  if (payment === 'success') {
    return (
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#9ED36A]/10 border border-green-500/30">
        <p className="text-sm font-medium text-[#9ED36A]">Payment successful! Your booking is confirmed. Check your email for the receipt.</p>
      </div>
    )
  }
  if (payment === 'cancelled') {
    return (
      <div className="mb-6 px-4 py-3 rounded-xl bg-[#FF6A2A]/10 border border-[#FF6A2A]/20">
        <p className="text-sm font-medium text-[#FF6A2A]">Payment was cancelled. Your booking has been created — you can pay from your dashboard.</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'listings' | 'bookings'>('overview')
  const [bookingPage, setBookingPage] = useState(1)
  const BOOKINGS_PER_PAGE = 10
  const [aiConsolidation, setAiConsolidation] = useState<{ suggestions: string[]; potentialSavings: string; reasoning: string } | null>(null)
  const [loadingConsolidation, setLoadingConsolidation] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    setError('')
    const errors: string[] = []
    try {
      if (user?.canCarry || user?.role === 'ADMIN') {
        try {
          const res = await fetch(`/api/listings?carrierId=${user.id}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json()
            setListings(data.listings || [])
          } else {
            const errData = await res.json().catch(() => ({}))
            console.error('Listings fetch failed:', res.status, errData)
            errors.push(`Listings: ${errData.error || `Error ${res.status}`}`)
          }
        } catch (err) {
          console.error('Listings fetch error:', err)
          errors.push('Could not load listings')
        }
      }
      try {
        const bookRes = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
        if (bookRes.ok) {
          const data = await bookRes.json()
          setBookings(data.bookings || [])
        } else {
          const errData = await bookRes.json().catch(() => ({}))
          console.error('Bookings fetch failed:', bookRes.status, errData)
          errors.push(`Bookings: ${errData.error || `Error ${bookRes.status}`}`)
        }
      } catch (err) {
        console.error('Bookings fetch error:', err)
        errors.push('Could not load bookings')
      }
      if (errors.length > 0) setError(errors.join('. ') + '. Please try again.')
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Something went wrong loading your data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (token) fetchData()
  }, [authLoading, user, token, router, fetchData])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="loading-shimmer w-64 h-8 rounded-xl" />
      </div>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const tabs = ['overview', ...(user.canCarry ? ['listings'] : []), 'bookings']

  return (
    <div className="page-container">
      <Suspense><PaymentBanner /></Suspense>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F7F9FB] tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-sm text-[#6B7C86] mt-1">
            {user.company && <span>{user.company} &middot; </span>}
            {user.canCarry ? 'Manage your routes and bookings' : 'Track your deliveries'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.canCarry && (
            <Link href="/listings/create" className="btn-primary !text-sm !py-3 !px-5 inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              List Van Space
            </Link>
          )}
          {user.canShip && (
            <Link href="/get-quotes" className="btn-outline !text-sm !py-3 !px-5 inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Send Goods
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              tab === t
                ? 'bg-[#FF6A2A] text-white'
                : 'text-[#6B7C86] hover:text-white hover:bg-[#102535]'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {user.canCarry ? (
                    <>
                      <StatCard label="Active Listings" value={listings.filter(l => l.status === 'ACTIVE').length.toString()} accent />
                      <StatCard label="Total Bookings" value={bookings.length.toString()} />
                      <StatCard label="Revenue" value={formatCurrency(bookings.reduce((sum, b) => sum + b.totalPrice, 0))} />
                      <StatCard label="Fill Rate" value={
                        listings.length > 0
                          ? `${Math.round(listings.reduce((sum, l) => sum + (l.totalCapacityKg > 0 ? ((l.totalCapacityKg - l.availableKg) / l.totalCapacityKg * 100) : 0), 0) / listings.length)}%`
                          : '0%'
                      } />
                    </>
                  ) : (
                    <>
                      <StatCard label="Total Bookings" value={bookings.length.toString()} accent />
                      <StatCard label="Pending" value={bookings.filter(b => b.status === 'PENDING').length.toString()} />
                      <StatCard label="In Transit" value={bookings.filter(b => ['IN_TRANSIT', 'PICKED_UP'].includes(b.status)).length.toString()} />
                      <StatCard label="Total Spent" value={formatCurrency(bookings.reduce((sum, b) => sum + b.totalPrice, 0))} />
                    </>
                  )}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Link href="/analytics" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                    Analytics
                  </Link>
                  <Link href="/notifications" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                    Notifications
                  </Link>
                  <Link href="/insurance" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                    Insurance
                  </Link>
                  <Link href="/disputes" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                    Disputes
                  </Link>
                  {user.canCarry && (
                    <>
                      <Link href="/earnings" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                        Earnings
                      </Link>
                      <Link href="/vehicles" className="px-4 py-3 rounded-xl border border-white/10 text-center text-sm font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                        Vehicles
                      </Link>
                    </>
                  )}
                </div>

                {/* AI Consolidation Suggestions */}
                {bookings.length >= 2 && (
                  <div className="bg-gradient-to-br from-[#FF6A2A]/5 to-transparent rounded-2xl border border-[#FF6A2A]/20 p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="font-bold text-[#F7F9FB] text-base">AI Insights</h2>
                        <p className="text-xs text-[#6B7C86] mt-0.5">Smart suggestions to optimise your deliveries</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLoadingConsolidation(true)
                          try {
                            const pending = bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status))
                            const res = await fetch('/api/ai/consolidation', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({
                                bookings: pending.map(b => ({
                                  origin: b.listing?.originPort, destination: b.listing?.destinationPort,
                                  weightKg: b.weightKg, volumeM3: b.volumeM3, departureDate: b.listing?.departureDate,
                                })),
                                availableListings: listings.filter(l => l.status === 'ACTIVE').map(l => ({
                                  origin: l.originPort, destination: l.destinationPort,
                                  availableKg: l.availableKg, availableM3: l.availableM3, departureDate: l.departureDate,
                                })),
                              }),
                            })
                            if (res.ok) setAiConsolidation(await res.json())
                          } catch { /* ignore */ }
                          finally { setLoadingConsolidation(false) }
                        }}
                        disabled={loadingConsolidation}
                        className="px-4 py-2 bg-[#FF6A2A] text-white rounded-lg text-xs font-semibold hover:bg-[#E85A1C] disabled:opacity-50 transition-colors"
                      >
                        {loadingConsolidation ? 'Analysing...' : aiConsolidation ? 'Refresh' : 'Analyse'}
                      </button>
                    </div>
                    {aiConsolidation ? (
                      <div className="space-y-2">
                        {aiConsolidation.suggestions?.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[#9AADB8]">
                            <span className="text-[#FF6A2A] mt-0.5">*</span>{s}
                          </div>
                        ))}
                        {aiConsolidation.potentialSavings && (
                          <p className="text-xs font-medium text-[#9ED36A] mt-2">Potential savings: {aiConsolidation.potentialSavings}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{aiConsolidation.reasoning}</p>
                      </div>
                    ) : !loadingConsolidation ? (
                      <p className="text-xs text-[#6B7C86]">Analyse your bookings and listings for consolidation opportunities and cost savings.</p>
                    ) : null}
                  </div>
                )}

                {/* Recent bookings */}
                <div className="bg-[#162E3D] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-[#F7F9FB] text-base">Recent Bookings</h2>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="p-10 sm:p-14 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#102535] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <p className="text-[#F7F9FB] font-semibold mb-1.5">No bookings yet</p>
                      <p className="text-sm text-[#6B7C86] mb-5">Browse available listings to get started</p>
                      <Link href="/marketplace" className="btn-primary !text-sm !py-2.5 !px-6">Browse Marketplace</Link>
                    </div>
                  ) : (
                    <div>
                      {bookings.slice((bookingPage - 1) * BOOKINGS_PER_PAGE, bookingPage * BOOKINGS_PER_PAGE).map(b => (
                        <div key={b.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#162E3D] transition-colors gap-2 border-b border-white/10 last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`badge border ${statusColors[b.status] || 'bg-[#102535] text-[#9AADB8]'}`}>
                                {b.status.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-semibold text-[#F7F9FB] truncate">{b.cargoDescription}</span>
                            </div>
                            <div className="mt-1.5 text-xs text-[#6B7C86]">
                              {b.listing.originPort} &rarr; {b.listing.destinationPort} &middot; {formatDate(b.listing.departureDate)}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-bold text-[#F7F9FB]">{formatCurrency(b.totalPrice, b.currency)}</div>
                            {b.trackingCode && <div className="text-xs text-slate-400 font-mono mt-0.5">{b.trackingCode}</div>}
                          </div>
                        </div>
                      ))}
                      {bookings.length > BOOKINGS_PER_PAGE && (
                        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-100">
                          <button
                            onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                            disabled={bookingPage === 1}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-[#9AADB8] hover:bg-[#162E3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-xs text-[#6B7C86]">
                            Page {bookingPage} of {Math.ceil(bookings.length / BOOKINGS_PER_PAGE)}
                          </span>
                          <button
                            onClick={() => setBookingPage(p => Math.min(Math.ceil(bookings.length / BOOKINGS_PER_PAGE), p + 1))}
                            disabled={bookingPage >= Math.ceil(bookings.length / BOOKINGS_PER_PAGE)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-[#9AADB8] hover:bg-[#162E3D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listings tab */}
            {tab === 'listings' && user.canCarry && (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="bg-[#162E3D] rounded-2xl border border-white/10 p-10 sm:p-12 text-center">
                    <p className="text-[#6B7C86] font-medium mb-4">You haven&apos;t created any listings yet</p>
                    <Link href="/listings/create" className="btn-primary !text-sm !py-2.5 !px-6">Create Your First Listing</Link>
                  </div>
                ) : (
                  listings.map(l => (
                    <div key={l.id} className="bg-[#162E3D] rounded-2xl border border-white/10 p-5 sm:p-6 card-hover">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <h3 className="font-bold text-[#F7F9FB]">{l.title}</h3>
                            <span className={`badge border ${statusColors[l.status]}`}>{l.status}</span>
                          </div>
                          <p className="text-sm text-[#6B7C86]">{l.originPort} &rarr; {l.destinationPort} &middot; {formatDate(l.departureDate)}</p>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-sm text-[#6B7C86] mb-1.5">{l.availableKg.toFixed(0)} kg / {l.availableM3.toFixed(1)} m&sup3; available</div>
                          <div className="w-full sm:w-32 h-2 bg-[#102535] rounded-full overflow-hidden">
                            <div className="h-full bg-[#FF6A2A] rounded-full transition-all" style={{ width: `${((l.totalCapacityKg - l.availableKg) / l.totalCapacityKg * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bookings tab */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="bg-[#162E3D] rounded-2xl border border-white/10 p-10 sm:p-12 text-center">
                    <p className="text-[#6B7C86] font-medium mb-4">No bookings yet</p>
                    <Link href="/marketplace" className="btn-primary !text-sm !py-2.5 !px-6">Browse Marketplace</Link>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} className="bg-[#162E3D] rounded-2xl border border-white/10 p-5 sm:p-6 card-hover">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <span className={`badge border ${statusColors[b.status]}`}>{b.status.replace('_', ' ')}</span>
                            <h3 className="font-bold text-[#F7F9FB]">{b.cargoDescription}</h3>
                          </div>
                          <p className="text-sm text-[#6B7C86]">{b.listing.originPort} &rarr; {b.listing.destinationPort} &middot; {formatDate(b.listing.departureDate)}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Carrier: {b.listing.carrier.name}{b.listing.carrier.company && ` (${b.listing.carrier.company})`}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-lg font-bold text-[#F7F9FB]">{formatCurrency(b.totalPrice, b.currency)}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{b.weightKg} kg &middot; {b.volumeM3} m&sup3;</div>
                          {b.paymentStatus && (
                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded ${
                              b.paymentStatus === 'PAID' ? 'bg-[#9ED36A]/10 text-[#9ED36A]' :
                              b.paymentStatus === 'FAILED' ? 'bg-red-900/20 text-red-300' :
                              b.paymentStatus === 'REFUNDED' ? 'bg-purple-50 text-purple-700' :
                              'bg-[#FF6A2A]/10 text-[#FF6A2A]'
                            }`}>{b.paymentStatus}</span>
                          )}
                          {b.trackingCode && (
                            <div className="mt-1.5 inline-flex text-xs font-mono text-[#F7F9FB] bg-[#102535] px-2.5 py-1 rounded-lg">{b.trackingCode}</div>
                          )}
                          <div className="mt-2 flex gap-2 justify-end flex-wrap">
                            <a
                              href={`/api/bookings/${b.id}/invoice/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-medium text-[#FF6A2A] hover:text-[#FF8F5A] transition-colors"
                            >
                              Download Invoice
                            </a>
                            {(b.status === 'DELIVERED' || b.status === 'COMPLETED') && (
                              <Link
                                href={`/marketplace?origin=${encodeURIComponent(b.listing.originPort)}&destination=${encodeURIComponent(b.listing.destinationPort)}`}
                                className="text-[11px] font-medium text-[#6B7C86] hover:text-white transition-colors"
                              >
                                Book Again
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 sm:p-6 transition-shadow hover:shadow-md ${accent ? 'bg-[#FF6A2A] border-[#FF6A2A]' : 'bg-[#162E3D] border-white/10'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-[#e8c994]' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${accent ? 'text-white' : 'text-[#F7F9FB]'}`}>{value}</div>
    </div>
  )
}
