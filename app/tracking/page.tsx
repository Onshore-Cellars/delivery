'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '../components/AuthProvider'

const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => <div className="w-full h-72 sm:h-96 rounded-2xl bg-[var(--c-canvas-2)] animate-pulse" />,
})

interface TrackingEvent {
  id: string
  status: string
  location?: string
  description: string
  timestamp: string
}

interface TrackingData {
  booking: {
    id: string
    trackingCode: string
    status: string
    cargoDescription: string
    cargoType?: string
    weightKg: number
    volumeM3: number
    deliveryAddress?: string
    createdAt: string
  }
  route: {
    origin: string
    destination: string
    departure: string
    estimatedArrival?: string
    carrier: { name: string; company?: string }
  }
  events: TrackingEvent[]
  live?: { lat: number; lng: number; heading?: number | null; speed?: number | null; etaMinutes?: number | null; lastUpdated?: string | null } | null
}

const statusSteps = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']

interface UserBooking {
  id: string
  trackingCode: string
  status: string
  cargoDescription: string
  createdAt: string
  listing: {
    title: string
    originPort: string
    destinationPort: string
    departureDate: string
    carrier: { name: string; company?: string }
  }
}

export default function TrackingPage() {
  const { user, token } = useAuth()
  const [code, setCode] = useState('')
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userBookings, setUserBookings] = useState<UserBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [shipmentsPage, setShipmentsPage] = useState(1)
  const SHIPMENTS_PER_PAGE = 10

  const fetchUserBookings = useCallback(async () => {
    if (!token) return
    setBookingsLoading(true)
    try {
      const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const d = await res.json()
        setUserBookings((d.bookings || []).filter((b: UserBooking) => b.trackingCode))
      }
    } catch (err) { console.error('Failed to fetch bookings:', err) }
    finally { setBookingsLoading(false) }
  }, [token])

  useEffect(() => { fetchUserBookings() }, [fetchUserBookings])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setData(null)

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(code.trim())}/tracking`)
      const d = await res.json()
      if (!res.ok) {
        throw new Error(d.error || 'Not found')
      }
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const currentStep = data ? statusSteps.indexOf(data.booking.status) : -1

  return (
    <div className="page-container narrow">
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[var(--c-accent)] uppercase tracking-[0.15em] mb-1">Logistics</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--c-ink)] tracking-[-0.02em]">Track Shipment</h1>
          <p className="text-[var(--c-text-3)] mt-1.5">Enter your tracking code to see real-time delivery status.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleTrack} className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-3.5 rounded-xl border border-black/10 bg-[var(--c-surface)]/50 text-sm text-[var(--c-ink)] font-mono tracking-wider focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 focus:bg-[var(--c-surface)] transition-all outline-none uppercase"
              placeholder="OD-XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={loading} className="btn-primary text-sm !py-3 !px-6 disabled:opacity-50">
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-sm text-[var(--c-error)] mt-3">{error}</p>}
        </form>

        {/* User's Active Bookings */}
        {user && !data && userBookings.length > 0 && (
          <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 mb-8">
            <h2 className="text-sm font-bold text-[var(--c-ink)] mb-4">Your Shipments</h2>
            <div className="space-y-2">
              {userBookings.slice((shipmentsPage - 1) * SHIPMENTS_PER_PAGE, shipmentsPage * SHIPMENTS_PER_PAGE).map(b => (
                <button
                  key={b.id}
                  onClick={() => { setCode(b.trackingCode); setTimeout(() => { const form = document.querySelector('form'); if (form) form.requestSubmit() }, 50) }}
                  className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--c-surface)] transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--c-accent)] font-semibold">{b.trackingCode}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        b.status === 'DELIVERED' ? 'bg-[var(--c-success)]/10 text-[var(--c-success)]' :
                        b.status === 'IN_TRANSIT' ? 'bg-[var(--c-info)]/10 text-[var(--c-info)]' :
                        b.status === 'CANCELLED' ? 'bg-[var(--c-error)]/10 text-[var(--c-error)]' :
                        'bg-[var(--c-accent)]/10 text-[var(--c-accent)]'
                      }`}>{b.status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-[var(--c-text-3)] mt-0.5 truncate">
                      {b.listing.originPort} &rarr; {b.listing.destinationPort}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[var(--c-text-3)] group-hover:text-[var(--c-accent)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
            {userBookings.length > SHIPMENTS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 pt-3 mt-2 border-t border-[var(--c-border)]">
                <button
                  onClick={() => setShipmentsPage(p => Math.max(1, p - 1))}
                  disabled={shipmentsPage === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 text-[var(--c-text-2)] hover:bg-[var(--c-surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-[var(--c-text-3)]">
                  Page {shipmentsPage} of {Math.ceil(userBookings.length / SHIPMENTS_PER_PAGE)}
                </span>
                <button
                  onClick={() => setShipmentsPage(p => Math.min(Math.ceil(userBookings.length / SHIPMENTS_PER_PAGE), p + 1))}
                  disabled={shipmentsPage >= Math.ceil(userBookings.length / SHIPMENTS_PER_PAGE)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 text-[var(--c-text-2)] hover:bg-[var(--c-surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        {user && !data && bookingsLoading && (
          <div className="mb-8"><div className="loading-shimmer w-full h-32 rounded-2xl" /></div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Progress */}
            <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-mono text-[var(--c-text-2)]">{data.booking.trackingCode}</span>
                  <h2 className="text-lg font-bold text-[var(--c-ink)]">{data.booking.cargoDescription}</h2>
                </div>
                <span className={`badge border ${
                  data.booking.status === 'DELIVERED' ? 'bg-[var(--c-success)]/10 text-[var(--c-success)] border-[var(--c-success)]/40' :
                  data.booking.status === 'CANCELLED' ? 'bg-[var(--c-error)]/10 text-[var(--c-error)] border-[var(--c-error)]/30' :
                  'bg-[var(--c-info)]/10 text-[var(--c-info)] border-[var(--c-info)]'
                }`}>
                  {data.booking.status.replace('_', ' ')}
                </span>
              </div>

              {/* Progress bar */}
              {data.booking.status !== 'CANCELLED' && (
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {statusSteps.map((step, i) => (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                          i <= currentStep
                            ? 'bg-[var(--c-accent)] text-white'
                            : 'bg-[var(--c-canvas-2)] text-[var(--c-text-2)]'
                        }`}>
                          {i <= currentStep ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-medium ${i <= currentStep ? 'text-[var(--c-ink)]' : 'text-[var(--c-text-2)]'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--c-canvas-2)] -z-0 mx-8">
                    <div
                      className="h-full bg-[var(--c-accent)] transition-all duration-500"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live map */}
            {data.live && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--c-text-2)] uppercase tracking-wider">Live position</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--c-text-2)]">
                    {typeof data.live.etaMinutes === 'number' && <span>ETA <span className="font-[family-name:var(--font-mono)] font-semibold text-[var(--c-ink)]">{data.live.etaMinutes} min</span></span>}
                    {typeof data.live.speed === 'number' && <span className="font-[family-name:var(--font-mono)]">{Math.round(data.live.speed)} km/h</span>}
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--c-success)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-success)] animate-pulse" />Live</span>
                  </div>
                </div>
                <LiveMap lat={data.live.lat} lng={data.live.lng} />
              </div>
            )}

            {/* Route & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6">
                <h3 className="text-sm font-semibold text-[var(--c-text-2)] uppercase tracking-wider mb-3">Route</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <div className="font-bold text-[var(--c-ink)]">{data.route.origin}</div>
                    <div className="text-xs text-[var(--c-text-2)]">{formatDate(data.route.departure)}</div>
                  </div>
                  <svg className="w-5 h-5 text-[var(--c-text-3)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div>
                    <div className="font-bold text-[var(--c-ink)]">{data.route.destination}</div>
                    {data.route.estimatedArrival && (
                      <div className="text-xs text-[var(--c-text-2)]">{formatDate(data.route.estimatedArrival)}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-[var(--c-text-2)]">
                  Carrier: <span className="font-medium">{data.route.carrier.name}</span>
                  {data.route.carrier.company && <span className="text-[var(--c-text-2)]"> ({data.route.carrier.company})</span>}
                </div>
              </div>

              <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6">
                <h3 className="text-sm font-semibold text-[var(--c-text-2)] uppercase tracking-wider mb-3">Cargo</h3>
                <dl className="space-y-2 text-sm">
                  {data.booking.cargoType && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--c-text-3)]">Type</dt>
                      <dd className="font-medium text-[var(--c-ink)]">{data.booking.cargoType}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[var(--c-text-3)]">Weight</dt>
                    <dd className="font-medium text-[var(--c-ink)]">{data.booking.weightKg}kg</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--c-text-3)]">Volume</dt>
                    <dd className="font-medium text-[var(--c-ink)]">{data.booking.volumeM3}m&sup3;</dd>
                  </div>
                  {data.booking.deliveryAddress && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--c-text-3)]">Delivery</dt>
                      <dd className="font-medium text-[var(--c-ink)] text-right">{data.booking.deliveryAddress}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Timeline */}
            {data.events.length > 0 && (
              <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6">
                <h3 className="text-sm font-semibold text-[var(--c-text-2)] uppercase tracking-wider mb-4">Timeline</h3>
                <div className="space-y-0">
                  {data.events.map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-canvas-2)]'}`} />
                        {i < data.events.length - 1 && <div className="w-px h-full bg-[var(--c-canvas-2)] my-1" />}
                      </div>
                      <div className="pb-6">
                        <div className="text-sm font-medium text-[var(--c-ink)]">{event.description}</div>
                        <div className="text-xs text-[var(--c-text-2)] mt-0.5">
                          {formatDate(event.timestamp)}
                          {event.location && <span> &middot; {event.location}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!data && !loading && (
          <div className="text-center text-[var(--c-text-2)] py-8 sm:py-12">
            <svg className="mx-auto w-16 h-16 text-[var(--c-text-3)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p>Enter a tracking code to get started</p>
          </div>
        )}
      </div>
  )
}
