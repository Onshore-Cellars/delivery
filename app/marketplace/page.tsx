'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../components/AuthProvider'
import PortAutocomplete from '../components/PortAutocomplete'
import CargoImageUpload from '../components/CargoImageUpload'
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
  listingType?: string
  featured: boolean
  carrier: {
    id: string
    avatarUrl?: string
    name?: string
    company?: string
    receivedReviews?: { rating: number }[]
  }
  routeStops?: { portName: string; lat?: number; lng?: number; stopOrder: number }[]
  flexibleRoute?: boolean
  maxDetourKm?: number
  _count: { bookings: number }
}

interface BookingForm {
  listingId: string
  cargoDescription: string
  cargoType: string
  weightKg: string
  volumeM3: string
  itemCount: string
  declaredValue: string
  cargoLengthCm: string
  cargoWidthCm: string
  cargoHeightCm: string
  cargoImages: string[]
  specialHandling: string
  pickupAddress: string
  pickupContact: string
  pickupPhone: string
  deliveryAddress: string
  deliveryContact: string
  deliveryPhone: string
  deliveryNotes: string
  deliveryTimeWindow: string
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
  originLat: number | null
  originLng: number | null
  destLat: number | null
  destLng: number | null
  radiusKm: string
}

interface Package {
  type: 'box' | 'pallet' | 'crate' | 'tube' | 'envelope' | 'custom'
  quantity: number
  lengthCm: number
  widthCm: number
  heightCm: number
  weightKg: number
}

const PACKAGE_PRESETS: Record<string, { label: string; lengthCm: number; widthCm: number; heightCm: number; weightKg: number }> = {
  'small-box': { label: 'Small Box (40×30×30cm)', lengthCm: 40, widthCm: 30, heightCm: 30, weightKg: 5 },
  'medium-box': { label: 'Medium Box (60×40×40cm)', lengthCm: 60, widthCm: 40, heightCm: 40, weightKg: 15 },
  'large-box': { label: 'Large Box (80×60×50cm)', lengthCm: 80, widthCm: 60, heightCm: 50, weightKg: 30 },
  'wine-case': { label: 'Wine Case (12 bottles)', lengthCm: 50, widthCm: 34, heightCm: 18, weightKg: 16 },
  'euro-pallet': { label: 'Euro Pallet (120×80cm)', lengthCm: 120, widthCm: 80, heightCm: 150, weightKg: 500 },
  'half-pallet': { label: 'Half Pallet (80×60cm)', lengthCm: 80, widthCm: 60, heightCm: 100, weightKg: 250 },
  'crate': { label: 'Shipping Crate', lengthCm: 100, widthCm: 60, heightCm: 60, weightKg: 50 },
  'tube': { label: 'Tube/Roll', lengthCm: 120, widthCm: 15, heightCm: 15, weightKg: 10 },
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
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-[#1a1a1a] placeholder:text-slate-400 focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none'
const selectClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none appearance-none'

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
    originLat: null, originLng: null, destLat: null, destLng: null, radiusKm: '50',
  })
  const [activeTab, setActiveTab] = useState<'SPACE_AVAILABLE' | 'SPACE_NEEDED'>('SPACE_AVAILABLE')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertName, setAlertName] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertSuccess, setAlertSuccess] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    listingId: '', cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    itemCount: '1', declaredValue: '',
    cargoLengthCm: '', cargoWidthCm: '', cargoHeightCm: '',
    cargoImages: [],
    specialHandling: '', pickupAddress: '', pickupContact: '', pickupPhone: '',
    deliveryAddress: '', deliveryContact: '', deliveryPhone: '', deliveryNotes: '', deliveryTimeWindow: '',
    yachtName: '', yachtMMSI: '', berthNumber: '', marinaName: '', routeDirection: 'outbound',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [showPackagePicker, setShowPackagePicker] = useState(false)

  const mobileFilterRef = useRef<HTMLDivElement>(null)

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true)
    try {
      const res = await fetch(`/api/listings?featured=true&limit=4&listingType=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setFeaturedListings(data.listings || [])
      } else {
        setFetchError('Failed to load featured listings.')
      }
    } catch (err) {
      console.error('Error fetching featured:', err)
      setFetchError('Failed to load featured listings.')
    }
    finally { setFeaturedLoading(false) }
  }, [activeTab])

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
      if (filters.features.refrigerated) params.append('hasRefrigeration', 'true')
      if (filters.features.gps) params.append('hasGPS', 'true')
      if (filters.features.tailLift) params.append('hasTailLift', 'true')
      if (filters.originLat && filters.originLng) {
        params.append('originLat', String(filters.originLat))
        params.append('originLng', String(filters.originLng))
        params.append('radiusKm', filters.radiusKm || '50')
      }
      if (filters.destLat && filters.destLng) {
        params.append('destLat', String(filters.destLat))
        params.append('destLng', String(filters.destLng))
        params.append('radiusKm', filters.radiusKm || '50')
      }
      params.append('listingType', activeTab)
      params.append('limit', String(ITEMS_PER_PAGE))
      params.append('page', String(page))

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
        setPagination(data.pagination || { page, limit: ITEMS_PER_PAGE, total: 0, pages: 0 })
        setFetchError('')
      } else {
        setFetchError('Failed to load listings. Please try again.')
      }
    } catch (err) {
      console.error('Error:', err)
      setFetchError('Failed to load listings. Please try again.')
    }
    finally { setLoading(false) }
  }, [filters, resolveVehicleType, activeTab])

  useEffect(() => { fetchListings(currentPage) }, [fetchListings, currentPage])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
    return `${symbols[currency] || currency}${amount.toFixed(2)}`
  }

  const openBooking = (listing: Listing) => {
    setBookingModal(listing)
    setBookingForm({
      listingId: listing.id, cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
      itemCount: '1', declaredValue: '',
      cargoLengthCm: '', cargoWidthCm: '', cargoHeightCm: '',
      cargoImages: [],
      specialHandling: '', pickupAddress: '', pickupContact: '', pickupPhone: '',
      deliveryAddress: '', deliveryContact: '', deliveryPhone: '', deliveryNotes: '', deliveryTimeWindow: '',
      yachtName: '', yachtMMSI: '', berthNumber: '', marinaName: '', routeDirection: 'outbound',
    })
    setPackages([])
    setShowPackagePicker(false)
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
      // Redirect to Stripe checkout if available, otherwise show success
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setBookingSuccess(true)
      fetchListings(currentPage)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  const handleSearch = () => { setCurrentPage(1); fetchListings(1) }

  const resetFilters = () => {
    setFilters({ origin: '', destination: '', dateFrom: '', vehicleType: '', direction: '', minPrice: '', maxPrice: '', minWeight: '', minVolume: '', sort: '', features: { refrigerated: false, gps: false, tailLift: false }, originLat: null, originLng: null, destLat: null, destLng: null, radiusKm: '50' })
    setCurrentPage(1)
  }

  const hasActiveFilters = filters.vehicleType || filters.minPrice || filters.maxPrice || filters.minWeight || filters.minVolume || filters.sort || filters.features.refrigerated || filters.features.gps || filters.features.tailLift

  const saveAlert = async () => {
    if (!token) return
    setAlertSaving(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: alertName || `${filters.origin || 'Any'} → ${filters.destination || 'Any'}`,
          originPort: filters.origin || null,
          originLat: filters.originLat,
          originLng: filters.originLng,
          destinationPort: filters.destination || null,
          destLat: filters.destLat,
          destLng: filters.destLng,
          radiusKm: filters.radiusKm || '50',
          vehicleType: filters.vehicleType || null,
          dateFrom: filters.dateFrom || null,
          listingType: activeTab,
          direction: filters.direction || null,
        }),
      })
      if (res.ok) {
        setAlertSuccess(true)
        setTimeout(() => { setShowAlertModal(false); setAlertSuccess(false); setAlertName('') }, 1500)
      }
    } catch { /* silently fail */ }
    finally { setAlertSaving(false) }
  }

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
      {/* Radius filter — only show when a location with coordinates is selected */}
      {(filters.originLat || filters.destLat) && (
        <div>
          <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Search Radius</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              className="flex-1 accent-[#C6904D]"
              value={filters.radiusKm || '50'}
              onChange={(e) => setFilters({ ...filters, radiusKm: e.target.value })}
            />
            <span className="text-sm font-semibold text-[#1a1a1a] min-w-[52px] text-right">{filters.radiusKm || '50'} km</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Includes nearby ports within this distance</p>
        </div>
      )}

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
                  ? 'bg-[#1a1a1a] text-white shadow-sm'
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
      listing.featured || featured ? 'border-[#C6904D]/30 shadow-sm shadow-[#C6904D]/5' : 'border-slate-200'
    }`}>
      {(listing.featured || featured) && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#C6904D]/10 text-[#C6904D] rounded-lg text-xs font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Featured
          </span>
        </div>
      )}

      {listing.listingType === 'SPACE_NEEDED' && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold">
            Load Board
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#1a1a1a] text-base sm:text-lg truncate">{listing.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{listing.listingType === 'SPACE_NEEDED' ? 'Needs delivery' : `${listing.vehicleType} route`}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {listing.listingType !== 'SPACE_NEEDED' && (
          <span className="badge bg-slate-100 text-slate-700 whitespace-nowrap text-xs">
            {listing.vehicleType}
          </span>
          )}
          {listing.routeDirection === 'BOTH' && (
            <span className="badge bg-[#C6904D]/10 text-[#C6904D] border border-[#C6904D]/20 whitespace-nowrap text-[10px]">
              Two-way
            </span>
          )}
          {listing.routeDirection === 'RETURN' && (
            <span className="badge bg-slate-100 text-slate-700 border border-blue-100 whitespace-nowrap text-[10px]">
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
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{listing.listingType === 'SPACE_NEEDED' ? 'Pickup by' : 'Departs'}</div>
          <div className="font-bold text-[#1a1a1a] text-sm">{formatDate(listing.departureDate)}</div>
        </div>
      </div>

      {/* Carrier info + badges row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {listing.carrier.name && (
            <span className="text-xs text-slate-500 truncate">{listing.carrier.name}{listing.carrier.company ? ` · ${listing.carrier.company}` : ''}</span>
          )}
          {listing.carrier.receivedReviews && listing.carrier.receivedReviews.length > 0 && (() => {
            const avg = listing.carrier.receivedReviews!.reduce((s, r) => s + r.rating, 0) / listing.carrier.receivedReviews!.length
            return (
              <span className="inline-flex items-center gap-0.5 text-xs">
                <svg className="w-3 h-3 text-[#C6904D]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="font-semibold text-[#1a1a1a]">{avg.toFixed(1)}</span>
                <span className="text-slate-400">({listing.carrier.receivedReviews!.length})</span>
              </span>
            )
          })()}
        </div>
        <div className="flex items-center gap-1.5">
          {listing.flexibleRoute && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
              Flexible{listing.maxDetourKm ? ` ±${listing.maxDetourKm}km` : ''}
            </span>
          )}
          {listing.routeStops && listing.routeStops.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
              {listing.routeStops.length} stop{listing.routeStops.length > 1 ? 's' : ''}
            </span>
          )}
          {/* Share button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const url = `${window.location.origin}/listings/${listing.id}`
              const text = `${listing.originPort} → ${listing.destinationPort} · ${formatDate(listing.departureDate)}`
              if (navigator.share) {
                navigator.share({ title: listing.title, text, url }).catch(() => {})
              } else {
                navigator.clipboard.writeText(url)
              }
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Share"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </div>
      </div>

      {/* Capacity & Price footer */}
      <div className="flex items-end justify-between pt-3 border-t border-slate-100">
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{listing.listingType === 'SPACE_NEEDED' ? 'Cargo' : 'Weight'}</div>
            <div className="text-sm font-bold text-[#1a1a1a]">{listing.availableKg.toFixed(0)} kg</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Volume</div>
            <div className="text-sm font-bold text-[#1a1a1a]">{listing.availableM3.toFixed(1)} m&sup3;</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {listing.listingType === 'SPACE_NEEDED' ? (
              <div className="text-lg font-bold text-[#1a1a1a]">
                {listing.flatRate ? (
                  <span>Budget: {formatCurrency(listing.flatRate, listing.currency)}</span>
                ) : listing.pricePerKg ? (
                  <span>Budget: {formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>
                ) : (
                  <span className="text-sm text-slate-400">Budget TBD</span>
                )}
              </div>
            ) : (
              <>
                {listing.flatRate ? (
                  <div className="text-lg font-bold text-[#1a1a1a]">{formatCurrency(listing.flatRate, listing.currency)}</div>
                ) : (
                  <div className="text-sm font-semibold text-[#1a1a1a]">
                    {listing.pricePerKg && <span>{formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>}
                    {listing.pricePerKg && listing.pricePerM3 && <span className="text-slate-300 mx-1">&middot;</span>}
                    {listing.pricePerM3 && <span>{formatCurrency(listing.pricePerM3, listing.currency)}/m&sup3;</span>}
                  </div>
                )}
              </>
            )}
          </div>
          {user ? (
            listing.listingType === 'SPACE_NEEDED' ? (
              <button onClick={() => openBooking(listing)} className="btn-primary !text-sm !py-2.5 !px-5 !min-h-0 !rounded-xl !bg-orange-600 hover:!bg-orange-700">
                Offer to Deliver
              </button>
            ) : (
              <button onClick={() => openBooking(listing)} className="btn-primary !text-sm !py-2.5 !px-5 !min-h-0 !rounded-xl">
                Book
              </button>
            )
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
      {fetchError && (
        <div className="site-container pt-4">
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800">{fetchError}</p>
          </div>
        </div>
      )}
      {/* Search header */}
      <div className="bg-white border-b border-slate-200">
        <div className="site-container py-8 sm:py-10">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">Marketplace</h1>
              <p className="text-sm text-slate-500 mt-1">{activeTab === 'SPACE_NEEDED' ? 'Loads needing drivers' : 'Find van space to any destination'}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1a1a1a]' : 'text-slate-400'}`} title="List view">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-[#1a1a1a]' : 'text-slate-400'}`} title="Calendar view">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
              </div>

              {/* Set alert button */}
              {user && (filters.origin || filters.destination) && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C6904D]/30 bg-[#C6904D]/5 text-sm font-semibold text-[#C6904D] hover:bg-[#C6904D]/10 transition-colors"
                  title="Get notified when matching listings appear"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="hidden sm:inline">Set Alert</span>
                </button>
              )}

              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#1a1a1a] hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#1a1a1a]" />}
              </button>
            </div>
          </div>

          {/* Listing type tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
            <button
              onClick={() => { setActiveTab('SPACE_AVAILABLE'); setCurrentPage(1) }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'SPACE_AVAILABLE'
                  ? 'bg-white text-[#1a1a1a] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Available Space
            </button>
            <button
              onClick={() => { setActiveTab('SPACE_NEEDED'); setCurrentPage(1) }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'SPACE_NEEDED'
                  ? 'bg-white text-[#1a1a1a] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Loads Needing Drivers
            </button>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <PortAutocomplete
                value={filters.origin}
                onChange={v => setFilters(f => ({ ...f, origin: v, originLat: null, originLng: null }))}
                onSelect={data => data && setFilters(f => ({ ...f, originLat: data.lat || null, originLng: data.lng || null }))}
                placeholder="Origin port..."
              />
            </div>
            <div className="relative flex-1">
              <PortAutocomplete
                value={filters.destination}
                onChange={v => setFilters(f => ({ ...f, destination: v, destLat: null, destLng: null }))}
                onSelect={data => data && setFilters(f => ({ ...f, destLat: data.lat || null, destLng: data.lng || null }))}
                placeholder="Destination port..."
              />
            </div>
            <input type="date" className={inputClass + ' sm:w-44'} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            <button onClick={handleSearch} className="btn-primary !text-sm !py-3 !px-6 whitespace-nowrap">
              Search
            </button>
          </div>
          {(filters.originLat || filters.destLat) && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C6904D]/10 text-[#C6904D] rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {filters.radiusKm || '50'} km radius
              </span>
              <button onClick={() => setFilters(f => ({ ...f, originLat: null, originLng: null, destLat: null, destLng: null }))} className="text-xs text-slate-400 hover:text-slate-600">Clear radius</button>
            </div>
          )}
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
              <svg className="w-5 h-5 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 24 24">
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

        {/* Calendar View */}
        {viewMode === 'calendar' && !loading && listings.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {(() => {
                  const today = new Date()
                  const startOfWeek = new Date(today)
                  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7))
                  const days: Date[] = []
                  for (let i = 0; i < 28; i++) {
                    const d = new Date(startOfWeek)
                    d.setDate(startOfWeek.getDate() + i)
                    days.push(d)
                  }
                  return days.map((day, i) => {
                    const dayStr = day.toISOString().split('T')[0]
                    const dayListings = listings.filter(l => l.departureDate.split('T')[0] === dayStr)
                    const isToday = day.toDateString() === today.toDateString()
                    return (
                      <div key={i} className={`min-h-[80px] p-1.5 border-b border-r border-slate-50 ${isToday ? 'bg-[#C6904D]/5' : ''}`}>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[#C6904D] font-bold' : 'text-slate-500'}`}>
                          {day.getDate()}
                        </div>
                        {dayListings.slice(0, 2).map(l => (
                          <div key={l.id} onClick={() => openBooking(l)} className="cursor-pointer text-[9px] leading-tight px-1 py-0.5 mb-0.5 rounded bg-[#C6904D]/10 text-[#C6904D] truncate font-medium hover:bg-[#C6904D]/20 transition-colors">
                            {l.originPort.split(',')[0]} → {l.destinationPort.split(',')[0]}
                          </div>
                        ))}
                        {dayListings.length > 2 && (
                          <div className="text-[9px] text-slate-400 px-1">+{dayListings.length - 2} more</div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
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

                {/* Package Builder */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[#1a1a1a]">Packages</label>
                    <button type="button" onClick={() => setShowPackagePicker(!showPackagePicker)}
                      className="text-xs text-[#C6904D] font-medium hover:underline">
                      {showPackagePicker ? 'Hide presets' : 'Add packages'}
                    </button>
                  </div>

                  {showPackagePicker && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(PACKAGE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const newPkg: Package = {
                              type: key.includes('pallet') ? 'pallet' : key.includes('crate') ? 'crate' : key.includes('tube') ? 'tube' : 'box',
                              quantity: 1,
                              ...preset,
                            }
                            const updated = [...packages, newPkg]
                            setPackages(updated)
                            // Auto-calculate totals
                            const totalWeight = updated.reduce((sum, p) => sum + p.weightKg * p.quantity, 0)
                            const totalVolume = updated.reduce((sum, p) => sum + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1000000, 0)
                            setBookingForm(prev => ({
                              ...prev,
                              weightKg: totalWeight.toFixed(1),
                              volumeM3: totalVolume.toFixed(2),
                              itemCount: String(updated.reduce((sum, p) => sum + p.quantity, 0)),
                            }))
                          }}
                          className="text-left p-2 rounded-lg border border-slate-200 hover:border-[#C6904D] hover:bg-[#C6904D]/5 transition-colors"
                        >
                          <div className="text-xs font-medium text-[#1a1a1a]">{preset.label}</div>
                          <div className="text-[10px] text-slate-400">{preset.weightKg}kg</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Package list */}
                  {packages.length > 0 && (
                    <div className="space-y-2">
                      {packages.map((pkg, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                          <select
                            value={pkg.quantity}
                            onChange={(e) => {
                              const updated = [...packages]
                              updated[idx] = { ...pkg, quantity: Number(e.target.value) }
                              setPackages(updated)
                              const totalWeight = updated.reduce((sum, p) => sum + p.weightKg * p.quantity, 0)
                              const totalVolume = updated.reduce((sum, p) => sum + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1000000, 0)
                              setBookingForm(prev => ({
                                ...prev,
                                weightKg: totalWeight.toFixed(1),
                                volumeM3: totalVolume.toFixed(2),
                                itemCount: String(updated.reduce((sum, p) => sum + p.quantity, 0)),
                              }))
                            }}
                            className="w-16 px-2 py-1 rounded border border-slate-200 text-sm"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}×</option>)}
                          </select>
                          <div className="flex-1 text-xs text-[#1a1a1a]">
                            {PACKAGE_PRESETS[Object.keys(PACKAGE_PRESETS).find(k => {
                              const p = PACKAGE_PRESETS[k]
                              return p.lengthCm === pkg.lengthCm && p.widthCm === pkg.widthCm && p.heightCm === pkg.heightCm
                            }) || '']?.label || `${pkg.lengthCm}×${pkg.widthCm}×${pkg.heightCm}cm`}
                          </div>
                          <span className="text-xs text-slate-500">{(pkg.weightKg * pkg.quantity).toFixed(1)}kg</span>
                          <button type="button" onClick={() => {
                            const updated = packages.filter((_, i) => i !== idx)
                            setPackages(updated)
                            const totalWeight = updated.reduce((sum, p) => sum + p.weightKg * p.quantity, 0)
                            const totalVolume = updated.reduce((sum, p) => sum + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1000000, 0)
                            setBookingForm(prev => ({
                              ...prev,
                              weightKg: totalWeight.toFixed(1),
                              volumeM3: totalVolume.toFixed(2),
                              itemCount: String(updated.reduce((sum, p) => sum + p.quantity, 0)),
                            }))
                          }} className="text-red-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
                        <span>Total: {packages.reduce((s, p) => s + p.quantity, 0)} items</span>
                        <span>{packages.reduce((s, p) => s + p.weightKg * p.quantity, 0).toFixed(1)} kg / {packages.reduce((s, p) => s + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1000000, 0).toFixed(2)} m³</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 -mb-2">Or enter weight and volume manually below</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Weight (kg) *</label>
                    <input type="number" required step="0.1" min="0.1" max={bookingModal.availableKg} className={inputClass} placeholder={`Max ${bookingModal.availableKg}kg`} value={bookingForm.weightKg} onChange={(e) => setBookingForm({ ...bookingForm, weightKg: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Volume (m&sup3;) *</label>
                    <input type="number" required step="0.1" min="0.1" max={bookingModal.availableM3} className={inputClass} placeholder={`Max ${bookingModal.availableM3}m\u00B3`} value={bookingForm.volumeM3} onChange={(e) => setBookingForm({ ...bookingForm, volumeM3: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Items</label>
                    <input type="number" min="1" step="1" className={inputClass} placeholder="1" value={bookingForm.itemCount} onChange={(e) => setBookingForm({ ...bookingForm, itemCount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Declared Value</label>
                    <input type="number" min="0" step="0.01" className={inputClass} placeholder="e.g. 5000" value={bookingForm.declaredValue} onChange={(e) => setBookingForm({ ...bookingForm, declaredValue: e.target.value })} />
                  </div>
                </div>

                {/* Cargo Dimensions */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cargo Size (optional)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Length (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoLengthCm} onChange={(e) => setBookingForm({ ...bookingForm, cargoLengthCm: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Width (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoWidthCm} onChange={(e) => setBookingForm({ ...bookingForm, cargoWidthCm: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Height (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoHeightCm} onChange={(e) => setBookingForm({ ...bookingForm, cargoHeightCm: e.target.value })} />
                    </div>
                  </div>
                  {bookingForm.cargoLengthCm && bookingForm.cargoWidthCm && bookingForm.cargoHeightCm && (
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {(parseFloat(bookingForm.cargoLengthCm) * parseFloat(bookingForm.cargoWidthCm) / 10000).toFixed(2)} m&sup2; floor area &middot;{' '}
                      {(parseFloat(bookingForm.cargoLengthCm) * parseFloat(bookingForm.cargoWidthCm) * parseFloat(bookingForm.cargoHeightCm) / 1000000).toFixed(3)} m&sup3; volume
                    </p>
                  )}
                </div>

                {/* Cargo Photos */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cargo Photos (optional)</p>
                  <CargoImageUpload
                    images={bookingForm.cargoImages}
                    onChange={(imgs) => setBookingForm({ ...bookingForm, cargoImages: imgs })}
                    maxImages={5}
                  />
                </div>

                {/* Pickup Details */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pickup Details</p>
                  <div className="space-y-3">
                    <input type="text" className={inputClass} placeholder="Pickup address" value={bookingForm.pickupAddress} onChange={(e) => setBookingForm({ ...bookingForm, pickupAddress: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className={inputClass} placeholder="Contact name" value={bookingForm.pickupContact} onChange={(e) => setBookingForm({ ...bookingForm, pickupContact: e.target.value })} />
                      <input type="tel" className={inputClass} placeholder="Phone" value={bookingForm.pickupPhone} onChange={(e) => setBookingForm({ ...bookingForm, pickupPhone: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Delivery Details</p>
                  <div className="space-y-3">
                    <input type="text" className={inputClass} placeholder="Delivery address (marina, port, etc.)" value={bookingForm.deliveryAddress} onChange={(e) => setBookingForm({ ...bookingForm, deliveryAddress: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className={inputClass} placeholder="Contact name" value={bookingForm.deliveryContact} onChange={(e) => setBookingForm({ ...bookingForm, deliveryContact: e.target.value })} />
                      <input type="tel" className={inputClass} placeholder="Phone" value={bookingForm.deliveryPhone} onChange={(e) => setBookingForm({ ...bookingForm, deliveryPhone: e.target.value })} />
                    </div>
                    <input type="text" className={inputClass} placeholder="Delivery notes" value={bookingForm.deliveryNotes} onChange={(e) => setBookingForm({ ...bookingForm, deliveryNotes: e.target.value })} />
                    <select className={selectClass} value={bookingForm.deliveryTimeWindow} onChange={(e) => setBookingForm({ ...bookingForm, deliveryTimeWindow: e.target.value })}>
                      <option value="">Delivery time window (any)</option>
                      <option value="morning">Morning (08:00-12:00)</option>
                      <option value="afternoon">Afternoon (12:00-17:00)</option>
                      <option value="evening">Evening (17:00-21:00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Special Handling</label>
                  <input type="text" className={inputClass} placeholder="e.g. Refrigerated, fragile" value={bookingForm.specialHandling} onChange={(e) => setBookingForm({ ...bookingForm, specialHandling: e.target.value })} />
                </div>

                {/* Yacht / Vessel Details */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-[#C6904D] uppercase tracking-wider mb-3">Delivery Location</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Yacht Name</label>
                        <input type="text" className={inputClass} placeholder="e.g. MY Serenity" value={bookingForm.yachtName} onChange={(e) => setBookingForm({ ...bookingForm, yachtName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Berth Number</label>
                        <input type="text" className={inputClass} placeholder="e.g. B-24" value={bookingForm.berthNumber} onChange={(e) => setBookingForm({ ...bookingForm, berthNumber: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1a1a1a] mb-1">Marina</label>
                      <input type="text" className={inputClass} placeholder="e.g. Port Vauban" value={bookingForm.marinaName} onChange={(e) => setBookingForm({ ...bookingForm, marinaName: e.target.value })} />
                    </div>
                    {/* MMSI — only shown for yacht accounts */}
                    {user && (user.role === 'YACHT_OWNER' || user.role === 'CREW') && (
                      <div>
                        <label className="block text-xs font-medium text-[#1a1a1a] mb-1">MMSI Number</label>
                        <input type="text" className={inputClass} placeholder="9-digit MMSI for vessel tracking" maxLength={9} pattern="\d{9}" value={bookingForm.yachtMMSI} onChange={(e) => setBookingForm({ ...bookingForm, yachtMMSI: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                        {bookingForm.yachtMMSI && bookingForm.yachtMMSI.length === 9 && (
                          <div className="flex items-center gap-2 text-xs text-[#1a1a1a] mt-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            <a href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${bookingForm.yachtMMSI}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Track vessel on MarineTraffic
                            </a>
                          </div>
                        )}
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
                    <div className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">Estimated Price</div>
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

      {/* ---- ALERT MODAL ---- */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAlertModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
            {alertSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-semibold text-[#1a1a1a]">Alert saved!</p>
                <p className="text-xs text-slate-500 mt-1">We&apos;ll notify you when matching listings appear.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Set Listing Alert</h3>
                <p className="text-xs text-slate-500 mb-4">Get notified when new listings match your search.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1a1a] mb-1">Alert Name (optional)</label>
                    <input type="text" className={inputClass} placeholder={`${filters.origin || 'Any'} → ${filters.destination || 'Any'}`} value={alertName} onChange={e => setAlertName(e.target.value)} />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                    {filters.origin && <div><span className="font-semibold">From:</span> {filters.origin}</div>}
                    {filters.destination && <div><span className="font-semibold">To:</span> {filters.destination}</div>}
                    {filters.dateFrom && <div><span className="font-semibold">After:</span> {filters.dateFrom}</div>}
                    {(filters.originLat || filters.destLat) && <div><span className="font-semibold">Radius:</span> {filters.radiusKm || '50'} km</div>}
                    <div><span className="font-semibold">Type:</span> {activeTab === 'SPACE_NEEDED' ? 'Loads' : 'Available Space'}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveAlert} disabled={alertSaving} className="btn-primary flex-1 text-sm !py-2.5 disabled:opacity-50">
                      {alertSaving ? 'Saving...' : 'Save Alert'}
                    </button>
                    <button onClick={() => setShowAlertModal(false)} className="btn-secondary text-sm !py-2.5 !px-4">Cancel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="bg-[#1a1a1a] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            Link copied to clipboard
          </div>
        </div>
      )}
    </div>
  )
}
