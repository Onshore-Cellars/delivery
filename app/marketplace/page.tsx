'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../components/AuthProvider'
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
  { value: '', label: 'Default (Featured first)' },
  { value: 'departure', label: 'Departure Date' },
  { value: 'price_asc', label: 'Price: Low \u2192 High' },
  { value: 'price_desc', label: 'Price: High \u2192 Low' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'newest', label: 'Newest' },
]

const inputClass =
  'w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none'
const selectClass =
  'w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none appearance-none'

export default function MarketplacePage() {
  const { user, token } = useAuth()

  // Listings & pagination
  const [listings, setListings] = useState<Listing[]>([])
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // Filters
  const [filters, setFilters] = useState<Filters>({
    origin: '',
    destination: '',
    dateFrom: '',
    vehicleType: '',
    minPrice: '',
    maxPrice: '',
    minWeight: '',
    minVolume: '',
    sort: '',
    features: { refrigerated: false, gps: false, tailLift: false },
  })
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Booking
  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    listingId: '',
    cargoDescription: '',
    cargoType: '',
    weightKg: '',
    volumeM3: '',
    specialHandling: '',
    pickupAddress: '',
    deliveryAddress: '',
    deliveryNotes: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const mobileFilterRef = useRef<HTMLDivElement>(null)

  // ---------- Fetch featured listings (once) ----------
  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true)
    try {
      const res = await fetch('/api/listings?featured=true&limit=4')
      if (res.ok) {
        const data = await res.json()
        setFeaturedListings(data.listings || [])
      }
    } catch (err) {
      console.error('Error fetching featured:', err)
    } finally {
      setFeaturedLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  // ---------- Build effective vehicleType considering feature checkboxes ----------
  const resolveVehicleType = useCallback(() => {
    if (filters.vehicleType) return filters.vehicleType
    if (filters.features.refrigerated) return '' // handled client-side
    return ''
  }, [filters.vehicleType, filters.features.refrigerated])

  // ---------- Fetch listings ----------
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
      if (filters.minWeight) params.append('minWeight', filters.minWeight)
      if (filters.minVolume) params.append('minVolume', filters.minVolume)
      if (filters.sort) params.append('sort', filters.sort)

      params.append('limit', String(ITEMS_PER_PAGE))
      params.append('page', String(page))

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        let results: Listing[] = data.listings || []

        // Client-side feature filtering (features are not in the API)
        if (filters.features.refrigerated) {
          results = results.filter(
            (l) =>
              l.vehicleType.toLowerCase().includes('refrigerat') ||
              l.description?.toLowerCase().includes('refrigerat')
          )
        }
        if (filters.features.gps) {
          results = results.filter(
            (l) =>
              l.description?.toLowerCase().includes('gps') ||
              l.title.toLowerCase().includes('gps')
          )
        }
        if (filters.features.tailLift) {
          results = results.filter(
            (l) =>
              l.description?.toLowerCase().includes('tail lift') ||
              l.vehicleType.toLowerCase().includes('tail lift') ||
              l.title.toLowerCase().includes('tail lift')
          )
        }

        setListings(results)
        setPagination(data.pagination || { page, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, resolveVehicleType])

  useEffect(() => {
    fetchListings(currentPage)
  }, [fetchListings, currentPage])

  // ---------- Helpers ----------
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

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
    } finally {
      setBookingLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchListings(1)
  }

  const resetFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      dateFrom: '',
      vehicleType: '',
      minPrice: '',
      maxPrice: '',
      minWeight: '',
      minVolume: '',
      sort: '',
      features: { refrigerated: false, gps: false, tailLift: false },
    })
    setCurrentPage(1)
  }

  const hasActiveFilters =
    filters.vehicleType ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minWeight ||
    filters.minVolume ||
    filters.sort ||
    filters.features.refrigerated ||
    filters.features.gps ||
    filters.features.tailLift

  // ---------- Pagination helpers ----------
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = () => {
    const pages: (number | string)[] = []
    const total = pagination.pages
    const current = pagination.page

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
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

  // ---------- Shared filter panel content ----------
  const FilterPanelContent = ({ onApply }: { onApply?: () => void }) => (
    <div className="space-y-5">
      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">Vehicle Type</label>
        <select
          className={selectClass}
          value={filters.vehicleType}
          onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
        >
          {VEHICLE_TYPES.map((vt) => (
            <option key={vt.value} value={vt.value}>
              {vt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min price"
            min="0"
            className={inputClass}
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <input
            type="number"
            placeholder="Max price"
            min="0"
            className={inputClass}
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Available Capacity */}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">Min Available Capacity</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="number"
              placeholder="Weight"
              min="0"
              className={inputClass + ' pr-10'}
              value={filters.minWeight}
              onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="Volume"
              min="0"
              step="0.1"
              className={inputClass + ' pr-10'}
              value={filters.minVolume}
              onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">m&sup3;</span>
          </div>
        </div>
      </div>

      {/* Special Features */}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-2">Special Features</label>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'refrigerated' as const, label: 'Refrigerated' },
            { key: 'gps' as const, label: 'GPS' },
            { key: 'tailLift' as const, label: 'Tail Lift' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                filters.features[key]
                  ? 'border-navy-400 bg-navy-50 text-navy-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.features[key]}
                onChange={() =>
                  setFilters({
                    ...filters,
                    features: { ...filters.features, [key]: !filters.features[key] },
                  })
                }
              />
              <svg
                className={`w-4 h-4 ${filters.features[key] ? 'text-navy-600' : 'text-slate-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {filters.features[key] ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5} />
                )}
              </svg>
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">Sort By</label>
        <select
          className={selectClass}
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={() => { handleSearch(); onApply?.() }} className="btn-primary text-sm !py-2.5 flex-1">
          Apply Filters
        </button>
        <button
          onClick={() => { resetFilters(); onApply?.() }}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )

  // ---------- Listing card component ----------
  const ListingCard = ({ listing, featured = false }: { listing: Listing; featured?: boolean }) => (
    <div
      className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border p-5 sm:p-6 card-hover ${
        listing.featured || featured ? 'border-gold-300 ring-1 ring-gold-200' : 'border-slate-100/80'
      }`}
    >
      {(listing.featured || featured) && (
        <div className="mb-3">
          <span className="badge bg-gold-50 text-gold-700 border border-gold-200">Featured</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy-900 text-lg truncate">{listing.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {listing.carrier.name}
            {listing.carrier.company && (
              <span className="text-slate-400"> &middot; {listing.carrier.company}</span>
            )}
          </p>
        </div>
        <span className="badge bg-navy-50 text-navy-700 border border-navy-200 ml-3 whitespace-nowrap">
          {listing.vehicleType}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 uppercase tracking-wider">From</div>
          <div className="font-semibold text-navy-900 truncate">{listing.originPort}</div>
          {listing.originRegion && <div className="text-xs text-slate-400 truncate">{listing.originRegion}</div>}
        </div>
        <div className="flex items-center flex-shrink-0">
          <div className="w-8 h-px bg-slate-300" />
          <svg className="w-4 h-4 text-slate-400 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 uppercase tracking-wider">To</div>
          <div className="font-semibold text-navy-900 truncate">{listing.destinationPort}</div>
          {listing.destinationRegion && (
            <div className="text-xs text-slate-400 truncate">{listing.destinationRegion}</div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Departs</div>
          <div className="font-semibold text-navy-900">{formatDate(listing.departureDate)}</div>
        </div>
      </div>

      {/* Capacity & Price */}
      <div className="flex items-end justify-between pt-4 border-t border-slate-100">
        <div className="flex gap-4">
          <div>
            <div className="text-xs text-slate-400">Weight</div>
            <div className="text-sm font-semibold text-navy-900">{listing.availableKg.toFixed(0)}kg</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Volume</div>
            <div className="text-sm font-semibold text-navy-900">{listing.availableM3.toFixed(1)}m&sup3;</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {listing.flatRate ? (
              <div className="text-lg font-bold text-navy-900">
                {formatCurrency(listing.flatRate, listing.currency)}
              </div>
            ) : (
              <div className="text-sm font-semibold text-navy-900">
                {listing.pricePerKg && <span>{formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>}
                {listing.pricePerKg && listing.pricePerM3 && <span className="text-slate-300"> &middot; </span>}
                {listing.pricePerM3 && (
                  <span>{formatCurrency(listing.pricePerM3, listing.currency)}/m&sup3;</span>
                )}
              </div>
            )}
          </div>
          {user ? (
            <button onClick={() => openBooking(listing)} className="btn-gold text-sm !py-2 !px-4">
              Book
            </button>
          ) : (
            <Link href="/login" className="btn-primary text-sm !py-2 !px-4">
              Sign in to Book
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      {/* Search header */}
      <div className="bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-[0.15em] mb-1">Browse</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-[-0.02em]">Marketplace</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Find van space to yacht destinations</p>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-navy-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-gold-500" />
              )}
            </button>
          </div>

          {/* Primary search row */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <input
              type="text"
              placeholder="Origin port, e.g. Antibes..."
              className={'flex-1 ' + inputClass}
              value={filters.origin}
              onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
            />
            <input
              type="text"
              placeholder="Destination port..."
              className={'flex-1 ' + inputClass}
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            />
            <input
              type="date"
              className={inputClass + ' sm:w-44'}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <button onClick={handleSearch} className="btn-primary text-sm !py-3 sm:!py-2.5 !px-6 whitespace-nowrap">
              Search Routes
            </button>
          </div>

          {/* Desktop advanced filters toggle */}
          <div className="hidden lg:flex items-center mt-3">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-900 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Advanced Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-gold-500 ml-1" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-4 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Desktop advanced filters panel (collapsible) */}
          <div
            className={`hidden lg:block overflow-hidden transition-all duration-300 ${
              advancedOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Vehicle Type</label>
                  <select
                    className={selectClass}
                    value={filters.vehicleType}
                    onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                  >
                    {VEHICLE_TYPES.map((vt) => (
                      <option key={vt.value} value={vt.value}>
                        {vt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      min="0"
                      className={inputClass}
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min="0"
                      className={inputClass}
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                {/* Min Capacity */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Min Capacity</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Weight"
                        min="0"
                        className={inputClass + ' pr-10'}
                        value={filters.minWeight}
                        onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Volume"
                        min="0"
                        step="0.1"
                        className={inputClass + ' pr-10'}
                        value={filters.minVolume}
                        onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        m&sup3;
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Sort By</label>
                  <select
                    className={selectClass}
                    value={filters.sort}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Features */}
              <div className="mt-5">
                <label className="block text-sm font-medium text-navy-900 mb-2">Special Features</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'refrigerated' as const, label: 'Refrigerated' },
                    { key: 'gps' as const, label: 'GPS' },
                    { key: 'tailLift' as const, label: 'Tail Lift' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        filters.features[key]
                          ? 'border-navy-400 bg-navy-50 text-navy-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={filters.features[key]}
                        onChange={() =>
                          setFilters({
                            ...filters,
                            features: { ...filters.features, [key]: !filters.features[key] },
                          })
                        }
                      />
                      <svg
                        className={`w-4 h-4 ${filters.features[key] ? 'text-navy-600' : 'text-slate-300'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {filters.features[key] ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5} />
                        )}
                      </svg>
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={handleSearch} className="btn-primary text-sm !py-2.5 !px-6">
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slide-out filter panel */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Panel */}
          <div
            ref={mobileFilterRef}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-navy-900">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <FilterPanelContent onApply={() => setMobileFiltersOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Featured Section */}
        {featuredListings.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-xl font-bold text-navy-900">Featured Routes</h2>
            </div>
            {featuredLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="loading-shimmer h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} featured />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results count and active sort */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {pagination.total === 0
                ? 'No routes found'
                : `Showing ${(pagination.page - 1) * ITEMS_PER_PAGE + 1}\u2013${Math.min(
                    pagination.page * ITEMS_PER_PAGE,
                    pagination.total
                  )} of ${pagination.total} routes`}
            </p>
            {/* Quick sort dropdown (visible always) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort:</span>
              <select
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                value={filters.sort}
                onChange={(e) => {
                  setFilters({ ...filters, sort: e.target.value })
                  setCurrentPage(1)
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="loading-shimmer h-48 rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium mb-1.5">No routes found</p>
            <p className="text-sm text-slate-400 mb-5">Try adjusting your search filters</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="btn-primary text-sm !py-2 !px-5">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {pageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.page
                          ? 'bg-navy-900 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-900">Book Space</h2>
                <button
                  onClick={() => setBookingModal(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {bookingModal.originPort} &rarr; {bookingModal.destinationPort} &middot;{' '}
                {formatDate(bookingModal.departureDate)}
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Booking Confirmed!</h3>
                <p className="text-slate-500 mb-6">
                  Your space has been reserved. Check your dashboard for details.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard" className="btn-primary text-sm !py-2">
                    View Dashboard
                  </Link>
                  <button
                    onClick={() => setBookingModal(null)}
                    className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="p-6 space-y-4">
                {bookingError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm text-red-700">{bookingError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Cargo Description *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Wine cases for MY Ocean Dream"
                    value={bookingForm.cargoDescription}
                    onChange={(e) => setBookingForm({ ...bookingForm, cargoDescription: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Cargo Type</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none bg-white"
                    value={bookingForm.cargoType}
                    onChange={(e) => setBookingForm({ ...bookingForm, cargoType: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="Provisions">Provisions & Food</option>
                    <option value="Wine & Spirits">Wine & Spirits</option>
                    <option value="Equipment">Marine Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Crew Gear">Crew Gear & Uniforms</option>
                    <option value="Interior">Interior & Décor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Weight (kg) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      max={bookingModal.availableKg}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                      placeholder={`Max ${bookingModal.availableKg}kg`}
                      value={bookingForm.weightKg}
                      onChange={(e) => setBookingForm({ ...bookingForm, weightKg: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Volume (m&sup3;) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      max={bookingModal.availableM3}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                      placeholder={`Max ${bookingModal.availableM3}m\u00B3`}
                      value={bookingForm.volumeM3}
                      onChange={(e) => setBookingForm({ ...bookingForm, volumeM3: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Delivery Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="Marina berth or port address"
                    value={bookingForm.deliveryAddress}
                    onChange={(e) => setBookingForm({ ...bookingForm, deliveryAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Special Handling</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Refrigerated, fragile, temperature-controlled"
                    value={bookingForm.specialHandling}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialHandling: e.target.value })}
                  />
                </div>

                {/* Price estimate */}
                {bookingForm.weightKg && bookingForm.volumeM3 && (
                  <div className="bg-navy-50 rounded-lg p-4 border border-navy-100">
                    <div className="text-xs text-navy-500 uppercase tracking-wider mb-1">Estimated Price</div>
                    <div className="text-2xl font-bold text-navy-900">
                      {bookingModal.flatRate
                        ? formatCurrency(bookingModal.flatRate, bookingModal.currency)
                        : formatCurrency(
                            (bookingModal.pricePerKg
                              ? parseFloat(bookingForm.weightKg) * bookingModal.pricePerKg
                              : 0) +
                              (bookingModal.pricePerM3
                                ? parseFloat(bookingForm.volumeM3) * bookingModal.pricePerM3
                                : 0),
                            bookingModal.currency
                          )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full btn-gold !py-3 text-sm disabled:opacity-50"
                >
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
