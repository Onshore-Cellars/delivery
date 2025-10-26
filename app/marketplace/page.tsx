'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Yachting Logistics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Van Space</h2>
          
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">
                  Origin
                </label>
                <input
                  type="text"
                  name="origin"
                  id="origin"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Monaco"
                  value={filters.origin}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  id="destination"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Saint-Tropez"
                  value={filters.destination}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                  Date From
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  id="dateFrom"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label htmlFor="minWeight" className="block text-sm font-medium text-gray-700">
                  Min Weight (kg)
                </label>
                <input
                  type="number"
                  name="minWeight"
                  id="minWeight"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="100"
                  value={filters.minWeight}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No listings found. Try adjusting your filters.</p>
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
                        by {listing.carrier.name}
                        {listing.carrier.company && ` (${listing.carrier.company})`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Route</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.originAddress} → {listing.destinationAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Departure</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(listing.departureDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Available Weight</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.availableWeight} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Available Volume</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.availableVolume} m³
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-sm text-gray-500">Pricing</p>
                    {listing.fixedPrice ? (
                      <p className="text-2xl font-bold text-gray-900">€{listing.fixedPrice}</p>
                    ) : (
                      <div>
                        {listing.pricePerKg && (
                          <p className="text-lg font-semibold text-gray-900">
                            €{listing.pricePerKg}/kg
                          </p>
                        )}
                        {listing.pricePerCubicMeter && (
                          <p className="text-lg font-semibold text-gray-900">
                            €{listing.pricePerCubicMeter}/m³
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard?bookListing=${listing.id}`)}
                      className="mt-4 px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
