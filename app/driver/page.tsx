'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

interface Stop {
  id: string
  trackingCode: string
  status: string
  cargoDescription: string
  weightKg: number
  volumeM3: number
  deliveryAddress?: string
  deliveryCity?: string
  yachtName?: string
  yachtMMSI?: string
  marinaName?: string
  berthNumber?: string
  pickupAddress?: string
  pickupCity?: string
  deliveryTimeWindow?: string
  routeDirection?: string
  listingId: string
  listingTitle: string
  originPort: string
  destinationPort: string
  departureDate: string
  shipper: { id: string; name: string; phone?: string }
  liveTracking: Array<{
    id: string
    shareToken: string
    lat?: number
    lng?: number
    speed?: number
    etaMinutes?: number
    stopsCompleted: number
    stopsTotal: number
    lastUpdated?: string
  }>
}

export default function DriverPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const watchRef = useRef<number | null>(null)

  const fetchRoute = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/routes/active', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setStops(data.stops || [])
      }
    } catch (err) {
      console.error('Error fetching route:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (token) fetchRoute()
  }, [authLoading, user, token, router, fetchRoute])

  const startRoute = async (listingId: string) => {
    if (!token) return
    setError('')
    try {
      const res = await fetch('/api/routes/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchRoute()
      startTracking()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start route')
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      return
    }

    setTracking(true)

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        // Update all active tracking sessions
        updateTrackingPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.speed, pos.coords.heading)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Unable to get location. Please enable GPS.')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
  }

  const stopTracking = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setTracking(false)
  }

  const updateTrackingPosition = async (lat: number, lng: number, speed: number | null, heading: number | null) => {
    if (!token) return
    // Update each active tracking session
    for (const stop of stops) {
      if (stop.liveTracking.length > 0) {
        const session = stop.liveTracking[0]
        try {
          const res = await fetch('/api/tracking/live', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              bookingId: stop.id,
              lat,
              lng,
              speed: speed ? Math.round(speed * 3.6) : undefined, // m/s to km/h
              heading: heading || undefined,
            }),
          })
          if (!res.ok) {
            setError('Failed to update tracking position. Retrying on next update.')
          }
        } catch (err) {
          console.error('Tracking update error:', err)
          setError('Failed to update tracking position. Retrying on next update.')
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="loading-shimmer w-64 h-8 rounded-xl" />
      </div>
    )
  }

  if (!user.canCarry) {
    return (
      <div className="page-container narrow text-center py-20">
        <h2 className="text-xl font-bold text-[#F7F9FB] mb-2">Driver Mode</h2>
        <p className="text-[#6B7C86] mb-4">Enable &ldquo;I can carry / deliver&rdquo; in your profile to access driver mode.</p>
        <Link href="/profile" className="btn-primary text-sm">Update Profile</Link>
      </div>
    )
  }

  const hasActiveTracking = stops.some(s => s.liveTracking.length > 0)
  const uniqueListings = [...new Set(stops.map(s => s.listingId))]

  return (
    <div className="page-container narrow">
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1">Driver Mode</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#F7F9FB] tracking-[-0.02em]">Active Route</h1>
        <p className="text-sm text-[#6B7C86] mt-1">Manage your deliveries and share live tracking with customers.</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-400 ml-3 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Tracking Status */}
      {tracking && position && (
        <div className="bg-[#9ED36A]/10 border border-green-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#9ED36A]/100 animate-pulse" />
              <div>
                <span className="text-sm font-semibold text-[#9ED36A]">Live Tracking Active</span>
                <p className="text-xs text-[#9ED36A] mt-0.5">
                  Position: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <button
              onClick={stopTracking}
              className="text-xs font-semibold text-red-400 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              Stop Tracking
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-28 rounded-2xl" />)}
        </div>
      ) : stops.length === 0 ? (
        <div className="bg-[#162E3D] rounded-2xl border border-white/10 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#102535] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <p className="text-[#F7F9FB] font-semibold mb-1.5">No active deliveries</p>
          <p className="text-sm text-[#6B7C86] mb-5">Create a listing and get bookings to start delivering.</p>
          <Link href="/listings/create" className="btn-primary !text-sm !py-2.5 !px-6">Create Listing</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Start Route Button */}
          {!hasActiveTracking && uniqueListings.map(listingId => {
            const listingStops = stops.filter(s => s.listingId === listingId)
            return (
              <div key={listingId} className="bg-[#162E3D] rounded-2xl border border-white/10 p-5">
                <h3 className="font-bold text-[#F7F9FB] mb-1">{listingStops[0]?.listingTitle}</h3>
                <p className="text-sm text-[#6B7C86] mb-4">
                  {listingStops[0]?.originPort} &rarr; {listingStops[0]?.destinationPort} &middot; {listingStops.length} deliveries
                </p>
                <button
                  onClick={() => startRoute(listingId)}
                  className="btn-primary !text-sm !py-3 w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Start Route &mdash; {listingStops.length} Stops
                </button>
              </div>
            )
          })}

          {/* Active Stops */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Delivery Stops</h2>
            {stops.map((stop, index) => (
              <div key={stop.id} className="bg-[#162E3D] rounded-2xl border border-white/10 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      stop.status === 'DELIVERED' ? 'bg-[#9ED36A]/15 text-[#9ED36A]' :
                      stop.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-[#102535] text-[#6B7C86]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F7F9FB]">{stop.cargoDescription}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {stop.weightKg}kg &middot; {stop.volumeM3}m&sup3;
                        {stop.routeDirection === 'return' && <span className="ml-1 text-[#FF6A2A] font-medium">(Return)</span>}
                      </p>
                      {stop.yachtName && (
                        <p className="text-xs text-[#6B7C86] mt-1">
                          Yacht: <strong>{stop.yachtName}</strong>
                          {stop.yachtMMSI && (
                            <a
                              href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${stop.yachtMMSI}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1.5 text-[#FF6A2A] hover:underline"
                            >
                              Track vessel
                            </a>
                          )}
                        </p>
                      )}
                      {stop.marinaName && (
                        <p className="text-xs text-slate-400">
                          {stop.marinaName}{stop.berthNumber && `, Berth ${stop.berthNumber}`}
                        </p>
                      )}
                      {stop.pickupAddress && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Pickup: {stop.pickupAddress}
                          {' '}
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.pickupAddress)}`}
                             target="_blank" rel="noopener noreferrer"
                             className="text-xs text-[#FF6A2A] hover:underline">
                            Navigate
                          </a>
                        </p>
                      )}
                      {stop.deliveryAddress && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {stop.deliveryAddress}
                          {' '}
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.deliveryAddress)}`}
                             target="_blank" rel="noopener noreferrer"
                             className="text-xs text-[#FF6A2A] hover:underline">
                            Navigate
                          </a>
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        Contact: {stop.shipper.name}
                        {stop.shipper.phone && <span> &middot; {stop.shipper.phone}</span>}
                      </p>
                    </div>
                  </div>
                  {stop.liveTracking.length > 0 && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {stop.trackingCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Start Tracking Button (if route started but tracking not active) */}
          {hasActiveTracking && !tracking && (
            <button
              onClick={startTracking}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Enable Live GPS Tracking
            </button>
          )}
        </div>
      )}
    </div>
  )
}
