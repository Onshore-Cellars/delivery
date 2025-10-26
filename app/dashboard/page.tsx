'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateListingModal from '@/components/CreateListingModal'

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
}

interface Listing {
  id: string
  vehicleType: string
  originAddress: string
  destinationAddress: string
  departureDate: string
  availableWeight: number
  availableVolume: number
  pricePerKg?: number
  pricePerCubicMeter?: number
  fixedPrice?: number
  isActive: boolean
}

interface Booking {
  id: string
  weightBooked: number
  volumeBooked: number
  itemDescription: string
  totalPrice: number
  status: string
  createdAt: string
  listing: {
    vehicleType: string
    originAddress: string
    destinationAddress: string
    departureDate: string
    carrier: {
      name: string
      company?: string
    }
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user] = useState<User | null>(() => {
    // Initialize user from localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings'>('overview')
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token || !user) {
      router.push('/login')
    }
  }, [router, user])

  const fetchListings = async () => {
    if (user?.role !== 'CARRIER') return
    
    setLoadingListings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/listings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Filter to only show current user's listings
        const userListings = data.listings.filter((l: Listing & { carrierId: string }) => l.carrierId === user.id)
        setListings(userListings)
      }
    } catch (err) {
      console.error('Error fetching listings:', err)
    } finally {
      setLoadingListings(false)
    }
  }

  const fetchBookings = async () => {
    if (user?.role === 'CARRIER' || user?.role === 'ADMIN') return
    
    setLoadingBookings(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'listings' && user?.role === 'CARRIER') {
      fetchListings()
    } else if (activeTab === 'bookings' && (user?.role === 'SHIPPER' || user?.role === 'YACHT_CLIENT')) {
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
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
              <Link href="/marketplace" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                Marketplace
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-slate-700 hover:text-blue-900 font-medium transition-colors">
                  Admin
                </Link>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-slate-700 font-medium">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-900 hover:text-blue-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome, {user.name}!</h2>
          <p className="text-slate-600 mt-2">
            Account Type: <span className="font-semibold text-blue-900">{user.role.replace('_', ' ')}</span>
            {user.company && (
              <> | Company: <span className="font-semibold text-blue-900">{user.company}</span></>
            )}
          </p>
        </div>

        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Overview
            </button>
            {user.role === 'CARRIER' && (
              <button
                onClick={() => setActiveTab('listings')}
                className={`${
                  activeTab === 'listings'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                My Listings
              </button>
            )}
            {(user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                My Bookings
              </button>
            )}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/marketplace"
                  className="block w-full px-4 py-3 text-center border-2 border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50 font-medium transition-all"
                >
                  Browse Marketplace
                </Link>
                {user.role === 'CARRIER' && (
                  <button 
                    onClick={() => setIsCreateListingOpen(true)}
                    className="block w-full px-4 py-3 text-center bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-600 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    Create New Listing
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Info</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-slate-500 font-medium">Email</dt>
                  <dd className="text-sm font-medium text-slate-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 font-medium">Role</dt>
                  <dd className="text-sm font-medium text-blue-900">
                    {user.role.replace('_', ' ')}
                  </dd>
                </div>
                {user.company && (
                  <div>
                    <dt className="text-sm text-slate-500 font-medium">Company</dt>
                    <dd className="text-sm font-medium text-slate-900">{user.company}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {user.role === 'CARRIER' && (
                  <>
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      Account created successfully
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-900 mr-2">→</span>
                      Create your first van listing
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-900 mr-2">→</span>
                      Manage bookings
                    </li>
                  </>
                )}
                {(user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
                  <>
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      Account created successfully
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-900 mr-2">→</span>
                      Browse available routes
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-900 mr-2">→</span>
                      Book space for your deliveries
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'listings' && user.role === 'CARRIER' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Listings</h3>
              <button 
                onClick={() => setIsCreateListingOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create New Listing
              </button>
            </div>
            
            {loadingListings ? (
              <p className="text-gray-600">Loading...</p>
            ) : listings.length === 0 ? (
              <p className="text-gray-600">
                You haven&apos;t created any listings yet. Create your first listing to start offering van space.
              </p>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {listing.vehicleType}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {listing.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {listing.originAddress} → {listing.destinationAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          Departure: {formatDate(listing.departureDate)}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            Available Weight: <span className="font-medium">{listing.availableWeight} kg</span>
                          </p>
                          <p className="text-gray-600">
                            Available Volume: <span className="font-medium">{listing.availableVolume} m³</span>
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        {listing.fixedPrice ? (
                          <p className="text-lg font-bold text-gray-900">€{listing.fixedPrice}</p>
                        ) : (
                          <div className="text-sm">
                            {listing.pricePerKg && <p className="text-gray-900">€{listing.pricePerKg}/kg</p>}
                            {listing.pricePerCubicMeter && <p className="text-gray-900">€{listing.pricePerCubicMeter}/m³</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h3>
            
            {loadingBookings ? (
              <p className="text-gray-600">Loading...</p>
            ) : bookings.length === 0 ? (
              <div>
                <p className="text-gray-600">
                  You haven&apos;t made any bookings yet. Browse the marketplace to find available van space.
                </p>
                <Link
                  href="/marketplace"
                  className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {booking.listing.vehicleType}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {booking.listing.originAddress} → {booking.listing.destinationAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          Carrier: {booking.listing.carrier.name}
                          {booking.listing.carrier.company && ` (${booking.listing.carrier.company})`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Departure: {formatDate(booking.listing.departureDate)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Items: {booking.itemDescription}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            Weight: <span className="font-medium">{booking.weightBooked} kg</span>
                          </p>
                          <p className="text-gray-600">
                            Volume: <span className="font-medium">{booking.volumeBooked} m³</span>
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-gray-900">€{booking.totalPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Booked {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <CreateListingModal
          isOpen={isCreateListingOpen}
          onClose={() => setIsCreateListingOpen(false)}
          onSuccess={fetchListings}
        />
      </div>
    </div>
  )
}
