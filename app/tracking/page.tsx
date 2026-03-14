'use client'

import { useState } from 'react'
import Link from 'next/link'

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
}

const statusSteps = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']

export default function TrackingPage() {
  const [code, setCode] = useState('')
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setData(null)

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(code.trim())}/tracking`)
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Not found')
      }
      const d = await res.json()
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Track Shipment</h1>
          <p className="text-slate-500 mt-1">Enter your tracking code to see real-time delivery status.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleTrack} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-sm text-navy-900 font-mono tracking-wider focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none uppercase"
              placeholder="HH-XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={loading} className="btn-primary text-sm !py-3 !px-6 disabled:opacity-50">
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </form>

        {/* Results */}
        {data && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-mono text-slate-400">{data.booking.trackingCode}</span>
                  <h2 className="text-lg font-bold text-navy-900">{data.booking.cargoDescription}</h2>
                </div>
                <span className={`badge border ${
                  data.booking.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  data.booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
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
                            ? 'bg-navy-800 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {i <= currentStep ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-medium ${i <= currentStep ? 'text-navy-700' : 'text-slate-400'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8">
                    <div
                      className="h-full bg-navy-800 transition-all duration-500"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Route & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Route</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <div className="font-bold text-navy-900">{data.route.origin}</div>
                    <div className="text-xs text-slate-400">{formatDate(data.route.departure)}</div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div>
                    <div className="font-bold text-navy-900">{data.route.destination}</div>
                    {data.route.estimatedArrival && (
                      <div className="text-xs text-slate-400">{formatDate(data.route.estimatedArrival)}</div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  Carrier: <span className="font-medium">{data.route.carrier.name}</span>
                  {data.route.carrier.company && <span className="text-slate-400"> ({data.route.carrier.company})</span>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Cargo</h3>
                <dl className="space-y-2 text-sm">
                  {data.booking.cargoType && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Type</dt>
                      <dd className="font-medium text-navy-900">{data.booking.cargoType}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Weight</dt>
                    <dd className="font-medium text-navy-900">{data.booking.weightKg}kg</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Volume</dt>
                    <dd className="font-medium text-navy-900">{data.booking.volumeM3}m&sup3;</dd>
                  </div>
                  {data.booking.deliveryAddress && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Delivery</dt>
                      <dd className="font-medium text-navy-900 text-right">{data.booking.deliveryAddress}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Timeline */}
            {data.events.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Timeline</h3>
                <div className="space-y-0">
                  {data.events.map((event, i) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-navy-700' : 'bg-slate-300'}`} />
                        {i < data.events.length - 1 && <div className="w-px h-full bg-slate-200 my-1" />}
                      </div>
                      <div className="pb-6">
                        <div className="text-sm font-medium text-navy-900">{event.description}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
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
          <div className="text-center text-slate-400 py-12">
            <svg className="mx-auto w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p>Enter a tracking code to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
