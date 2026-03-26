'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

interface Review {
  id: string
  rating: number
  comment: string
  communicationRating: number
  timelinessRating: number
  conditionRating: number
  response?: string
  createdAt: string
  bookingId: string
  author: { id: string; name: string; avatarUrl?: string }
  target: { id: string; name: string; avatarUrl?: string }
}

interface Booking {
  id: string
  reference: string
  status: string
  targetUser: { id: string; name: string }
  listingTitle?: string
  completedAt?: string
}

interface ReviewsResponse {
  reviews: Review[]
  average: number
  count: number
}

function StarRating({ rating, onChange, interactive = false, size = 'md' }: {
  rating: number
  onChange?: (val: number) => void
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hovered, setHovered] = useState(0)
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => interactive && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = interactive ? (hovered || rating) >= star : rating >= star
        return (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={active ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={active ? 0 : 1.5}
            className={`${sizeClass} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            style={{ color: active ? '#EAB308' : '#e2e8f0' }}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        )
      })}
    </div>
  )
}

function SubRatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#6B7C86] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#102535] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#FF6A2A] transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[#9AADB8] w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default function ReviewsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'about' | 'written'>('about')
  const [aboutMeReviews, setAboutMeReviews] = useState<Review[]>([])
  const [writtenReviews, setWrittenReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<{ summary: string; strengths: string[]; improvements: string[]; themes: string[] } | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  // New review state
  const [showNewReview, setShowNewReview] = useState(false)
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [newCommunication, setNewCommunication] = useState(0)
  const [newTimeliness, setNewTimeliness] = useState(0)
  const [newCondition, setNewCondition] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const fetchReviews = useCallback(async () => {
    if (!token || !user) return
    try {
      const res = await fetch(`/api/reviews?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: ReviewsResponse = await res.json()
        const reviews = data.reviews || []
        const aboutMe = reviews.filter((r) => r.target.id === user.id)
        const written = reviews.filter((r) => r.author.id === user.id)
        setAboutMeReviews(aboutMe)
        setWrittenReviews(written)
        setAverage(data.average)
        setCount(data.count)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  const fetchCompletedBookings = useCallback(async () => {
    if (!token) return
    setLoadingBookings(true)
    try {
      const res = await fetch('/api/bookings?status=completed', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCompletedBookings(data.bookings || [])
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoadingBookings(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    fetchReviews()
  }, [authLoading, user, router, fetchReviews])

  useEffect(() => {
    if (showNewReview) fetchCompletedBookings()
  }, [showNewReview, fetchCompletedBookings])

  const handleSubmitResponse = async (reviewId: string) => {
    if (!token || !responseText.trim()) return
    setSubmittingResponse(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: responseText }),
      })
      if (res.ok) {
        setRespondingTo(null)
        setResponseText('')
        fetchReviews()
      } else {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error || 'Failed to submit response.')
      }
    } catch (err) {
      console.error('Failed to submit response:', err)
      setSubmitError('Failed to submit response. Please try again.')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!selectedBooking) { setSubmitError('Please select a booking.'); return }
    if (newRating === 0) { setSubmitError('Please select an overall rating.'); return }
    if (!newComment.trim()) { setSubmitError('Please add a comment.'); return }

    const booking = completedBookings.find((b) => b.id === selectedBooking)
    if (!booking) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: selectedBooking,
          targetId: booking.targetUser.id,
          rating: newRating,
          comment: newComment,
          communicationRating: newCommunication || newRating,
          timelinessRating: newTimeliness || newRating,
          conditionRating: newCondition || newRating,
        }),
      })

      if (res.ok) {
        setSubmitSuccess('Review submitted successfully!')
        setSelectedBooking('')
        setNewRating(0)
        setNewCommunication(0)
        setNewTimeliness(0)
        setNewCondition(0)
        setNewComment('')
        setTimeout(() => {
          setShowNewReview(false)
          setSubmitSuccess('')
        }, 2000)
        fetchReviews()
      } else {
        const data = await res.json()
        setSubmitError(data.error || 'Failed to submit review.')
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      setSubmitError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  if (authLoading || loading) {
    return (
      <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#1E3A4D] rounded w-48" />
            <div className="bg-[#162E3D] rounded-xl shadow-sm p-8">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-[#1E3A4D] rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-[#1E3A4D] rounded w-32" />
                  <div className="h-4 bg-[#1E3A4D] rounded w-24" />
                </div>
              </div>
            </div>
            <div className="h-10 bg-[#1E3A4D] rounded w-64" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#162E3D] rounded-xl shadow-sm p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-[#1E3A4D] rounded w-40" />
                  <div className="h-4 bg-[#1E3A4D] rounded w-full" />
                  <div className="h-4 bg-[#1E3A4D] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
      </div>
    )
  }

  if (!user) return null

  const currentReviews = activeTab === 'about' ? aboutMeReviews : writtenReviews

  return (
    <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1">Feedback</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F7F9FB] tracking-[-0.02em]">Reviews</h1>
            <p className="text-sm text-[#6B7C86] mt-1">Manage your ratings and feedback</p>
          </div>
          <button
            onClick={() => setShowNewReview(!showNewReview)}
            className="btn-primary text-sm !py-2.5 !px-5"
          >
            {showNewReview ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Rating Summary */}
        <div className="bg-[#162E3D] rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex flex-col items-center text-center min-w-[120px]">
              <div className="text-5xl font-semibold text-[#F7F9FB]">{average > 0 ? average.toFixed(1) : '—'}</div>
              <StarRating rating={Math.round(average)} size="md" />
              <p className="text-sm text-[#6B7C86] mt-1">
                {count} {count === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            {count > 0 && (
              <div className="flex-1 w-full space-y-2.5 sm:border-l sm:border-slate-100 sm:pl-8">
                <SubRatingBar
                  label="Communication"
                  value={
                    aboutMeReviews.length > 0
                      ? aboutMeReviews.reduce((sum, r) => sum + r.communicationRating, 0) / aboutMeReviews.length
                      : 0
                  }
                />
                <SubRatingBar
                  label="Timeliness"
                  value={
                    aboutMeReviews.length > 0
                      ? aboutMeReviews.reduce((sum, r) => sum + r.timelinessRating, 0) / aboutMeReviews.length
                      : 0
                  }
                />
                <SubRatingBar
                  label="Condition"
                  value={
                    aboutMeReviews.length > 0
                      ? aboutMeReviews.reduce((sum, r) => sum + r.conditionRating, 0) / aboutMeReviews.length
                      : 0
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Review Summary */}
        {aboutMeReviews.length >= 3 && (
          <div className="bg-gradient-to-br from-[#FF6A2A]/5 to-transparent rounded-xl border border-[#FF6A2A]/20 p-6 sm:p-8 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#F7F9FB]">AI Review Summary</h2>
              <button
                onClick={async () => {
                  if (!token || !user) return
                  setLoadingSummary(true)
                  try {
                    const res = await fetch(`/api/ai/review-summary?userId=${user.id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    if (res.ok) setAiSummary(await res.json())
                  } catch { /* ignore */ }
                  finally { setLoadingSummary(false) }
                }}
                disabled={loadingSummary}
                className="px-4 py-2 bg-[#FF6A2A] text-white rounded-lg text-xs font-semibold hover:bg-[#E85A1C] disabled:opacity-50 transition-colors"
              >
                {loadingSummary ? 'Analysing...' : aiSummary ? 'Refresh' : 'Generate Summary'}
              </button>
            </div>
            {aiSummary ? (
              <div className="space-y-3 text-sm">
                <p className="text-[#9AADB8]">{aiSummary.summary}</p>
                {aiSummary.strengths?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[#9ED36A]">Strengths:</span>
                    <ul className="mt-1 space-y-0.5">{aiSummary.strengths.map((s, i) => <li key={i} className="text-xs text-[#6B7C86] flex items-start gap-1"><span className="text-green-500">+</span>{s}</li>)}</ul>
                  </div>
                )}
                {aiSummary.improvements?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[#FF6A2A]">Areas for improvement:</span>
                    <ul className="mt-1 space-y-0.5">{aiSummary.improvements.map((s, i) => <li key={i} className="text-xs text-[#6B7C86] flex items-start gap-1"><span className="text-[#FF6A2A]">-</span>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            ) : !loadingSummary ? (
              <p className="text-xs text-[#6B7C86]">Get an AI-powered analysis of your review themes, strengths, and areas for improvement.</p>
            ) : null}
          </div>
        )}

        {/* Write New Review Form */}
        {showNewReview && (
          <div className="bg-[#162E3D] rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-bold text-[#F7F9FB] mb-6">Write a New Review</h2>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                {submitSuccess}
              </div>
            )}
            {submitError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Booking Selection */}
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Select a Completed Booking</label>
                {loadingBookings ? (
                  <div className="loading-shimmer h-10 rounded-lg" />
                ) : completedBookings.length === 0 ? (
                  <p className="text-sm text-[#6B7C86] italic">No completed bookings available for review.</p>
                ) : (
                  <select
                    value={selectedBooking}
                    onChange={(e) => setSelectedBooking(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2.5 border border-white/10 rounded-lg text-base sm:text-sm text-[#F7F9FB] bg-[#162E3D] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none"
                  >
                    <option value="">Choose a booking...</option>
                    {completedBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.reference} — {b.targetUser.name}{b.listingTitle ? ` (${b.listingTitle})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Overall Rating</label>
                <StarRating rating={newRating} onChange={setNewRating} interactive size="lg" />
              </div>

              {/* Sub-ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Communication</label>
                  <StarRating rating={newCommunication} onChange={setNewCommunication} interactive size="md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Timeliness</label>
                  <StarRating rating={newTimeliness} onChange={setNewTimeliness} interactive size="md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Condition</label>
                  <StarRating rating={newCondition} onChange={setNewCondition} interactive size="md" />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-2">Your Review</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-3 border border-white/10 rounded-lg text-base sm:text-sm text-[#F7F9FB] resize-none focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm !py-2.5 !px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#162E3D] rounded-xl shadow-sm border border-slate-100 p-1 mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'about'
                ? 'bg-[#1d1d1f] text-white shadow-sm'
                : 'text-[#6B7C86] hover:text-white hover:bg-[#162E3D]'
            }`}
          >
            Reviews About Me ({aboutMeReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('written')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'written'
                ? 'bg-[#1d1d1f] text-white shadow-sm'
                : 'text-[#6B7C86] hover:text-white hover:bg-[#162E3D]'
            }`}
          >
            Reviews I&apos;ve Written ({writtenReviews.length})
          </button>
        </div>

        {/* Reviews List */}
        {currentReviews.length === 0 ? (
          <div className="bg-[#162E3D] rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#102535] flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#F7F9FB] mb-1">
              {activeTab === 'about' ? 'No reviews yet' : 'You haven\'t written any reviews'}
            </h3>
            <p className="text-sm text-[#6B7C86] max-w-sm mx-auto">
              {activeTab === 'about'
                ? 'Reviews from other users will appear here after completed bookings.'
                : 'After completing a booking, you can share your experience by writing a review.'}
            </p>
            {activeTab === 'written' && (
              <button
                onClick={() => setShowNewReview(true)}
                className="mt-4 btn-primary text-sm !py-2.5 !px-5"
              >
                Write Your First Review
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentReviews.map((review) => (
              <div key={review.id} className="bg-[#162E3D] rounded-xl shadow-sm border border-slate-100 p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {(activeTab === 'about' ? review.author.name : review.target.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#F7F9FB]">
                        {activeTab === 'about' ? review.author.name : review.target.name}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Comment */}
                <p className="text-sm text-[#9AADB8] leading-relaxed mb-4">{review.comment}</p>

                {/* Sub-ratings */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-[#162E3D] rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-[#6B7C86] mb-0.5">Communication</p>
                    <div className="flex items-center justify-center gap-1">
                      <StarRating rating={review.communicationRating} size="sm" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#6B7C86] mb-0.5">Timeliness</p>
                    <div className="flex items-center justify-center gap-1">
                      <StarRating rating={review.timelinessRating} size="sm" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#6B7C86] mb-0.5">Condition</p>
                    <div className="flex items-center justify-center gap-1">
                      <StarRating rating={review.conditionRating} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Response (for reviews about me) */}
                {activeTab === 'about' && review.response && (
                  <div className="mt-4 pl-4 border-l-2 border-white/10">
                    <p className="text-xs font-medium text-[#6B7C86] mb-1">Your Response</p>
                    <p className="text-sm text-[#9AADB8]">{review.response}</p>
                  </div>
                )}

                {/* Respond Button (for reviews about me without a response) */}
                {activeTab === 'about' && !review.response && (
                  <div className="mt-4">
                    {respondingTo === review.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          placeholder="Write your response..."
                          className="w-full px-4 py-3 border border-white/10 rounded-lg text-base sm:text-sm text-[#F7F9FB] resize-none focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setRespondingTo(null); setResponseText('') }}
                            className="px-4 py-2 text-sm text-[#6B7C86] hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitResponse(review.id)}
                            disabled={submittingResponse || !responseText.trim()}
                            className="btn-primary text-sm !py-2 !px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingResponse ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRespondingTo(review.id); setResponseText('') }}
                        className="text-sm font-medium text-[#F7F9FB] hover:text-white transition-colors hover:underline"
                      >
                        Respond to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  )
}
