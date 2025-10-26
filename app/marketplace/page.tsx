'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateBookingModal from '@/components/CreateBookingModal'

interface Listing {
  id: string
  vehicleType: string
  originAddress: string
  destinationAddress: string
  departureDate: string
  arrivalDate?: string
  availableWeight: number
  availableVolume: number
  pricePerKg?: number
  pricePerCubicMeter?: number
  fixedPrice?: number
  carrier: {
    name: string
    company?: string
  }
}

export default function MarketplacePage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    dateFrom: '',
    minWeight: '',
    minVolume: '',
  })

  const fetchListings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.origin) params.append('origin', filters.origin)
      if (filters.destination) params.append('destination', filters.destination)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.minWeight) params.append('minWeight', filters.minWeight)
      if (filters.minVolume) params.append('minVolume', filters.minVolume)

      const response = await fetch(`/api/listings?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setListings(data.listings)
      }
    } catch (err) {
      console.error('Error fetching listings:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleBookNow = (listing: Listing) => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      // Only shippers and yacht clients can book
      if (userData.role !== 'SHIPPER' && userData.role !== 'YACHT_CLIENT') {
        alert('Only shippers and yacht clients can make bookings')
        return
      }
    }

    setSelectedListing(listing)
    setIsBookingModalOpen(true)
  }

  const handleBookingSuccess = () => {
    // Refresh listings to update available capacity
    fetchListings()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚓</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  Onshore Logistics
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/login" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Available Van Space</h2>
          <p className="text-slate-600">Find the perfect delivery solution for your yachting needs</p>
        </div>
          
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-slate-700 mb-1">
                Origin
              </label>
              <input
                type="text"
                name="origin"
                id="origin"
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                placeholder="e.g., Monaco"
                value={filters.origin}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">
                Destination
              </label>
              <input
                type="text"
                name="destination"
                id="destination"
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                placeholder="e.g., Saint-Tropez"
                value={filters.destination}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                name="dateFrom"
                id="dateFrom"
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="minWeight" className="block text-sm font-medium text-slate-700 mb-1">
                Min Weight (kg)
              </label>
              <input
                type="number"
                name="minWeight"
                id="minWeight"
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                placeholder="100"
                value={filters.minWeight}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all shadow-md hover:shadow-lg"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="text-slate-600 mt-4">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-600 text-lg">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                        {listing.vehicleType}
                      </span>
                      <span className="text-sm text-slate-600">
                        by {listing.carrier.name}
                        {listing.carrier.company && ` (${listing.carrier.company})`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Route</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {listing.originAddress} → {listing.destinationAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Departure</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatDate(listing.departureDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Available Weight</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {listing.availableWeight} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Available Volume</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {listing.availableVolume} m³
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-sm text-slate-500 font-medium">Pricing</p>
                    {listing.fixedPrice ? (
                      <p className="text-3xl font-bold text-slate-900">€{listing.fixedPrice}</p>
                    ) : (
                      <div>
                        {listing.pricePerKg && (
                          <p className="text-xl font-semibold text-slate-900">
                            €{listing.pricePerKg}/kg
                          </p>
                        )}
                        {listing.pricePerCubicMeter && (
                          <p className="text-xl font-semibold text-slate-900">
                            €{listing.pricePerCubicMeter}/m³
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleBookNow(listing)}
                      className="mt-4 px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-md hover:shadow-lg"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedListing && (
          <CreateBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => {
              setIsBookingModalOpen(false)
              setSelectedListing(null)
            }}
            onSuccess={handleBookingSuccess}
            listing={selectedListing}
          />
        )}
      </div>
    </div>
  )
}
