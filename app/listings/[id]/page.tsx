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
    name: string
    company?: string
    avatarUrl?: string
    phone?: string
    email?: string
    bio?: string
    city?: string
    country?: string
    createdAt: string
    avgRating: number
    reviewCount: number
    _count: { listings: number; receivedReviews: number }
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const { user, token } = useAuth()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [showBid, setShowBid] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [bookingForm, setBookingForm] = useState({
    cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    specialHandling: '', deliveryAddress: '', vesselName: '', marinaName: '', deliveryNotes: '',
  })
  const [bidForm, setBidForm] = useState({ amount: '', weightKg: '', volumeM3: '', message: '' })
  const [messageContent, setMessageContent] = useState('')

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data.listing)
      }
    } catch (err) { console.error(err) }
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  if (!listing) return <div className="flex items-center justify-center py-20"><p className="text-slate-500">Listing not found</p></div>

  const fillPercent = Math.round(((listing.totalCapacityKg - listing.availableKg) / listing.totalCapacityKg) * 100)
  const acceptedCargo = listing.acceptedCargo ? JSON.parse(listing.acceptedCargo) : []

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
                {listing.hasRefrigeration && <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Refrigerated</span>}
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
                      Contact Carrier
                    </button>
                  </>
                )}
                {!user && (
                  <Link href="/login" className="block w-full btn-primary text-sm !py-3 text-center">
                    Sign in to Book
                  </Link>
                )}
              </div>

              {/* Carrier Info */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#1a1a1a]">{listing.carrier.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a1a1a] text-sm">{listing.carrier.name}</div>
                    {listing.carrier.company && <div className="text-xs text-slate-400">{listing.carrier.company}</div>}
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
                  {listing.carrier._count.listings} listings &middot; Member since {new Date(listing.carrier.createdAt).getFullYear()}
                </div>
                {listing.carrier.phone && user && (
                  <a href={`tel:${listing.carrier.phone}`} className="mt-3 flex items-center gap-2 text-sm text-[#1a1a1a] hover:text-[#1a1a1a] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Call {listing.carrier.name.split(' ')[0]}
                  </a>
                )}
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
              <form onSubmit={submitBooking} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Cargo *</label><input required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Provisions for MY Serenity" value={bookingForm.cargoDescription} onChange={e => setBookingForm({...bookingForm, cargoDescription: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Weight (kg) *</label><input type="number" required step="0.1" max={listing.availableKg} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bookingForm.weightKg} onChange={e => setBookingForm({...bookingForm, weightKg: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Volume (m&sup3;) *</label><input type="number" required step="0.1" max={listing.availableM3} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" value={bookingForm.volumeM3} onChange={e => setBookingForm({...bookingForm, volumeM3: e.target.value})} /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Vessel Name</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Site name or vessel" value={bookingForm.vesselName} onChange={e => setBookingForm({...bookingForm, vesselName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Marina / Berth</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Port Hercules, Berth 42" value={bookingForm.marinaName} onChange={e => setBookingForm({...bookingForm, marinaName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-[#1a1a1a] mb-1">Special Handling</label><input className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" placeholder="e.g. Refrigerated, fragile, temperature-controlled" value={bookingForm.specialHandling} onChange={e => setBookingForm({...bookingForm, specialHandling: e.target.value})} /></div>
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

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#1a1a1a]">Contact {listing.carrier.name}</h2>
                <button onClick={() => setShowContact(false)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <form onSubmit={sendMessage} className="p-6 space-y-4">
                {listing.carrier.phone && (
                  <a href={`tel:${listing.carrier.phone}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <div><div className="font-medium text-[#1a1a1a] text-sm">Call {listing.carrier.name.split(' ')[0]}</div><div className="text-xs text-slate-400">{listing.carrier.phone}</div></div>
                  </a>
                )}
                {listing.carrier.email && (
                  <a href={`mailto:${listing.carrier.email}?subject=RE: ${listing.title}`} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div><div className="font-medium text-[#1a1a1a] text-sm">Email</div><div className="text-xs text-slate-400">{listing.carrier.email}</div></div>
                  </a>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Send In-App Message</label>
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
