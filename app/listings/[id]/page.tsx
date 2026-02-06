'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'

interface Listing {
  id: string; vehicleType: string; originAddress: string; destinationAddress: string
  departureDate: string; arrivalDate?: string; totalWeight: number; totalVolume: number
  availableWeight: number; availableVolume: number; pricePerKg?: number
  pricePerCubicMeter?: number; fixedPrice?: number; isActive: boolean; createdAt: string
  licensePlate?: string
  carrier: { id: string; name: string; company?: string; email: string; phone?: string; createdAt: string; _count: { listings: number } }
  bookings: { id: string; status: string; weightBooked: number; volumeBooked: number; totalPrice: number; createdAt: string; shipper: { id: string; name: string }; review: { id: string; rating: number; comment?: string; reviewerId: string } | null }[]
  _count: { bookings: number }
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking form
  const [showBooking, setShowBooking] = useState(false)
  const [bookingForm, setBookingForm] = useState({ weightBooked: '', volumeBooked: '', itemDescription: '' })
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  // Edit form
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ vehicleType: '', originAddress: '', destinationAddress: '', departureDate: '', pricePerKg: '', fixedPrice: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.listing) {
          setListing(data.listing)
          setAvgRating(data.avgRating)
          setReviewCount(data.reviewCount)
          setEditForm({
            vehicleType: data.listing.vehicleType,
            originAddress: data.listing.originAddress,
            destinationAddress: data.listing.destinationAddress,
            departureDate: data.listing.departureDate.split('T')[0],
            pricePerKg: data.listing.pricePerKg?.toString() || '',
            fixedPrice: data.listing.fixedPrice?.toString() || '',
          })
        } else {
          setError('Listing not found')
        }
      })
      .catch(() => setError('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [id])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getPrice = () => {
    if (!listing) return ''
    if (listing.fixedPrice) return `EUR ${listing.fixedPrice} flat`
    const parts = []
    if (listing.pricePerKg) parts.push(`EUR ${listing.pricePerKg}/kg`)
    if (listing.pricePerCubicMeter) parts.push(`EUR ${listing.pricePerCubicMeter}/m\u00B3`)
    return parts.join(' + ') || 'Contact for pricing'
  }

  const currentUser = (() => {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem('user')
    if (!data) return null
    try { return JSON.parse(data) } catch { return null }
  })()

  const isOwner = currentUser && listing && listing.carrier.id === currentUser.id

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(''); setBookingSuccess(''); setBookingLoading(true)
    const token = localStorage.getItem('token')
    if (!token) { setBookingError('Please log in to book'); setBookingLoading(false); return }
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: id, ...bookingForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingSuccess(`Booked! Total: EUR ${data.booking.totalPrice.toFixed(2)}`)
      setBookingForm({ weightBooked: '', volumeBooked: '', itemDescription: '' })
      // Refresh listing data
      const updated = await fetch(`/api/listings/${id}`).then(r => r.json())
      if (updated.listing) setListing(updated.listing)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(''); setEditLoading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setEditing(false)
      // Refresh
      const updated = await fetch(`/api/listings/${id}`).then(r => r.json())
      if (updated.listing) setListing(updated.listing)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed')
    } finally { setEditLoading(false) }
  }

  const handleToggle = async () => {
    if (!listing) return
    const token = localStorage.getItem('token')
    await fetch('/api/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, isActive: !listing.isActive }),
    })
    const updated = await fetch(`/api/listings/${id}`).then(r => r.json())
    if (updated.listing) setListing(updated.listing)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/listings?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) router.push('/dashboard')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>
  if (error || !listing) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-500 mb-4">{error || 'This listing does not exist.'}</p>
          <Link href="/marketplace" className="text-blue-600 hover:text-blue-800 font-medium">Back to Marketplace</Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  const capacityPercent = Math.round(((listing.totalWeight - listing.availableWeight) / listing.totalWeight) * 100)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/marketplace" className="text-blue-600 hover:text-blue-800">Marketplace</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">{listing.originAddress} to {listing.destinationAddress}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{listing.vehicleType}</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {listing.isActive ? 'Active' : 'Inactive'}
                </span>
                {avgRating !== null && (
                  <span className="text-sm text-yellow-600 font-medium">
                    {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))} {avgRating.toFixed(1)} ({reviewCount})
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.originAddress} → {listing.destinationAddress}</h1>
              <p className="text-gray-500">{formatDate(listing.departureDate)}{listing.arrivalDate && ` - ${formatDate(listing.arrivalDate)}`}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{getPrice()}</p>
              <p className="text-sm text-gray-500">{listing._count.bookings} booking(s)</p>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Capacity used: {capacityPercent}%</span>
              <span className="text-gray-600">{listing.availableWeight}kg / {listing.availableVolume}m³ available</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${capacityPercent > 80 ? 'bg-red-500' : capacityPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${capacityPercent}%` }} />
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-gray-500">Total Weight</p><p className="font-semibold">{listing.totalWeight} kg</p></div>
            <div><p className="text-gray-500">Total Volume</p><p className="font-semibold">{listing.totalVolume} m³</p></div>
            <div><p className="text-gray-500">Available Weight</p><p className="font-semibold">{listing.availableWeight} kg</p></div>
            <div><p className="text-gray-500">Available Volume</p><p className="font-semibold">{listing.availableVolume} m³</p></div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="mt-6 flex space-x-3 pt-4 border-t border-gray-200">
              <button onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                {editing ? 'Cancel Edit' : 'Edit Listing'}
              </button>
              <button onClick={handleToggle}
                className={`px-4 py-2 text-sm rounded-md ${listing.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {listing.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                Delete
              </button>
            </div>
          )}

          {/* Customer book button */}
          {!isOwner && listing.isActive && listing.availableWeight > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowBooking(!showBooking)}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700">
                {showBooking ? 'Cancel' : 'Book This Van'}
              </button>
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && isOwner && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Edit Listing</h3>
            {editError && <div className="mb-4 rounded-md bg-red-50 p-3"><p className="text-sm text-red-800">{editError}</p></div>}
            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm"
                  value={editForm.vehicleType} onChange={e => setEditForm({ ...editForm, vehicleType: e.target.value })}>
                  <option>Van</option><option>Sprinter</option><option>Box Truck</option><option>Pickup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                <input type="date" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  value={editForm.departureDate} onChange={e => setEditForm({ ...editForm, departureDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Origin</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  value={editForm.originAddress} onChange={e => setEditForm({ ...editForm, originAddress: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  value={editForm.destinationAddress} onChange={e => setEditForm({ ...editForm, destinationAddress: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price per kg (EUR)</label>
                <input type="number" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  value={editForm.pricePerKg} onChange={e => setEditForm({ ...editForm, pricePerKg: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fixed Price (EUR)</label>
                <input type="number" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                  value={editForm.fixedPrice} onChange={e => setEditForm({ ...editForm, fixedPrice: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={editLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Booking form */}
        {showBooking && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Book Van Space</h3>
            {bookingSuccess ? (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800 font-medium">{bookingSuccess}</p>
                <Link href="/dashboard" className="text-sm text-green-700 underline mt-2 inline-block">View in Dashboard</Link>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                {bookingError && <div className="rounded-md bg-red-50 p-3"><p className="text-sm text-red-800">{bookingError}</p></div>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input type="number" step="0.1" required min="0.1" max={listing.availableWeight}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                      placeholder={`Max: ${listing.availableWeight}`}
                      value={bookingForm.weightBooked} onChange={e => setBookingForm({ ...bookingForm, weightBooked: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Volume (m³)</label>
                    <input type="number" step="0.1" required min="0.1" max={listing.availableVolume}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                      placeholder={`Max: ${listing.availableVolume}`}
                      value={bookingForm.volumeBooked} onChange={e => setBookingForm({ ...bookingForm, volumeBooked: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input type="text" required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                      placeholder="e.g., 3 boxes"
                      value={bookingForm.itemDescription} onChange={e => setBookingForm({ ...bookingForm, itemDescription: e.target.value })} />
                  </div>
                </div>
                <button type="submit" disabled={bookingLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium">
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Carrier info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier</h3>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{listing.carrier.name}</p>
              {listing.carrier.company && <p className="text-sm text-gray-500">{listing.carrier.company}</p>}
              <p className="text-sm text-gray-500 mt-1">{listing.carrier._count.listings} listing(s)</p>
              <p className="text-sm text-gray-500">Member since {formatDate(listing.carrier.createdAt)}</p>
            </div>
            {listing.carrier.phone && (
              <p className="text-sm text-gray-600">{listing.carrier.phone}</p>
            )}
          </div>
        </div>

        {/* Booking history (owner only) */}
        {isOwner && listing.bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings ({listing.bookings.length})</h3>
            <div className="space-y-3">
              {listing.bookings.map(b => (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">{b.shipper.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{b.weightBooked}kg / {b.volumeBooked}m³</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">EUR {b.totalPrice.toFixed(2)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
