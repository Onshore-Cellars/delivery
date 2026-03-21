'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'

interface ListingDetail {
  id: string
  title: string
  description?: string
  vehicleType: string
  vehicleName?: string
  hasRefrigeration: boolean
  hasTailLift: boolean
  hasGPS: boolean
  insuranceValue?: number
  originPort: string
  originRegion?: string
  originCountry?: string
  destinationPort: string
  destinationRegion?: string
  destinationCountry?: string
  departureDate: string
  estimatedArrival?: string
  isRecurring: boolean
  recurringSchedule?: string
  totalCapacityKg: number
  totalCapacityM3: number
  availableKg: number
  availableM3: number
  maxItemLength?: number
  maxItemWidth?: number
  maxItemHeight?: number
  pricePerKg?: number
  pricePerM3?: number
  flatRate?: number
  currency: string
  minimumCharge?: number
  biddingEnabled: boolean
  minBidPrice?: number
  acceptedCargo?: string
  restrictedItems?: string
  routeDirection?: string
  returnDepartureDate?: string
  returnEstimatedArrival?: string
  returnAvailableKg?: number
  returnAvailableM3?: number
  returnTotalKg?: number
  returnTotalM3?: number
  returnPricePerKg?: number
  returnPricePerM3?: number
  returnFlatRate?: number
  returnNotes?: string
  status: string
  featured: boolean
  viewCount: number
  _count: { bookings: number; bids: number }
  carrier: {
    id: string
    avatarUrl?: string
    avgRating: number
    reviewCount: number
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const { user, token } = useAuth()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [showBooking, setShowBooking] = useState(false)
  const [showBid, setShowBid] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [bookingForm, setBookingForm] = useState({
    cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    specialHandling: '', deliveryAddress: '', vesselName: '', marinaName: '', deliveryNotes: '',
    insuranceTier: '', temperatureReq: '', isFragile: false, isDangerous: false,
    // Collection details
    pickupAddress: '', pickupContact: '', pickupPhone: '', pickupNotes: '', pickupTimeWindow: '',
    // Delivery details
    deliveryCity: '', deliveryCountry: '', deliveryContact: '', deliveryPhone: '', deliveryTimeWindow: '',
    // Value
    declaredValue: '',
  })
  const [bidForm, setBidForm] = useState({ amount: '', weightKg: '', volumeM3: '', message: '' })
  const [messageContent, setMessageContent] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [cargoWarnings, setCargoWarnings] = useState<string[]>([])

  const fetchListing = useCallback(async () => {
    setFetchError('')
    try {
      const res = await fetch(`/api/listings/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data.listing)
      } else {
        setFetchError('Failed to load listing. It may have been removed.')
      }
    } catch (err) {
      console.error(err)
      setFetchError('Failed to load listing. Please try again.')
    }
    finally { setLoading(false) }
  }, [params.id])

  useEffect(() => { fetchListing() }, [fetchListing])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !listing) return
    setFormLoading(true); setFormError(''); setFormSuccess('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id, ...bookingForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Redirect to Stripe checkout if payment URL is provided
      if (data.checkoutUrl) {
        setFormSuccess('Redirecting to payment...')
        window.location.href = data.checkoutUrl
        return
      }
      setFormSuccess(`Booking confirmed! Tracking: ${data.booking.trackingCode}`)
      fetchListing()
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed') }
    finally { setFormLoading(false) }
  }

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !listing) return
    setFormLoading(true); setFormError(''); setFormSuccess('')
    try {
      const res = await fetch(`/api/listings/${listing.id}/bids`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bidForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFormSuccess('Bid submitted successfully!')
      setShowBid(false)
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed') }
    finally { setFormLoading(false) }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !listing) return
    setFormLoading(true); setFormError(''); setFormSuccess('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: listing.carrier.id, content: messageContent, subject: `RE: ${listing.title}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFormSuccess('Message sent!')
      setMessageContent('')
      setShowContact(false)
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed') }
    finally { setFormLoading(false) }
  }

  const classifyCargo = async () => {
    if (!bookingForm.cargoDescription.trim()) return
    setClassifying(true)
    setCargoWarnings([])
    try {
      const res = await fetch('/api/ai/classify-cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: bookingForm.cargoDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Classification failed')
      const result = data.result || data
      setBookingForm(prev => ({
        ...prev,
        cargoType: result.cargoType || prev.cargoType,
        weightKg: (!prev.weightKg || prev.weightKg === '0') && result.estimatedWeightKg ? String(result.estimatedWeightKg) : prev.weightKg,
        volumeM3: (!prev.volumeM3 || prev.volumeM3 === '0') && result.estimatedVolumeM3 ? String(result.estimatedVolumeM3) : prev.volumeM3,
        insuranceTier: result.suggestedInsuranceTier || prev.insuranceTier,
        temperatureReq: result.temperatureRequired || prev.temperatureReq,
        isFragile: result.isFragile ?? prev.isFragile,
        isDangerous: result.isDangerous ?? prev.isDangerous,
        specialHandling: result.specialHandling || prev.specialHandling,
      }))
      if (result.warnings?.length) setCargoWarnings(result.warnings)
    } catch (err) {
      console.error(err)
      setCargoWarnings([err instanceof Error ? err.message : 'Failed to classify cargo'])
    } finally {
      setClassifying(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  if (!listing) return <div className="flex items-center justify-center py-20"><p className="text-slate-500">{fetchError || 'Listing not found'}</p></div>

  const fillPercent = listing.totalCapacityKg > 0 ? Math.round(((listing.totalCapacityKg - listing.availableKg) / listing.totalCapacityKg) * 100) : 0
  let acceptedCargo: string[] = []
  if (listing.acceptedCargo) {
    try {
      const parsed = JSON.parse(listing.acceptedCargo)
      acceptedCargo = Array.isArray(parsed) ? parsed : [listing.acceptedCargo]
    } catch {
      acceptedCargo = listing.acceptedCargo.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  }

  return (
    <div className="page-container">
        <Link href="/marketplace" className="text-sm text-slate-500 hover:text-[#1a1a1a] transition-colors">&larr; Back to Marketplace</Link>

        {formSuccess && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">{formSuccess}</p>
          </div>
        )}
        {formError && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              {listing.featured && <span className="badge bg-[#C6904D]/10 text-[#C6904D] border border-[#C6904D]/20 mb-3">Featured</span>}
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a]">{listing.title}</h1>              {listing.description && <p className="mt-2 text-slate-600 leading-relaxed">{listing.description}</p>}

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="badge bg-[#f5f5f7] text-[#1a1a1a] border border-[#d2d2d7]">{listing.vehicleType}</span>
                {listing.hasRefrigeration && <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">Refrigerated</span>}
                {listing.hasTailLift && <span className="badge bg-purple-50 text-purple-700 border border-purple-200">Tail Lift</span>}
                {listing.hasGPS && <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">GPS Tracked</span>}
                {listing.isRecurring && <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Recurring: {listing.recurringSchedule}</span>}
              </div>
            </div>

            {/* Route */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-[#1a1a1a] mb-4">Route</h2>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Origin</div>
                  <div className="text-lg font-bold text-[#1a1a1a]">{listing.originPort}</div>
                  {listing.originRegion && <div className="text-sm text-slate-500">{listing.originRegion}{listing.originCountry && `, ${listing.originCountry}`}</div>}
                </div>
                <div className="flex flex-col items-center px-4">
                  <div className="w-16 h-px bg-slate-300" />
                  <svg className="w-5 h-5 text-[#C6904D] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Destination</div>
                  <div className="text-lg font-bold text-[#1a1a1a]">{listing.destinationPort}</div>
                  {listing.destinationRegion && <div className="text-sm text-slate-500">{listing.destinationRegion}{listing.destinationCountry && `, ${listing.destinationCountry}`}</div>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-400">Departure</div>
                  <div className="font-semibold text-[#1a1a1a]">{formatDate(listing.departureDate)}</div>
                </div>
                {listing.estimatedArrival && (
                  <div>
                    <div className="text-xs text-slate-400">Est. Arrival</div>
                    <div className="font-semibold text-[#1a1a1a]">{formatDate(listing.estimatedArrival)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-[#1a1a1a] mb-4">Capacity</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Fill rate</span>
                  <span className="font-semibold text-[#1a1a1a]">{fillPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#C6904D] to-[#d4a76a] rounded-full transition-all" style={{ width: `${fillPercent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><div className="text-xs text-slate-400">Available Weight</div><div className="text-lg font-bold text-[#1a1a1a]">{listing.availableKg.toFixed(0)}kg</div></div>
                <div><div className="text-xs text-slate-400">Available Volume</div><div className="text-lg font-bold text-[#1a1a1a]">{listing.availableM3.toFixed(1)}m&sup3;</div></div>
                <div><div className="text-xs text-slate-400">Total Weight</div><div className="text-sm text-slate-600">{listing.totalCapacityKg.toFixed(0)}kg</div></div>
                <div><div className="text-xs text-slate-400">Total Volume</div><div className="text-sm text-slate-600">{listing.totalCapacityM3.toFixed(1)}m&sup3;</div></div>
              </div>
              {(listing.maxItemLength || listing.maxItemWidth || listing.maxItemHeight) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-1">Max Item Dimensions</div>
                  <div className="text-sm text-[#1a1a1a]">
                    {listing.maxItemLength && `${listing.maxItemLength}cm L`}
                    {listing.maxItemWidth && ` x ${listing.maxItemWidth}cm W`}
                    {listing.maxItemHeight && ` x ${listing.maxItemHeight}cm H`}
                  </div>
                </div>
              )}
              {acceptedCargo.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-2">Accepted Cargo Types</div>
                  <div className="flex flex-wrap gap-1">{acceptedCargo.map((c: string) => <span key={c} className="badge bg-slate-50 text-slate-600 border border-slate-200">{c}</span>)}</div>
                </div>
              )}
            </div>

            {/* Return Journey (Two-Way Route) */}
            {(listing.routeDirection === 'BOTH' || listing.routeDirection === 'RETURN') && (
              <div className="bg-white rounded-xl shadow-sm border border-[#C6904D]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#C6904D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <h2 className="font-bold text-[#1a1a1a]">Return Journey</h2>
                  <span className="badge bg-[#C6904D]/10 text-[#C6904D] text-[10px]">Two-Way</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{listing.destinationPort} &rarr; {listing.originPort}</p>
                {listing.returnDepartureDate && (
                  <div className="text-sm text-slate-600 mb-2">
                    Departs: {new Date(listing.returnDepartureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {(listing.returnAvailableKg || listing.returnAvailableM3) && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {listing.returnAvailableKg && <div><div className="text-xs text-slate-400">Available</div><div className="text-lg font-bold text-[#1a1a1a]">{listing.returnAvailableKg.toFixed(0)}kg</div></div>}
                    {listing.returnAvailableM3 && <div><div className="text-xs text-slate-400">Volume</div><div className="text-lg font-bold text-[#1a1a1a]">{listing.returnAvailableM3.toFixed(1)}m&sup3;</div></div>}
                  </div>
                )}
                {(listing.returnFlatRate || listing.returnPricePerKg || listing.returnPricePerM3) && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">Return Pricing</div>
                    {listing.returnFlatRate && <div className="text-sm font-semibold text-[#1a1a1a]">{formatCurrency(listing.returnFlatRate, listing.currency)} flat</div>}
                    {listing.returnPricePerKg && <div className="text-sm text-slate-600">{formatCurrency(listing.returnPricePerKg, listing.currency)}/kg</div>}
                    {listing.returnPricePerM3 && <div className="text-sm text-slate-600">{formatCurrency(listing.returnPricePerM3, listing.currency)}/m&sup3;</div>}
                  </div>
                )}
                {listing.returnNotes && (
                  <p className="mt-3 text-xs text-slate-500 italic">{listing.returnNotes}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-24">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Pricing</div>
              {listing.flatRate ? (
                <div className="text-3xl font-semibold text-[#1a1a1a]">{formatCurrency(listing.flatRate, listing.currency)}<span className="text-sm font-normal text-slate-400 ml-1">flat</span></div>
              ) : (
                <div className="space-y-1">
                  {listing.pricePerKg && <div className="text-xl font-bold text-[#1a1a1a]">{formatCurrency(listing.pricePerKg, listing.currency)}<span className="text-sm font-normal text-slate-400">/kg</span></div>}
                  {listing.pricePerM3 && <div className="text-xl font-bold text-[#1a1a1a]">{formatCurrency(listing.pricePerM3, listing.currency)}<span className="text-sm font-normal text-slate-400">/m&sup3;</span></div>}
                </div>
              )}
              {listing.minimumCharge && <div className="text-xs text-slate-400 mt-1">Min. charge: {formatCurrency(listing.minimumCharge, listing.currency)}</div>}
              {listing.insuranceValue && <div className="text-xs text-slate-400 mt-1">Insured up to {formatCurrency(listing.insuranceValue, listing.currency)}</div>}

              <div className="mt-6 space-y-3">
                {user && user.id !== listing.carrier.id && (
                  <>
                    <button onClick={() => { setShowBooking(!showBooking); setShowBid(false); setShowContact(false) }} className="w-full btn-primary text-sm !py-3">
                      Book Space
                    </button>
                    {listing.biddingEnabled && (
                      <button onClick={() => { setShowBid(!showBid); setShowBooking(false); setShowContact(false) }} className="w-full btn-primary text-sm !py-3">
                        Place Bid
                      </button>
                    )}
                    <button onClick={() => { setShowContact(!showContact); setShowBooking(false); setShowBid(false) }} className="w-full px-4 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      Message Carrier
                    </button>
                  </>
                )}
                {!user && (
                  <Link href="/login" className="block w-full btn-primary text-sm !py-3 text-center">
                    Sign in to Book
                  </Link>
                )}
              </div>

              {/* Carrier Info (anonymous until booking confirmed) */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a1a1a] text-sm">Verified Carrier</div>
                    <div className="text-xs text-slate-400">Identity revealed after booking</div>
                  </div>
                </div>
                {listing.carrier.avgRating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-4 h-4 ${star <= Math.round(listing.carrier.avgRating) ? 'text-[#C6904D]' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-sm text-slate-500 ml-1">{listing.carrier.avgRating.toFixed(1)} ({listing.carrier.reviewCount})</span>
                  </div>
                )}
                <div className="text-xs text-slate-400">
                  {listing._count.bookings} completed deliveries
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400 text-center">{listing.viewCount} views &middot; {listing._count.bookings} bookings</div>
            </div>
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#1a1a1a]">Book Space</h2>
                <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={submitBooking} className="p-6 space-y-5">
                {/* Cargo Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Cargo Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Description *</label>
                      <input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. 12 cases premium wine, temperature sensitive" value={bookingForm.cargoDescription} onChange={e => setBookingForm({...bookingForm, cargoDescription: e.target.value})} />
                      <button type="button" onClick={classifyCargo} disabled={classifying || !bookingForm.cargoDescription.trim()} className="mt-1.5 text-xs font-medium text-[#C6904D] hover:text-[#b07e3a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        {classifying ? 'Analyzing...' : 'Analyze with AI \u2726'}
                      </button>
                      {cargoWarnings.length > 0 && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                          {cargoWarnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Weight (kg) *</label><input type="number" required step="0.1" max={listing.availableKg} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bookingForm.weightKg} onChange={e => setBookingForm({...bookingForm, weightKg: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Volume (m&sup3;) *</label><input type="number" required step="0.1" max={listing.availableM3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bookingForm.volumeM3} onChange={e => setBookingForm({...bookingForm, volumeM3: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Declared Value</label><input type="number" step="0.01" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. 5000" value={bookingForm.declaredValue} onChange={e => setBookingForm({...bookingForm, declaredValue: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Special Handling</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Refrigerated" value={bookingForm.specialHandling} onChange={e => setBookingForm({...bookingForm, specialHandling: e.target.value})} /></div>
                    </div>
                  </div>
                </div>

                {/* Collection Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Collection Details</h3>
                  <div className="space-y-3">
                    <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Pickup Address *</label><input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Full address for cargo collection" value={bookingForm.pickupAddress} onChange={e => setBookingForm({...bookingForm, pickupAddress: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Contact Name *</label><input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Who to ask for" value={bookingForm.pickupContact} onChange={e => setBookingForm({...bookingForm, pickupContact: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Contact Phone *</label><input required type="tel" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="+44 7700 900000" value={bookingForm.pickupPhone} onChange={e => setBookingForm({...bookingForm, pickupPhone: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Preferred Time</label>
                        <select className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] bg-white" value={bookingForm.pickupTimeWindow} onChange={e => setBookingForm({...bookingForm, pickupTimeWindow: e.target.value})}>
                          <option value="">Any time</option>
                          <option value="morning">Morning (8am–12pm)</option>
                          <option value="afternoon">Afternoon (12–5pm)</option>
                          <option value="evening">Evening (5–9pm)</option>
                        </select>
                      </div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Access Notes</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Gate code, dock #, etc." value={bookingForm.pickupNotes} onChange={e => setBookingForm({...bookingForm, pickupNotes: e.target.value})} /></div>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Delivery Details</h3>
                  <div className="space-y-3">
                    <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Delivery Address *</label><input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Full address for delivery" value={bookingForm.deliveryAddress} onChange={e => setBookingForm({...bookingForm, deliveryAddress: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Recipient Name *</label><input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Who will receive" value={bookingForm.deliveryContact} onChange={e => setBookingForm({...bookingForm, deliveryContact: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Recipient Phone *</label><input required type="tel" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="+33 6 12 34 56 78" value={bookingForm.deliveryPhone} onChange={e => setBookingForm({...bookingForm, deliveryPhone: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Preferred Time</label>
                        <select className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] bg-white" value={bookingForm.deliveryTimeWindow} onChange={e => setBookingForm({...bookingForm, deliveryTimeWindow: e.target.value})}>
                          <option value="">Any time</option>
                          <option value="morning">Morning (8am–12pm)</option>
                          <option value="afternoon">Afternoon (12–5pm)</option>
                          <option value="evening">Evening (5–9pm)</option>
                        </select>
                      </div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Vessel / Site Name</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. MY Serenity" value={bookingForm.vesselName} onChange={e => setBookingForm({...bookingForm, vesselName: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Marina / Berth</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Port Hercules, Berth 42" value={bookingForm.marinaName} onChange={e => setBookingForm({...bookingForm, marinaName: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Delivery Notes</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="Special instructions" value={bookingForm.deliveryNotes} onChange={e => setBookingForm({...bookingForm, deliveryNotes: e.target.value})} /></div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={formLoading} className="w-full btn-primary !py-3 text-sm disabled:opacity-50">{formLoading ? 'Confirming...' : 'Confirm Booking'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Bid Form Modal */}
        {showBid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#1a1a1a]">Place a Bid</h2>
                <button onClick={() => setShowBid(false)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={submitBid} className="p-6 space-y-4">
                {listing.minBidPrice && <p className="text-sm text-slate-500">Minimum bid: {formatCurrency(listing.minBidPrice, listing.currency)}</p>}
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Your Bid ({listing.currency}) *</label><input type="number" required step="0.01" min={listing.minBidPrice || 0} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bidForm.amount} onChange={e => setBidForm({...bidForm, amount: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Weight (kg) *</label><input type="number" required step="0.1" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bidForm.weightKg} onChange={e => setBidForm({...bidForm, weightKg: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Volume (m&sup3;) *</label><input type="number" required step="0.1" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bidForm.volumeM3} onChange={e => setBidForm({...bidForm, volumeM3: e.target.value})} /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Message</label><textarea rows={3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] resize-none" placeholder="Tell the carrier about your cargo..." value={bidForm.message} onChange={e => setBidForm({...bidForm, message: e.target.value})} /></div>
                <button type="submit" disabled={formLoading} className="w-full btn-primary !py-3 text-sm disabled:opacity-50">{formLoading ? 'Submitting...' : 'Submit Bid'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Message Carrier Modal */}
        {showContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#1a1a1a]">Message Carrier</h2>
                <button onClick={() => setShowContact(false)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={sendMessage} className="p-6 space-y-4">
                <p className="text-sm text-slate-500">Send an in-app message to the carrier. Contact details will be shared after a confirmed booking.</p>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Your Message</label>
                  <textarea rows={4} required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] resize-none" placeholder="Hi, I'm interested in your listing..." value={messageContent} onChange={e => setMessageContent(e.target.value)} />
                </div>
                <button type="submit" disabled={formLoading} className="w-full btn-primary !py-3 text-sm disabled:opacity-50">{formLoading ? 'Sending...' : 'Send Message'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}
