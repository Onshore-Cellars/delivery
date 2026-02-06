'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Listing {
  id: string
  vehicleType: string
  originAddress: string
  destinationAddress: string
  departureDate: string
  arrivalDate?: string
  availableWeight: number
  availableVolume: number
  totalWeight: number
  totalVolume: number
  pricePerKg?: number
  pricePerCubicMeter?: number
  fixedPrice?: number
  carrier: { id: string; name: string; company?: string }
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ origin: '', destination: '', dateFrom: '', minWeight: '' })
  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState({ weightBooked: '', volumeBooked: '', itemDescription: '' })
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('departureDate')

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')
      const params = new URLSearchParams()
      if (filters.origin) params.append('origin', filters.origin)
      if (filters.destination) params.append('destination', filters.destination)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.minWeight) params.append('minWeight', filters.minWeight)

      params.append('limit', '12')
      params.append('page', page.toString())
      params.append('sortBy', sortBy)
      const response = await fetch(`/api/listings?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setListings(data.listings)
        if (data.pagination) setTotalPages(data.pagination.totalPages)
      }
      else setFetchError(data.error || 'Failed to load listings')
    } catch (err) {
      console.error('Error fetching listings:', err)
      setFetchError('Failed to load listings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters, page, sortBy])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchListings()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError('')
    setBookingSuccess('')
    setBookingLoading(true)

    const token = localStorage.getItem('token')
    if (!token) {
      setBookingError('Please log in to book a delivery')
      setBookingLoading(false)
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          listingId: bookingModal!.id,
          weightBooked: bookingForm.weightBooked,
          volumeBooked: bookingForm.volumeBooked,
          itemDescription: bookingForm.itemDescription,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Booking failed')

      setBookingSuccess(`Booked! Total: EUR ${data.booking.totalPrice.toFixed(2)}`)
      setBookingForm({ weightBooked: '', volumeBooked: '', itemDescription: '' })
      fetchListings()
      setTimeout(() => { setBookingModal(null); setBookingSuccess('') }, 2000)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setBookingLoading(false)
    }
  }

  const getPrice = (listing: Listing) => {
    if (listing.fixedPrice) return `EUR ${listing.fixedPrice} flat`
    const parts = []
    if (listing.pricePerKg) parts.push(`EUR ${listing.pricePerKg}/kg`)
    if (listing.pricePerCubicMeter) parts.push(`EUR ${listing.pricePerCubicMeter}/m3`)
    return parts.join(' + ') || 'Contact for pricing'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Van Space</h2>
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">From</label>
                <input type="text" name="origin" id="origin"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., London"
                  value={filters.origin} onChange={e => setFilters({ ...filters, origin: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">To</label>
                <input type="text" name="destination" id="destination"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Manchester"
                  value={filters.destination} onChange={e => setFilters({ ...filters, destination: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">Date From</label>
                <input type="date" name="dateFrom" id="dateFrom"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="minWeight" className="block text-sm font-medium text-gray-700">Min Weight (kg)</label>
                <input type="number" name="minWeight" id="minWeight"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="50"
                  value={filters.minWeight} onChange={e => setFilters({ ...filters, minWeight: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button type="submit"
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{fetchError}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{listings.length} listing(s) found</p>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white">
            <option value="departureDate">Sort by Date</option>
            <option value="pricePerKg">Sort by Price/kg</option>
            <option value="availableWeight">Sort by Capacity</option>
            <option value="createdAt">Sort by Newest</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-gray-500">Loading listings...</p></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No listings found.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {listing.vehicleType}
                      </span>
                      <span className="text-sm text-gray-500">
                        by {listing.carrier.name}{listing.carrier.company && ` (${listing.carrier.company})`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Route</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.originAddress} &rarr; {listing.destinationAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Departure</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(listing.departureDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Available Space</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.availableWeight} kg / {listing.availableVolume} m&sup3;
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pricing</p>
                        <p className="text-lg font-semibold text-gray-900">{getPrice(listing)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => { setBookingModal(listing); setBookingError(''); setBookingSuccess('') }}
                      className="px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Book Now
                    </button>
                    <Link href={`/listings/${listing.id}`}
                      className="px-6 py-2 text-center border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Book Van Space</h3>
              <button onClick={() => setBookingModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
              <p className="font-medium">{bookingModal.originAddress} &rarr; {bookingModal.destinationAddress}</p>
              <p className="text-gray-500">{formatDate(bookingModal.departureDate)} | {bookingModal.vehicleType}</p>
              <p className="text-gray-500">Available: {bookingModal.availableWeight} kg / {bookingModal.availableVolume} m&sup3;</p>
              <p className="font-medium mt-1">{getPrice(bookingModal)}</p>
            </div>

            {bookingSuccess ? (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800 font-medium">{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                {bookingError && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">{bookingError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="number" step="0.1" required min="0.1" max={bookingModal.availableWeight}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={`Max: ${bookingModal.availableWeight} kg`}
                    value={bookingForm.weightBooked}
                    onChange={e => setBookingForm({ ...bookingForm, weightBooked: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Volume (m&sup3;)</label>
                  <input type="number" step="0.1" required min="0.1" max={bookingModal.availableVolume}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={`Max: ${bookingModal.availableVolume} m3`}
                    value={bookingForm.volumeBooked}
                    onChange={e => setBookingForm({ ...bookingForm, volumeBooked: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Description</label>
                  <input type="text" required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 3 boxes of electronics"
                    value={bookingForm.itemDescription}
                    onChange={e => setBookingForm({ ...bookingForm, itemDescription: e.target.value })}
                  />
                </div>

                {bookingForm.weightBooked && bookingForm.volumeBooked && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium text-blue-900">Estimated Price: EUR {
                      bookingModal.fixedPrice
                        ? bookingModal.fixedPrice.toFixed(2)
                        : (
                          (bookingModal.pricePerKg ? bookingModal.pricePerKg * parseFloat(bookingForm.weightBooked || '0') : 0) +
                          (bookingModal.pricePerCubicMeter ? bookingModal.pricePerCubicMeter * parseFloat(bookingForm.volumeBooked || '0') : 0)
                        ).toFixed(2)
                    }</p>
                  </div>
                )}

                <button type="submit" disabled={bookingLoading}
                  className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
