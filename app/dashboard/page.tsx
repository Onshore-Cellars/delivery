'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  currency: string
  status: string
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
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FULL: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PICKED_UP: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'listings' | 'bookings'>('overview')

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      if (user?.role === 'CARRIER') {
        const res = await fetch('/api/listings?limit=100', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          // Filter to only this carrier's listings
          setListings(data.listings?.filter((l: Listing & { carrier: { id: string } }) => l.carrier?.id === user.id) || [])
        }
      }
      const bookRes = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      if (bookRes.ok) {
        const data = await bookRes.json()
        setBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (token) fetchData()
  }, [authLoading, user, token, router, fetchData])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-shimmer w-64 h-8 rounded-lg" />
      </div>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-[0.15em] mb-1">Dashboard</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-[-0.02em]">Welcome back, {user.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {user.company && <span>{user.company} &middot; </span>}
              {user.role === 'CARRIER' ? 'Manage your routes and bookings' : 'Track your deliveries'}
            </p>
          </div>
          {user.role === 'CARRIER' && (
            <Link href="/listings/create" className="mt-3 sm:mt-0 btn-gold text-sm !py-2.5 !px-5 inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              List Van Space
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 sm:mb-10 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 overflow-x-auto">
          {['overview', ...(user.role === 'CARRIER' ? ['listings'] : []), 'bookings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-40 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {user.role === 'CARRIER' && (
                    <>
                      <StatCard label="Active Listings" value={listings.filter(l => l.status === 'ACTIVE').length.toString()} />
                      <StatCard label="Total Bookings" value={bookings.length.toString()} />
                      <StatCard
                        label="Revenue"
                        value={formatCurrency(bookings.reduce((sum, b) => sum + b.totalPrice, 0))}
                      />
                      <StatCard label="Avg. Fill Rate" value={
                        listings.length > 0
                          ? `${Math.round(listings.reduce((sum, l) => sum + ((l.totalCapacityKg - l.availableKg) / l.totalCapacityKg * 100), 0) / listings.length)}%`
                          : '0%'
                      } />
                    </>
                  )}
                  {user.role !== 'CARRIER' && (
                    <>
                      <StatCard label="Total Bookings" value={bookings.length.toString()} />
                      <StatCard label="Pending" value={bookings.filter(b => b.status === 'PENDING').length.toString()} />
                      <StatCard label="In Transit" value={bookings.filter(b => ['IN_TRANSIT', 'PICKED_UP'].includes(b.status)).length.toString()} />
                      <StatCard
                        label="Total Spent"
                        value={formatCurrency(bookings.reduce((sum, b) => sum + b.totalPrice, 0))}
                      />
                    </>
                  )}
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 overflow-hidden">
                  <div className="px-5 sm:px-6 py-5 border-b border-slate-100/80">
                    <h2 className="font-bold text-navy-900 text-base">Recent Bookings</h2>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="p-14 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <p className="text-slate-500 font-medium mb-1.5">No bookings yet</p>
                      <p className="text-sm text-slate-400 mb-5">Browse available listings to get started</p>
                      <Link href="/marketplace" className="btn-primary text-sm !py-2.5 !px-6">Browse Marketplace</Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className={`badge border ${statusColors[b.status] || 'bg-slate-100 text-slate-600'}`}>
                                {b.status.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-medium text-navy-900 truncate">{b.cargoDescription}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {b.listing.originPort} &rarr; {b.listing.destinationPort} &middot; {formatDate(b.listing.departureDate)}
                            </div>
                          </div>
                          <div className="text-left sm:text-right ml-0 sm:ml-4">
                            <div className="text-sm font-semibold text-navy-900">{formatCurrency(b.totalPrice, b.currency)}</div>
                            {b.trackingCode && <div className="text-xs text-slate-400 font-mono">{b.trackingCode}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listings tab (carriers) */}
            {tab === 'listings' && user.role === 'CARRIER' && (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                    <p className="text-slate-400 mb-4">You haven&apos;t created any listings yet</p>
                    <Link href="/listings/create" className="btn-gold text-sm !py-2.5 !px-6">Create Your First Listing</Link>
                  </div>
                ) : (
                  listings.map(l => (
                    <div key={l.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 card-hover">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-navy-900">{l.title}</h3>
                            <span className={`badge border ${statusColors[l.status]}`}>{l.status}</span>
                          </div>
                          <p className="text-sm text-slate-500">
                            {l.originPort} &rarr; {l.destinationPort} &middot; {formatDate(l.departureDate)}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-sm text-slate-500">
                            {l.availableKg.toFixed(0)}kg / {l.availableM3.toFixed(1)}m&sup3; available
                          </div>
                          <div className="mt-1 w-full sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-navy-600 rounded-full"
                              style={{ width: `${((l.totalCapacityKg - l.availableKg) / l.totalCapacityKg * 100)}%` }}
                            />
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
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
                    <p className="text-slate-400 mb-4">No bookings yet</p>
                    <Link href="/marketplace" className="btn-primary text-sm !py-2.5 !px-6">Browse Marketplace</Link>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 card-hover">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`badge border ${statusColors[b.status]}`}>{b.status.replace('_', ' ')}</span>
                            <h3 className="font-semibold text-navy-900">{b.cargoDescription}</h3>
                          </div>
                          <p className="text-sm text-slate-500">
                            {b.listing.originPort} &rarr; {b.listing.destinationPort} &middot; {formatDate(b.listing.departureDate)}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Carrier: {b.listing.carrier.name}{b.listing.carrier.company && ` (${b.listing.carrier.company})`}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-lg font-bold text-navy-900">{formatCurrency(b.totalPrice, b.currency)}</div>
                          <div className="text-xs text-slate-400">{b.weightKg}kg &middot; {b.volumeM3}m&sup3;</div>
                          {b.trackingCode && (
                            <div className="mt-1 text-xs font-mono text-navy-500 bg-navy-50 px-2 py-0.5 rounded">{b.trackingCode}</div>
                          )}
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
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-5 sm:p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
      <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-[0.12em]">{label}</div>
      <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em]">{value}</div>
    </div>
  )
}
