'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../components/AuthProvider'
import PortAutocomplete from '../components/PortAutocomplete'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  description?: string
  vehicleType: string
  originPort: string
  originRegion?: string
  destinationPort: string
  destinationRegion?: string
  departureDate: string
  estimatedArrival?: string
  availableKg: number
  availableM3: number
  totalCapacityKg: number
  totalCapacityM3: number
  pricePerKg?: number
  pricePerM3?: number
  flatRate?: number
  currency: string
  routeDirection?: string
  returnAvailableKg?: number
  returnAvailableM3?: number
  returnFlatRate?: number
  featured: boolean
  carrier: {
    id: string
    name: string
    company?: string
    avatarUrl?: string
  }
  _count: { bookings: number }
}

interface BookingForm {
  listingId: string
  cargoDescription: string
  cargoType: string
  weightKg: string
  volumeM3: string
  specialHandling: string
  pickupAddress: string
  deliveryAddress: string
  deliveryNotes: string
  yachtName: string
  yachtMMSI: string
  berthNumber: string
  marinaName: string
  routeDirection: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface Filters {
  origin: string
  destination: string
  dateFrom: string
  vehicleType: string
  direction: string
  minPrice: string
  maxPrice: string
  minWeight: string
  minVolume: string
  sort: string
  features: { refrigerated: boolean; gps: boolean; tailLift: boolean }
}

const ITEMS_PER_PAGE = 10

const VEHICLE_TYPES = [
  { value: '', label: 'All Vehicle Types' },
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Refrigerated Van', label: 'Refrigerated Van' },
  { value: 'Refrigerated Truck', label: 'Refrigerated Truck' },
  { value: 'Flatbed', label: 'Flatbed' },
  { value: 'Container', label: 'Container' },
  { value: 'Cargo Ship', label: 'Cargo Ship' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Featured first' },
  { value: 'departure', label: 'Departure Date' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'newest', label: 'Newest' },
]

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-[#1a1a1a] placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none'
const selectClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-[#1a1a1a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none appearance-none'

export default function MarketplacePage() {
  const { user, token } = useAuth()

  const [listings, setListings] = useState<Listing[]>([])
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)

  const [filters, setFilters] = useState<Filters>({
    origin: '', destination: '', dateFrom: '', vehicleType: '', direction: '',
    minPrice: '', maxPrice: '', minWeight: '', minVolume: '', sort: '',
    features: { refrigerated: false, gps: false, tailLift: false },
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    listingId: '', cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    specialHandling: '', pickupAddress: '', deliveryAddress: '', deliveryNotes: '',
    yachtName: '', yachtMMSI: '', berthNumber: '', marinaName: '', routeDirection: 'outbound',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const mobileFilterRef = useRef<HTMLDivElement>(null)

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true)
    try {
      const res = await fetch('/api/listings?featured=true&limit=4')
      if (res.ok) {
        const data = await res.json()
        setFeaturedListings(data.listings || [])
      }
    } catch (err) { console.error('Error fetching featured:', err) }
    finally { setFeaturedLoading(false) }
  }, [])

  useEffect(() => { fetchFeatured() }, [fetchFeatured])

  const resolveVehicleType = useCallback(() => {
    if (filters.vehicleType) return filters.vehicleType
    return ''
  }, [filters.vehicleType])

  const fetchListings = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.origin) params.append('origin', filters.origin)
      if (filters.destination) params.append('destination', filters.destination)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      const vt = resolveVehicleType()
      if (vt) params.append('vehicleType', vt)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.direction) params.append('direction', filters.direction)
      if (filters.minWeight) params.append('minWeight', filters.minWeight)
      if (filters.minVolume) params.append('minVolume', filters.minVolume)
      if (filters.sort) params.append('sort', filters.sort)
      params.append('limit', String(ITEMS_PER_PAGE))
      params.append('page', String(page))

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        let results: Listing[] = data.listings || []

        if (filters.features.refrigerated) {
          results = results.filter(l => l.vehicleType.toLowerCase().includes('refrigerat') || l.description?.toLowerCase().includes('refrigerat'))
        }
        if (filters.features.gps) {
          results = results.filter(l => l.description?.toLowerCase().includes('gps') || l.title.toLowerCase().includes('gps'))
        }
        if (filters.features.tailLift) {
          results = results.filter(l => l.description?.toLowerCase().includes('tail lift') || l.vehicleType.toLowerCase().includes('tail lift') || l.title.toLowerCase().includes('tail lift'))
        }

        setListings(results)
        setPagination(data.pagination || { page, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
      }
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }, [filters, resolveVehicleType])

  useEffect(() => { fetchListings(currentPage) }, [fetchListings, currentPage])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const openBooking = (listing: Listing) => {
    setBookingModal(listing)
    setBookingForm({ ...bookingForm, listingId: listing.id })
    setBookingSuccess(false)
    setBookingError('')
  }

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setBookingLoading(true)
    setBookingError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bookingForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingSuccess(true)
      fetchListings(currentPage)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  const handleSearch = () => { setCurrentPage(1); fetchListings(1) }

  const resetFilters = () => {
    setFilters({ origin: '', destination: '', dateFrom: '', vehicleType: '', direction: '', minPrice: '', maxPrice: '', minWeight: '', minVolume: '', sort: '', features: { refrigerated: false, gps: false, tailLift: false } })
    setCurrentPage(1)
  }

  const hasActiveFilters = filters.vehicleType || filters.minPrice || filters.maxPrice || filters.minWeight || filters.minVolume || filters.sort || filters.features.refrigerated || filters.features.gps || filters.features.tailLift

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = () => {
    const pages: (number | string)[] = []
    const total = pagination.pages
    const current = pagination.page
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i) }
    else {
      pages.push(1)
      if (current > 3) pages.push('...')
      const start = Math.max(2, current - 1)
      const end = Math.min(total - 1, current + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (current < total - 2) pages.push('...')
      pages.push(total)
    }
    return pages
  }

  // Lock body scroll when filter panel is open
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  // Lock body scroll when booking modal is open
  useEffect(() => {
    if (bookingModal) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [bookingModal])

  const FilterContent = ({ onApply }: { onApply?: () => void }) => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Route Direction</label>
        <select className={selectClass} value={filters.direction} onChange={(e) => setFilters({ ...filters, direction: e.target.value })}>
          <option value="">All Directions</option>
          <option value="outbound">Outbound (to yacht/marina)</option>
          <option value="return">Return (back from yacht)</option>
          <option value="both">Two-way routes only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Vehicle Type</label>
        <select className={selectClass} value={filters.vehicleType} onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}>
          {VEHICLE_TYPES.map(vt => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" min="0" className={inputClass} value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          <input type="number" placeholder="Max" min="0" className={inputClass} value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Min Capacity</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input type="number" placeholder="Weight" min="0" className={inputClass + ' pr-10'} value={filters.minWeight} onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">kg</span>
          </div>
          <div className="relative">
            <input type="number" placeholder="Volume" min="0" step="0.1" className={inputClass + ' pr-10'} value={filters.minVolume} onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">m&sup3;</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Features</label>
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'refrigerated' as const, label: 'Refrigerated' },
            { key: 'gps' as const, label: 'GPS Tracking' },
            { key: 'tailLift' as const, label: 'Tail Lift' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilters({ ...filters, features: { ...filters.features, [key]: !filters.features[key] } })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filters.features[key]
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Sort By</label>
        <select className={selectClass} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-3">
        <button onClick={() => { handleSearch(); onApply?.() }} className="btn-primary text-sm !py-3 flex-1">Apply Filters</button>
        <button onClick={() => { resetFilters(); onApply?.() }} className="btn-secondary text-sm !py-3 !px-5">Reset</button>
      </div>
    </div>
  )

  const ListingCard = ({ listing, featured = false }: { listing: Listing; featured?: boolean }) => (
    <div className={`bg-white rounded-2xl border p-5 sm:p-6 card-hover transition-all ${
      listing.featured || featured ? 'border-blue-200 shadow-sm shadow-blue-500/5' : 'border-slate-200'
    }`}>
      {(listing.featured || featured) && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Featured
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#1a1a1a] text-base sm:text-lg truncate">{listing.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {listing.carrier.name}
            {listing.carrier.company && <span className="text-slate-400"> &middot; {listing.carrier.company}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="badge bg-slate-100 text-slate-700 whitespace-nowrap text-xs">
            {listing.vehicleType}
          </span>
          {listing.routeDirection === 'BOTH' && (
            <span className="badge bg-[#C6904D]/10 text-[#C6904D] border border-[#C6904D]/20 whitespace-nowrap text-[10px]">
              Two-way
            </span>
          )}
          {listing.routeDirection === 'RETURN' && (
            <span className="badge bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap text-[10px]">
              Return
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-4 bg-slate-50 rounded-xl p-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">From</div>
          <div className="font-bold text-[#1a1a1a] text-sm truncate">{listing.originPort}</div>
          {listing.originRegion && <div className="text-xs text-slate-400 truncate">{listing.originRegion}</div>}
        </div>
        <div className="flex-shrink-0 text-slate-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">To</div>
          <div className="font-bold text-[#1a1a1a] text-sm truncate">{listing.destinationPort}</div>
          {listing.destinationRegion && <div className="text-xs text-slate-400 truncate">{listing.destinationRegion}</div>}
        </div>
        <div className="text-right flex-shrink-0 border-l border-slate-200 pl-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Departs</div>
          <div className="font-bold text-[#1a1a1a] text-sm">{formatDate(listing.departureDate)}</div>
        </div>
      </div>

      {/* Capacity & Price footer */}
      <div className="flex items-end justify-between pt-3 border-t border-slate-100">
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Weight</div>
            <div className="text-sm font-bold text-[#1a1a1a]">{listing.availableKg.toFixed(0)} kg</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Volume</div>
            <div className="text-sm font-bold text-[#1a1a1a]">{listing.availableM3.toFixed(1)} m&sup3;</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {listing.flatRate ? (
              <div className="text-lg font-bold text-[#1a1a1a]">{formatCurrency(listing.flatRate, listing.currency)}</div>
            ) : (
              <div className="text-sm font-semibold text-[#1a1a1a]">
                {listing.pricePerKg && <span>{formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>}
                {listing.pricePerKg && listing.pricePerM3 && <span className="text-slate-300 mx-1">&middot;</span>}
                {listing.pricePerM3 && <span>{formatCurrency(listing.pricePerM3, listing.currency)}/m&sup3;</span>}
              </div>
            )}
          </div>
          {user ? (
            <button onClick={() => openBooking(listing)} className="btn-primary !text-sm !py-2.5 !px-5 !min-h-0 !rounded-xl">
              Book
            </button>
          ) : (
            <Link href="/login" className="btn-primary !text-sm !py-2.5 !px-5 !min-h-0 !rounded-xl">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Search header */}
      <div className="bg-white border-b border-slate-200">
        <div className="site-container py-8 sm:py-10">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">Marketplace</h1>
              <p className="text-sm text-slate-500 mt-1">Find van space to any destination</p>
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#1a1a1a] hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-600" />}
            </button>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <PortAutocomplete
                value={filters.origin}
                onChange={v => setFilters({ ...filters, origin: v })}
                placeholder="Origin port..."
              />
            </div>
            <div className="relative flex-1">
              <PortAutocomplete
                value={filters.destination}
                onChange={v => setFilters({ ...filters, destination: v })}
                placeholder="Destination port..."
              />
            </div>
            <input type="date" className={inputClass + ' sm:w-44'} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            <button onClick={handleSearch} className="btn-primary !text-sm !py-3 !px-6 whitespace-nowrap">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ---- FILTER SHEET (works for mobile AND desktop) ---- */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div ref={mobileFilterRef} className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <FilterContent onApply={() => setFiltersOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="site-container py-8 sm:py-10">
        {/* Featured */}
        {featuredListings.length > 0 && (
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-lg font-bold text-[#1a1a1a]">Featured Routes</h2>
            </div>
            {featuredLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="loading-shimmer h-52 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {featuredListings.map(listing => <ListingCard key={listing.id} listing={listing} featured />)}
              </div>
            )}
          </div>
        )}

        {/* Results header */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 font-medium">
              {pagination.total === 0 ? 'No routes found' : `${pagination.total} route${pagination.total !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-[#1a1a1a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                value={filters.sort}
                onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setCurrentPage(1) }}
              >
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-52 rounded-2xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-[#1a1a1a] font-semibold text-lg mb-2">No routes found</p>
            <p className="text-sm text-slate-500 mb-6">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn-primary !text-sm !py-2.5 !px-6">Clear All Filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {pageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">...</span>
                  ) : (
                    <button key={p} onClick={() => goToPage(p)} className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-colors ${
                      p === pagination.page ? 'bg-[#1a1a1a] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}>{p}</button>
                  )
                )}
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- BOOKING MODAL ---- */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingModal(null)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a1a]">Book Space</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {bookingModal.originPort} &rarr; {bookingModal.destinationPort} &middot; {formatDate(bookingModal.departureDate)}
                  </p>
                </div>
                <button onClick={() => setBookingModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Booking Confirmed!</h3>
                <p className="text-slate-500 mb-6">Your space has been reserved. Check your dashboard for details.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard" className="btn-primary !text-sm !py-2.5">View Dashboard</Link>
                  <button onClick={() => setBookingModal(null)} className="btn-secondary !text-sm !py-2.5">Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="p-5 sm:p-6 space-y-4">
                {bookingError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-sm text-red-700">{bookingError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Cargo Description *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Wine cases for MY Ocean Dream" value={bookingForm.cargoDescription} onChange={(e) => setBookingForm({ ...bookingForm, cargoDescription: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Cargo Type</label>
                  <select className={selectClass} value={bookingForm.cargoType} onChange={(e) => setBookingForm({ ...bookingForm, cargoType: e.target.value })}>
                    <option value="">Select type...</option>
                    <option value="Provisions">Provisions & Food</option>
                    <option value="Wine & Spirits">Wine & Spirits</option>
                    <option value="Equipment">Marine Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Crew Gear">Crew Gear & Uniforms</option>
                    <option value="Interior">Interior & Decor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Weight (kg) *</label>
                    <input type="number" required step="0.1" max={bookingModal.availableKg} className={inputClass} placeholder={`Max ${bookingModal.availableKg}kg`} value={bookingForm.weightKg} onChange={(e) => setBookingForm({ ...bookingForm, weightKg: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Volume (m&sup3;) *</label>
                    <input type="number" required step="0.1" max={bookingModal.availableM3} className={inputClass} placeholder={`Max ${bookingModal.availableM3}m\u00B3`} value={bookingForm.volumeM3} onChange={(e) => setBookingForm({ ...bookingForm, volumeM3: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Delivery Address</label>
                  <input type="text" className={inputClass} placeholder="Marina berth or port address" value={bookingForm.deliveryAddress} onChange={(e) => setBookingForm({ ...bookingForm, deliveryAddress: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Special Handling</label>
                  <input type="text" className={inputClass} placeholder="e.g. Refrigerated, fragile" value={bookingForm.specialHandling} onChange={(e) => setBookingForm({ ...bookingForm, specialHandling: e.target.value })} />
                </div>

                {/* Yacht / Vessel Details */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#C6904D] uppercase tracking-wider mb-3">Yacht / Vessel Details</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Yacht Name</label>
                        <input type="text" className={inputClass} placeholder="e.g. MY Serenity" value={bookingForm.yachtName} onChange={(e) => setBookingForm({ ...bookingForm, yachtName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">MMSI Number</label>
                        <input type="text" className={inputClass} placeholder="9 digits" maxLength={9} pattern="\d{9}" value={bookingForm.yachtMMSI} onChange={(e) => setBookingForm({ ...bookingForm, yachtMMSI: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Marina</label>
                        <input type="text" className={inputClass} placeholder="e.g. Port Vauban" value={bookingForm.marinaName} onChange={(e) => setBookingForm({ ...bookingForm, marinaName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Berth Number</label>
                        <input type="text" className={inputClass} placeholder="e.g. B-24" value={bookingForm.berthNumber} onChange={(e) => setBookingForm({ ...bookingForm, berthNumber: e.target.value })} />
                      </div>
                    </div>
                    {bookingForm.yachtMMSI && bookingForm.yachtMMSI.length === 9 && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <a href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${bookingForm.yachtMMSI}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Track vessel on MarineTraffic
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Route direction selection for two-way listings */}
                {bookingModal.routeDirection === 'BOTH' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Which leg?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'outbound', label: 'Outbound', desc: `To ${bookingModal.destinationPort}` },
                        { value: 'return', label: 'Return', desc: `Back to ${bookingModal.originPort}` },
                      ].map(opt => (
                        <label key={opt.value} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${bookingForm.routeDirection === opt.value ? 'border-[#C6904D] bg-amber-50/50' : 'border-slate-200'}`}>
                          <input type="radio" name="routeDirection" value={opt.value} checked={bookingForm.routeDirection === opt.value} onChange={(e) => setBookingForm({ ...bookingForm, routeDirection: e.target.value })} className="sr-only" />
                          <span className="text-sm font-semibold text-[#1a1a1a]">{opt.label}</span>
                          <span className="text-[11px] text-slate-400">{opt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price estimate */}
                {bookingForm.weightKg && bookingForm.volumeM3 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Estimated Price</div>
                    <div className="text-2xl font-bold text-[#1a1a1a]">
                      {bookingModal.flatRate
                        ? formatCurrency(bookingModal.flatRate, bookingModal.currency)
                        : formatCurrency(
                            (bookingModal.pricePerKg ? parseFloat(bookingForm.weightKg) * bookingModal.pricePerKg : 0) +
                            (bookingModal.pricePerM3 ? parseFloat(bookingForm.volumeM3) * bookingModal.pricePerM3 : 0),
                            bookingModal.currency
                          )}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={bookingLoading} className="w-full btn-primary !py-3.5 text-sm disabled:opacity-50">
                  {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
