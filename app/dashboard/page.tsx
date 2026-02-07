'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'

interface User { id: string; email: string; name: string; role: string; company?: string }

interface Listing {
  id: string; vehicleType: string; originAddress: string; destinationAddress: string
  departureDate: string; totalWeight: number; totalVolume: number
  availableWeight: number; availableVolume: number
  pricePerKg?: number; pricePerCubicMeter?: number; fixedPrice?: number
  isActive: boolean; _count?: { bookings: number }
}

interface Booking {
  id: string; weightBooked: number; volumeBooked: number; itemDescription: string
  totalPrice: number; status: string; createdAt: string
  listing: { originAddress: string; destinationAddress: string; departureDate: string; carrier: { name: string; company?: string } }
  shipper: { name: string; email: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings'>('overview')
  const [listings, setListings] = useState<Listing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [listingForm, setListingForm] = useState({
    vehicleType: 'Van', originAddress: '', destinationAddress: '',
    departureDate: '', totalWeight: '', totalVolume: '',
    pricePerKg: '', fixedPrice: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { router.push('/login'); return }
    try {
      setUser(JSON.parse(userData))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [router])

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const fetchListings = useCallback(async () => {
    if (!token || !user) return
    try {
      const res = await fetch(`/api/listings?carrierId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setListings(data.listings)
      else setFetchError(data.error || 'Failed to load listings')
    } catch (err) {
      console.error('Error:', err)
      setFetchError('Failed to load data. Please refresh the page.')
    }
  }, [token, user])

  const fetchBookings = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setBookings(data.bookings)
      else setFetchError(data.error || 'Failed to load bookings')
    } catch (err) {
      console.error('Error:', err)
      setFetchError('Failed to load data. Please refresh the page.')
    }
  }, [token])

  useEffect(() => {
    if (user?.role === 'CARRIER') fetchListings()
    fetchBookings()
  }, [user, fetchListings, fetchBookings])

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(listingForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreateForm(false)
      setListingForm({ vehicleType: 'Van', originAddress: '', destinationAddress: '', departureDate: '', totalWeight: '', totalVolume: '', pricePerKg: '', fixedPrice: '' })
      fetchListings()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally { setFormLoading(false) }
  }

  const toggleListing = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, isActive: !isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFetchError(data.error || 'Failed to update listing')
        return
      }
      fetchListings()
    } catch (err) {
      console.error('Error:', err)
      setFetchError('Failed to update listing. Please try again.')
    }
  }

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFetchError(data.error || 'Failed to update booking')
        return
      }
      fetchBookings()
      if (user?.role === 'CARRIER') fetchListings()
    } catch (err) {
      console.error('Error:', err)
      setFetchError('Failed to update booking. Please try again.')
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {fetchError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 flex justify-between items-center">
            <p className="text-sm text-red-800">{fetchError}</p>
            <button onClick={() => setFetchError('')} className="text-red-500 hover:text-red-700 text-sm">Dismiss</button>
          </div>
        )}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'CARRIER' ? 'Supplier / Carrier' : user.role === 'ADMIN' ? 'Administrator' : 'Yacht Crew'}
            {user.company && ` | ${user.company}`}
          </p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('overview')}
              className={`${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >Overview</button>
            {user.role === 'CARRIER' && (
              <button onClick={() => setActiveTab('listings')}
                className={`${activeTab === 'listings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >My Listings ({listings.length})</button>
            )}
            <button onClick={() => setActiveTab('bookings')}
              className={`${activeTab === 'bookings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >{user.role === 'CARRIER' ? 'Incoming Bookings' : 'My Bookings'} ({bookings.length})</button>
          </nav>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/marketplace" className="block w-full px-4 py-2 text-center border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
                  Browse Marketplace
                </Link>
                {user.role === 'CARRIER' && (
                  <button onClick={() => { setActiveTab('listings'); setShowCreateForm(true) }}
                    className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create New Listing
                  </button>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Stats</h3>
              {user.role === 'CARRIER' ? (
                <dl className="space-y-2">
                  <div className="flex justify-between"><dt className="text-gray-500">Active Listings</dt><dd className="font-semibold">{listings.filter(l => l.isActive).length}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Total Bookings</dt><dd className="font-semibold">{bookings.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Pending</dt><dd className="font-semibold">{bookings.filter(b => b.status === 'PENDING').length}</dd></div>
                </dl>
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between"><dt className="text-gray-500">Total Bookings</dt><dd className="font-semibold">{bookings.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Active</dt><dd className="font-semibold">{bookings.filter(b => !['DELIVERED', 'CANCELLED'].includes(b.status)).length}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Total Spent</dt><dd className="font-semibold">EUR {bookings.reduce((a, b) => a + b.totalPrice, 0).toFixed(2)}</dd></div>
                </dl>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
                <div><dt className="text-gray-500">Role</dt><dd className="font-medium">{user.role}</dd></div>
                {user.company && <div><dt className="text-gray-500">Company</dt><dd className="font-medium">{user.company}</dd></div>}
              </dl>
            </div>
          </div>
        )}

        {/* LISTINGS TAB (Carrier) */}
        {activeTab === 'listings' && user.role === 'CARRIER' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">My Listings</h3>
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                {showCreateForm ? 'Cancel' : '+ New Listing'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Create New Listing</h4>
                <form onSubmit={handleCreateListing} className="space-y-4">
                  {formError && <div className="rounded-md bg-red-50 p-3"><p className="text-sm text-red-800">{formError}</p></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                      <select className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.vehicleType} onChange={e => setListingForm({ ...listingForm, vehicleType: e.target.value })}>
                        <option>Van</option><option>Sprinter</option><option>Box Truck</option><option>Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                      <input type="date" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.departureDate} onChange={e => setListingForm({ ...listingForm, departureDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Origin</label>
                      <input type="text" required placeholder="e.g., Nice Warehouse" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.originAddress} onChange={e => setListingForm({ ...listingForm, originAddress: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Destination</label>
                      <input type="text" required placeholder="e.g., Port de Antibes Marina" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.destinationAddress} onChange={e => setListingForm({ ...listingForm, destinationAddress: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Weight Capacity (kg)</label>
                      <input type="number" required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.totalWeight} onChange={e => setListingForm({ ...listingForm, totalWeight: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Volume Capacity (m&sup3;)</label>
                      <input type="number" required min="0.1" step="0.1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.totalVolume} onChange={e => setListingForm({ ...listingForm, totalVolume: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per kg (EUR)</label>
                      <input type="number" step="0.01" placeholder="Leave empty for fixed price" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.pricePerKg} onChange={e => setListingForm({ ...listingForm, pricePerKg: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fixed Price (EUR)</label>
                      <input type="number" step="0.01" placeholder="Or set a flat rate" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={listingForm.fixedPrice} onChange={e => setListingForm({ ...listingForm, fixedPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={formLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                    {formLoading ? 'Creating...' : 'Create Listing'}
                  </button>
                </form>
              </div>
            )}

            {listings.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">No listings yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <Link href={`/listings/${listing.id}`} className="flex-1 hover:opacity-80">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {listing.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{listing.vehicleType}</span>
                        </div>
                        <p className="font-semibold mt-1">{listing.originAddress} &rarr; {listing.destinationAddress}</p>
                        <p className="text-sm text-gray-500">{formatDate(listing.departureDate)} | {listing.availableWeight}/{listing.totalWeight} kg | {listing.availableVolume}/{listing.totalVolume} m&sup3;</p>
                        <p className="text-sm text-gray-500">{listing._count?.bookings || 0} booking(s)</p>
                      </Link>
                      <button onClick={() => toggleListing(listing.id, listing.isActive)}
                        className={`px-3 py-1 rounded text-xs font-medium ${listing.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                        {listing.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {user.role === 'CARRIER' ? 'Incoming Bookings' : 'My Bookings'}
            </h3>
            {bookings.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">
                  {user.role === 'CARRIER' ? 'No bookings on your listings yet.' : 'No bookings yet. Browse the marketplace to book a delivery.'}
                </p>
                {user.role !== 'CARRIER' && (
                  <Link href="/marketplace" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Browse Marketplace</Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <Link href={`/bookings/${booking.id}`} className="flex-1 hover:opacity-80">
                        <div className="flex items-center space-x-2 mb-1">
                          <StatusBadge status={booking.status} />
                          <span className="text-sm font-semibold">EUR {booking.totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="font-medium">{booking.listing.originAddress} &rarr; {booking.listing.destinationAddress}</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.listing.departureDate)} | {booking.weightBooked} kg, {booking.volumeBooked} m&sup3;</p>
                        <p className="text-sm text-gray-500">{booking.itemDescription}</p>
                        {user.role === 'CARRIER' && <p className="text-sm text-gray-500">Customer: {booking.shipper.name} ({booking.shipper.email})</p>}
                        {user.role !== 'CARRIER' && <p className="text-sm text-gray-500">Carrier: {booking.listing.carrier.name}</p>}
                        <p className="text-xs text-gray-400 mt-1">Booked: {formatDate(booking.createdAt)}</p>
                      </Link>
                      <div className="flex flex-col space-y-1 ml-4">
                        {user.role === 'CARRIER' && booking.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Confirm</button>
                            <button onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                          </>
                        )}
                        {user.role === 'CARRIER' && booking.status === 'CONFIRMED' && (
                          <button onClick={() => updateBookingStatus(booking.id, 'IN_TRANSIT')}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">Mark In Transit</button>
                        )}
                        {user.role === 'CARRIER' && booking.status === 'IN_TRANSIT' && (
                          <button onClick={() => updateBookingStatus(booking.id, 'DELIVERED')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Mark Delivered</button>
                        )}
                        {user.role !== 'CARRIER' && booking.status === 'PENDING' && (
                          <button onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
