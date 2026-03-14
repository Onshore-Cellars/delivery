'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  description?: string
  vehicleType: string
  originPort: string
  originRegion?: string
  destinationPort: string
  destinationRegion?: string
  departureDate: string
  estimatedArrival?: string
  availableKg: number
  availableM3: number
  totalCapacityKg: number
  totalCapacityM3: number
  pricePerKg?: number
  pricePerM3?: number
  flatRate?: number
  currency: string
  featured: boolean
  carrier: {
    id: string
    name: string
    company?: string
    avatarUrl?: string
  }
  _count: { bookings: number }
}

interface BookingForm {
  listingId: string
  cargoDescription: string
  cargoType: string
  weightKg: string
  volumeM3: string
  specialHandling: string
  pickupAddress: string
  deliveryAddress: string
  deliveryNotes: string
}

export default function MarketplacePage() {
  const { user, token } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ origin: '', destination: '', dateFrom: '' })
  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    listingId: '', cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    specialHandling: '', pickupAddress: '', deliveryAddress: '', deliveryNotes: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.origin) params.append('origin', filters.origin)
      if (filters.destination) params.append('destination', filters.destination)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const openBooking = (listing: Listing) => {
    setBookingModal(listing)
    setBookingForm({ ...bookingForm, listingId: listing.id })
    setBookingSuccess(false)
    setBookingError('')
  }

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setBookingLoading(true)
    setBookingError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bookingForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingSuccess(true)
      fetchListings()
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-4">Marketplace</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Origin port or region..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
              value={filters.origin}
              onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
            />
            <input
              type="text"
              placeholder="Destination port..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            />
            <input
              type="date"
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <button
              onClick={fetchListings}
              className="btn-primary text-sm !py-2.5 !px-6 whitespace-nowrap"
            >
              Search Routes
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer h-48 rounded-xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
            <svg className="mx-auto w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-slate-500 mb-2">No routes found</p>
            <p className="text-sm text-slate-400">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listings.map(listing => (
              <div
                key={listing.id}
                className={`bg-white rounded-xl shadow-sm border p-6 card-hover ${listing.featured ? 'border-gold-300 ring-1 ring-gold-200' : 'border-slate-100'}`}
              >
                {listing.featured && (
                  <div className="mb-3">
                    <span className="badge bg-gold-50 text-gold-700 border border-gold-200">Featured</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-navy-900 text-lg">{listing.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {listing.carrier.name}
                      {listing.carrier.company && <span className="text-slate-400"> &middot; {listing.carrier.company}</span>}
                    </p>
                  </div>
                  <span className="badge bg-navy-50 text-navy-700 border border-navy-200">{listing.vehicleType}</span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">From</div>
                    <div className="font-semibold text-navy-900">{listing.originPort}</div>
                    {listing.originRegion && <div className="text-xs text-slate-400">{listing.originRegion}</div>}
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-px bg-slate-300" />
                    <svg className="w-4 h-4 text-slate-400 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">To</div>
                    <div className="font-semibold text-navy-900">{listing.destinationPort}</div>
                    {listing.destinationRegion && <div className="text-xs text-slate-400">{listing.destinationRegion}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Departs</div>
                    <div className="font-semibold text-navy-900">{formatDate(listing.departureDate)}</div>
                  </div>
                </div>

                {/* Capacity & Price */}
                <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Weight</div>
                      <div className="text-sm font-semibold text-navy-900">{listing.availableKg.toFixed(0)}kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Volume</div>
                      <div className="text-sm font-semibold text-navy-900">{listing.availableM3.toFixed(1)}m&sup3;</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {listing.flatRate ? (
                        <div className="text-lg font-bold text-navy-900">{formatCurrency(listing.flatRate, listing.currency)}</div>
                      ) : (
                        <div className="text-sm font-semibold text-navy-900">
                          {listing.pricePerKg && <span>{formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>}
                          {listing.pricePerKg && listing.pricePerM3 && <span className="text-slate-300"> &middot; </span>}
                          {listing.pricePerM3 && <span>{formatCurrency(listing.pricePerM3, listing.currency)}/m&sup3;</span>}
                        </div>
                      )}
                    </div>
                    {user ? (
                      <button
                        onClick={() => openBooking(listing)}
                        className="btn-gold text-sm !py-2 !px-4"
                      >
                        Book
                      </button>
                    ) : (
                      <Link href="/login" className="btn-primary text-sm !py-2 !px-4">
                        Sign in to Book
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-900">Book Space</h2>
                <button
                  onClick={() => setBookingModal(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {bookingModal.originPort} &rarr; {bookingModal.destinationPort} &middot; {formatDate(bookingModal.departureDate)}
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Booking Confirmed!</h3>
                <p className="text-slate-500 mb-6">Your space has been reserved. Check your dashboard for details.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard" className="btn-primary text-sm !py-2">View Dashboard</Link>
                  <button onClick={() => setBookingModal(null)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="p-6 space-y-4">
                {bookingError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm text-red-700">{bookingError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Cargo Description *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Provisions for MY Ocean Dream"
                    value={bookingForm.cargoDescription}
                    onChange={(e) => setBookingForm({ ...bookingForm, cargoDescription: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Cargo Type</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none bg-white"
                    value={bookingForm.cargoType}
                    onChange={(e) => setBookingForm({ ...bookingForm, cargoType: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="Provisions">Provisions</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Wine & Spirits">Wine & Spirits</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Weight (kg) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      max={bookingModal.availableKg}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                      placeholder={`Max ${bookingModal.availableKg}kg`}
                      value={bookingForm.weightKg}
                      onChange={(e) => setBookingForm({ ...bookingForm, weightKg: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Volume (m&sup3;) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      max={bookingModal.availableM3}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                      placeholder={`Max ${bookingModal.availableM3}m\u00B3`}
                      value={bookingForm.volumeM3}
                      onChange={(e) => setBookingForm({ ...bookingForm, volumeM3: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Delivery Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="Marina berth or port address"
                    value={bookingForm.deliveryAddress}
                    onChange={(e) => setBookingForm({ ...bookingForm, deliveryAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Special Handling</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Refrigerated, fragile, temperature-controlled"
                    value={bookingForm.specialHandling}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialHandling: e.target.value })}
                  />
                </div>

                {/* Price estimate */}
                {bookingForm.weightKg && bookingForm.volumeM3 && (
                  <div className="bg-navy-50 rounded-lg p-4 border border-navy-100">
                    <div className="text-xs text-navy-500 uppercase tracking-wider mb-1">Estimated Price</div>
                    <div className="text-2xl font-bold text-navy-900">
                      {bookingModal.flatRate
                        ? formatCurrency(bookingModal.flatRate, bookingModal.currency)
                        : formatCurrency(
                            (bookingModal.pricePerKg ? parseFloat(bookingForm.weightKg) * bookingModal.pricePerKg : 0) +
                            (bookingModal.pricePerM3 ? parseFloat(bookingForm.volumeM3) * bookingModal.pricePerM3 : 0),
                            bookingModal.currency
                          )
                      }
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full btn-gold !py-3 text-sm disabled:opacity-50"
                >
                  {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
