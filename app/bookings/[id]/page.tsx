'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StatusBadge from '@/components/StatusBadge'

interface Booking {
  id: string; weightBooked: number; volumeBooked: number; itemDescription: string
  pickupAddress?: string; deliveryAddress?: string; totalPrice: number; status: string
  createdAt: string; updatedAt: string
  listing: {
    id: string; vehicleType: string; originAddress: string; destinationAddress: string
    departureDate: string; carrier: { id: string; name: string; company?: string; email: string; phone?: string }
  }
  shipper: { id: string; name: string; email: string; phone?: string }
  review: { id: string; rating: number; comment?: string; reviewerId: string; createdAt: string } | null
}

const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED']

export default function BookingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  // Review form
  const [showReview, setShowReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const currentUser = (() => {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem('user')
    if (!data) return null
    try { return JSON.parse(data) } catch { return null }
  })()

  const fetchBooking = () => {
    if (!token) { router.push('/login'); return }
    fetch(`/api/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json() })
      .then(data => { if (data.booking) setBooking(data.booking); else setError('Booking not found') })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBooking() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const isCarrier = booking && currentUser && booking.listing.carrier.id === currentUser.id
  const isCustomer = booking && currentUser && booking.shipper.id === currentUser.id

  const updateStatus = async (status: string) => {
    setActionError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      fetchBooking()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: id, rating: reviewForm.rating, comment: reviewForm.comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReviewSuccess('Review submitted!')
      setShowReview(false)
      fetchBooking()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally { setReviewLoading(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>
  if (error || !booking) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">Back to Dashboard</Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  const currentStep = TIMELINE_STEPS.indexOf(booking.status)
  const isCancelled = booking.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">Booking</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <StatusBadge status={booking.status} />
                <span className="text-sm text-gray-500">Booking #{booking.id.slice(-8)}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {booking.listing.originAddress} → {booking.listing.destinationAddress}
              </h1>
              <p className="text-gray-500">{formatDate(booking.listing.departureDate)} | {booking.listing.vehicleType}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">EUR {booking.totalPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Booked {formatDateTime(booking.createdAt)}</p>
            </div>
          </div>

          {/* Status Timeline */}
          {!isCancelled && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      i <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${i <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                      {step.replace('_', ' ')}
                    </p>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className="hidden" /> // spacer handled by flex
                    )}
                  </div>
                ))}
              </div>
              <div className="flex mt-[-32px] mb-6 px-5">
                {TIMELINE_STEPS.slice(0, -1).map((_, i) => (
                  <div key={i} className="flex-1 px-2">
                    <div className={`h-1 rounded ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800 font-medium">This booking has been cancelled.</p>
            </div>
          )}
        </div>

        {actionError && <div className="mb-4 rounded-md bg-red-50 p-4"><p className="text-sm text-red-800">{actionError}</p></div>}
        {reviewSuccess && <div className="mb-4 rounded-md bg-green-50 p-4"><p className="text-sm text-green-800">{reviewSuccess}</p></div>}

        {/* Actions */}
        {!isCancelled && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {isCarrier && booking.status === 'PENDING' && (
                <>
                  <button onClick={() => updateStatus('CONFIRMED')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Confirm Booking</button>
                  <button onClick={() => updateStatus('CANCELLED')}
                    className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Reject</button>
                </>
              )}
              {isCarrier && booking.status === 'CONFIRMED' && (
                <button onClick={() => updateStatus('IN_TRANSIT')}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700">Mark In Transit</button>
              )}
              {isCarrier && booking.status === 'IN_TRANSIT' && (
                <button onClick={() => updateStatus('DELIVERED')}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Mark Delivered</button>
              )}
              {isCustomer && booking.status === 'PENDING' && (
                <button onClick={() => { if (confirm('Cancel this booking?')) updateStatus('CANCELLED') }}
                  className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200">Cancel Booking</button>
              )}
              {booking.status === 'DELIVERED' && !booking.review && (isCustomer || isCarrier) && (
                <button onClick={() => setShowReview(!showReview)}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600">
                  {showReview ? 'Cancel' : 'Leave a Review'}
                </button>
              )}
              {!isCarrier && !isCustomer && booking.status !== 'DELIVERED' && (
                <p className="text-sm text-gray-500">No actions available.</p>
              )}
              {(isCarrier || isCustomer) && booking.status === 'DELIVERED' && booking.review && (
                <p className="text-sm text-gray-500">Review already submitted.</p>
              )}
            </div>
          </div>
        )}

        {/* Review form */}
        {showReview && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Review</h3>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-3xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
                <textarea rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                  value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="How was your experience?" />
              </div>
              <button type="submit" disabled={reviewLoading}
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium">
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* Existing review */}
        {booking.review && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Review</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-400 text-lg">{'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}</span>
              <span className="text-sm text-gray-500">{booking.review.rating}/5</span>
            </div>
            {booking.review.comment && <p className="text-gray-700">{booking.review.comment}</p>}
          </div>
        )}

        {/* Booking details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Weight</dt><dd className="font-medium">{booking.weightBooked} kg</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Volume</dt><dd className="font-medium">{booking.volumeBooked} m³</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Description</dt><dd className="font-medium">{booking.itemDescription}</dd></div>
              {booking.pickupAddress && <div className="flex justify-between"><dt className="text-gray-500">Pickup</dt><dd className="font-medium">{booking.pickupAddress}</dd></div>}
              {booking.deliveryAddress && <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="font-medium">{booking.deliveryAddress}</dd></div>}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isCarrier ? 'Customer' : 'Carrier'}
            </h3>
            {isCarrier ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{booking.shipper.name}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{booking.shipper.email}</dd></div>
                {booking.shipper.phone && <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{booking.shipper.phone}</dd></div>}
              </dl>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{booking.listing.carrier.name}</dd></div>
                {booking.listing.carrier.company && <div className="flex justify-between"><dt className="text-gray-500">Company</dt><dd className="font-medium">{booking.listing.carrier.company}</dd></div>}
                <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{booking.listing.carrier.email}</dd></div>
                {booking.listing.carrier.phone && <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{booking.listing.carrier.phone}</dd></div>}
              </dl>
            )}
          </div>
        </div>

        {/* Link to listing */}
        <div className="text-center">
          <Link href={`/listings/${booking.listing.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Original Listing →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
