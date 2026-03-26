'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../components/AuthProvider'
import PortAutocomplete from '../components/PortAutocomplete'
import AddressAutocomplete from '../components/AddressAutocomplete'
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
  pickupCity: string
  pickupCountry: string
  pickupContact: string
  pickupPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryCountry: string
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

const PACKAGE_PRESETS: Record<string, { label: string; lengthCm: number; widthCm: number; heightCm: number; weightKg: number; group: string }> = {
  // Boxes
  'small-box': { label: 'Small Box (30×30×30cm)', lengthCm: 30, widthCm: 30, heightCm: 30, weightKg: 5, group: 'Boxes' },
  'medium-box': { label: 'Medium Box (50×40×40cm)', lengthCm: 50, widthCm: 40, heightCm: 40, weightKg: 15, group: 'Boxes' },
  'large-box': { label: 'Large Box (60×50×50cm)', lengthCm: 60, widthCm: 50, heightCm: 50, weightKg: 25, group: 'Boxes' },
  // Pallets — Euro standards
  'quarter-pallet': { label: 'Quarter Pallet (60×40cm)', lengthCm: 60, widthCm: 40, heightCm: 150, weightKg: 150, group: 'Pallets' },
  'half-pallet': { label: 'Half Euro Pallet (80×60cm)', lengthCm: 80, widthCm: 60, heightCm: 150, weightKg: 300, group: 'Pallets' },
  'euro-pallet': { label: 'Euro Pallet (120×80cm)', lengthCm: 120, widthCm: 80, heightCm: 150, weightKg: 500, group: 'Pallets' },
  'uk-pallet': { label: 'Full Pallet UK (120×100cm)', lengthCm: 120, widthCm: 100, heightCm: 150, weightKg: 600, group: 'Pallets' },
  'industrial-pallet': { label: 'Industrial Pallet (120×120cm)', lengthCm: 120, widthCm: 120, heightCm: 150, weightKg: 800, group: 'Pallets' },
  // Other
  'crate': { label: 'Shipping Crate', lengthCm: 100, widthCm: 60, heightCm: 60, weightKg: 50, group: 'Other' },
  'drum': { label: 'Drum / Barrel', lengthCm: 60, widthCm: 60, heightCm: 90, weightKg: 100, group: 'Other' },
  'tube': { label: 'Tube / Roll', lengthCm: 120, widthCm: 15, heightCm: 15, weightKg: 10, group: 'Other' },
  'envelope': { label: 'Envelope / Document', lengthCm: 35, widthCm: 25, heightCm: 3, weightKg: 1, group: 'Other' },
  'bag': { label: 'Bag / Sack', lengthCm: 60, widthCm: 40, heightCm: 40, weightKg: 20, group: 'Other' },
  'ibc': { label: 'IBC Container', lengthCm: 120, widthCm: 100, heightCm: 115, weightKg: 1000, group: 'Other' },
  'custom': { label: 'Custom Dimensions', lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0, group: 'Other' },
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
  'w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-[#162E3D] text-[15px] text-[#F7F9FB] placeholder:text-[#6B7C86] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 transition-all outline-none'
const selectClass =
  'w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-[#162E3D] text-[15px] text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 transition-all outline-none appearance-none'

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

  // AI search state
  const [aiQuery, setAiQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [aiParsedSummary, setAiParsedSummary] = useState('')
  const [aiError, setAiError] = useState('')

  const [bookingModal, setBookingModal] = useState<Listing | null>(null)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    listingId: '', cargoDescription: '', cargoType: '', weightKg: '', volumeM3: '',
    itemCount: '1', declaredValue: '',
    cargoLengthCm: '', cargoWidthCm: '', cargoHeightCm: '',
    cargoImages: [],
    specialHandling: '', pickupAddress: '', pickupCity: '', pickupCountry: '', pickupContact: '', pickupPhone: '',
    deliveryAddress: '', deliveryCity: '', deliveryCountry: '', deliveryContact: '', deliveryPhone: '', deliveryNotes: '', deliveryTimeWindow: '',
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

  const handleAiSearch = async () => {
    if (!aiQuery.trim() || !token) return
    setAiSearching(true)
    setAiError('')
    setAiParsedSummary('')
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: aiQuery.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to parse search')
      }
      const parsed = await res.json()

      // Map parsed AI response to existing filter state
      setFilters(f => ({
        ...f,
        origin: parsed.originPort || f.origin,
        destination: parsed.destinationPort || f.destination,
        dateFrom: parsed.dateFrom || f.dateFrom,
        vehicleType: parsed.vehicleType || f.vehicleType,
        maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : f.maxPrice,
        direction: parsed.direction && parsed.direction !== 'both' ? parsed.direction : f.direction,
        features: {
          ...f.features,
          refrigerated: parsed.needsRefrigeration || f.features.refrigerated,
        },
        // Reset geo coords since AI gives port names, not coords
        originLat: null, originLng: null, destLat: null, destLng: null,
      }))

      // Build summary string
      const parts: string[] = []
      if (parsed.originPort && parsed.destinationPort) parts.push(`${parsed.originPort} → ${parsed.destinationPort}`)
      else if (parsed.originPort) parts.push(`from ${parsed.originPort}`)
      else if (parsed.destinationPort) parts.push(`to ${parsed.destinationPort}`)
      if (parsed.cargoType) parts.push(parsed.cargoType)
      if (parsed.vehicleType) parts.push(parsed.vehicleType)
      if (parsed.maxPrice) parts.push(`max €${parsed.maxPrice}`)
      if (parsed.dateFrom) parts.push(parsed.dateFrom)
      if (parsed.needsRefrigeration) parts.push('refrigerated')
      setAiParsedSummary(parts.length > 0 ? `AI parsed: ${parts.join(', ')}` : 'AI parsed your query')

      setCurrentPage(1)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI search failed')
    } finally {
      setAiSearching(false)
    }
  }

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
          <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Search Radius</label>
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
            <span className="text-sm font-semibold text-[#F7F9FB] min-w-[52px] text-right">{filters.radiusKm || '50'} km</span>
          </div>
          <p className="text-xs text-[#6B7C86] mt-1">Includes nearby ports within this distance</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Route Direction</label>
        <select className={selectClass} value={filters.direction} onChange={(e) => setFilters({ ...filters, direction: e.target.value })}>
          <option value="">All Directions</option>
          <option value="outbound">Outbound (to yacht/marina)</option>
          <option value="return">Return (back from yacht)</option>
          <option value="both">Two-way routes only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Vehicle Type</label>
        <select className={selectClass} value={filters.vehicleType} onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}>
          {VEHICLE_TYPES.map(vt => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" min="0" className={inputClass} value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          <input type="number" placeholder="Max" min="0" className={inputClass} value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Min Capacity</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input type="number" placeholder="Weight" min="0" className={inputClass + ' pr-10'} value={filters.minWeight} onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7C86] font-medium">kg</span>
          </div>
          <div className="relative">
            <input type="number" placeholder="Volume" min="0" step="0.1" className={inputClass + ' pr-10'} value={filters.minVolume} onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7C86] font-medium">m&sup3;</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Features</label>
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
                  : 'bg-[#102535] text-[#9AADB8] hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Sort By</label>
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
    <div className={`bg-[#162E3D] rounded-2xl border p-5 sm:p-6 card-hover transition-all ${
      listing.featured || featured ? 'border-[#C6904D]/30 shadow-sm shadow-[#C6904D]/5' : 'border-white/[0.08]'
    }`}>
      {(listing.featured || featured) && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FF6A2A]/10 text-[#FF6A2A] rounded-lg text-xs font-semibold">
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
          <h3 className="font-bold text-[#F7F9FB] text-base sm:text-lg truncate">{listing.title}</h3>
          <p className="text-sm text-[#6B7C86] mt-0.5">{listing.listingType === 'SPACE_NEEDED' ? 'Needs delivery' : `${listing.vehicleType} route`}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {listing.listingType !== 'SPACE_NEEDED' && (
          <span className="badge bg-[#102535] text-[#9AADB8] whitespace-nowrap text-xs">
            {listing.vehicleType}
          </span>
          )}
          {listing.routeDirection === 'BOTH' && (
            <span className="badge bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#C6904D]/20 whitespace-nowrap text-[10px]">
              Two-way
            </span>
          )}
          {listing.routeDirection === 'RETURN' && (
            <span className="badge bg-[#102535] text-[#9AADB8] border border-blue-100 whitespace-nowrap text-[10px]">
              Return
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-4 bg-[#102535] rounded-xl p-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">From</div>
          <div className="font-bold text-[#F7F9FB] text-sm truncate">{listing.originPort}</div>
          {listing.originRegion && <div className="text-xs text-[#6B7C86] truncate">{listing.originRegion}</div>}
        </div>
        <div className="flex-shrink-0 text-[#6B7C86]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">To</div>
          <div className="font-bold text-[#F7F9FB] text-sm truncate">{listing.destinationPort}</div>
          {listing.destinationRegion && <div className="text-xs text-[#6B7C86] truncate">{listing.destinationRegion}</div>}
        </div>
        <div className="text-right flex-shrink-0 border-l border-white/[0.08] pl-3">
          <div className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">{listing.listingType === 'SPACE_NEEDED' ? 'Pickup by' : 'Departs'}</div>
          <div className="font-bold text-[#F7F9FB] text-sm">{formatDate(listing.departureDate)}</div>
        </div>
      </div>

      {/* Carrier info + badges row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {listing.carrier.name && (
            <span className="text-xs text-[#6B7C86] truncate">{listing.carrier.name}{listing.carrier.company ? ` · ${listing.carrier.company}` : ''}</span>
          )}
          {listing.carrier.receivedReviews && listing.carrier.receivedReviews.length > 0 && (() => {
            const avg = listing.carrier.receivedReviews!.reduce((s, r) => s + r.rating, 0) / listing.carrier.receivedReviews!.length
            return (
              <span className="inline-flex items-center gap-0.5 text-xs">
                <svg className="w-3 h-3 text-[#FF6A2A]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="font-semibold text-[#F7F9FB]">{avg.toFixed(1)}</span>
                <span className="text-[#6B7C86]">({listing.carrier.receivedReviews!.length})</span>
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#102535] text-[#9AADB8] rounded text-[10px] font-semibold">
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
            className="p-1.5 rounded-lg hover:bg-[#162E3D] text-[#6B7C86] hover:text-[#9AADB8] transition-colors"
            title="Share"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </div>
      </div>

      {/* Capacity & Price footer */}
      <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">{listing.listingType === 'SPACE_NEEDED' ? 'Cargo' : 'Weight'}</div>
            <div className="text-sm font-bold text-[#F7F9FB]">{listing.availableKg.toFixed(0)} kg</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">Volume</div>
            <div className="text-sm font-bold text-[#F7F9FB]">{listing.availableM3.toFixed(1)} m&sup3;</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {listing.listingType === 'SPACE_NEEDED' ? (
              <div className="text-lg font-bold text-[#F7F9FB]">
                {listing.flatRate ? (
                  <span>Budget: {formatCurrency(listing.flatRate, listing.currency)}</span>
                ) : listing.pricePerKg ? (
                  <span>Budget: {formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>
                ) : (
                  <span className="text-sm text-[#6B7C86]">Budget TBD</span>
                )}
              </div>
            ) : (
              <>
                {listing.flatRate ? (
                  <div className="text-lg font-bold text-[#F7F9FB]">{formatCurrency(listing.flatRate, listing.currency)}</div>
                ) : (
                  <div className="text-sm font-semibold text-[#F7F9FB]">
                    {listing.pricePerKg && <span>{formatCurrency(listing.pricePerKg, listing.currency)}/kg</span>}
                    {listing.pricePerKg && listing.pricePerM3 && <span className="text-[#6B7C86] mx-1">&middot;</span>}
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
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-200">
            <p className="text-sm font-medium text-red-800">{fetchError}</p>
          </div>
        </div>
      )}
      {/* Search header */}
      <div className="bg-[#162E3D] border-b border-white/[0.08]">
        <div className="site-container py-8 sm:py-10">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F7F9FB] tracking-tight">Marketplace</h1>
              <p className="text-sm text-[#6B7C86] mt-1">{activeTab === 'SPACE_NEEDED' ? 'Loads needing drivers' : 'Find van space to any destination'}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-[#102535] rounded-lg p-0.5">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#162E3D] shadow-sm text-[#F7F9FB]' : 'text-[#6B7C86]'}`} title="List view">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[#162E3D] shadow-sm text-[#F7F9FB]' : 'text-[#6B7C86]'}`} title="Calendar view">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
              </div>

              {/* Set alert button */}
              {user && (filters.origin || filters.destination) && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#C6904D]/30 bg-[#FF6A2A]/5 text-sm font-semibold text-[#FF6A2A] hover:bg-[#FF6A2A]/10 transition-colors"
                  title="Get notified when matching listings appear"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="hidden sm:inline">Set Alert</span>
                </button>
              )}

              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#162E3D] text-sm font-semibold text-[#F7F9FB] hover:bg-[#162E3D] active:bg-[#102535] transition-colors"
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
          <div className="flex gap-1 p-1 bg-[#102535] rounded-xl mb-4">
            <button
              onClick={() => { setActiveTab('SPACE_AVAILABLE'); setCurrentPage(1) }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'SPACE_AVAILABLE'
                  ? 'bg-[#162E3D] text-[#F7F9FB] shadow-sm'
                  : 'text-[#6B7C86] hover:text-[#9AADB8]'
              }`}
            >
              Available Space
            </button>
            <button
              onClick={() => { setActiveTab('SPACE_NEEDED'); setCurrentPage(1) }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'SPACE_NEEDED'
                  ? 'bg-[#162E3D] text-[#F7F9FB] shadow-sm'
                  : 'text-[#6B7C86] hover:text-[#9AADB8]'
              }`}
            >
              Loads Needing Drivers
            </button>
          </div>

          {/* AI Search bar */}
          <div className="mb-4">
            <form
              onSubmit={(e) => { e.preventDefault(); handleAiSearch() }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF6A2A]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Try: 'wine delivery from Antibes to Palma next week under €200'"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#C6904D]/30 bg-[#FF6A2A]/[0.03] text-[15px] text-[#F7F9FB] placeholder:text-[#6B7C86] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={aiSearching || !aiQuery.trim()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF6A2A] text-white text-sm font-semibold hover:bg-[#b5803f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {aiSearching ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
                <span className="hidden sm:inline">Search with AI</span>
              </button>
            </form>
            {aiParsedSummary && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A2A]/10 text-[#FF6A2A] rounded-full text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  {aiParsedSummary}
                </span>
                <button
                  onClick={() => { setAiParsedSummary(''); setAiQuery(''); resetFilters() }}
                  className="text-xs text-[#6B7C86] hover:text-[#9AADB8] transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
            {aiError && (
              <p className="mt-2 text-xs text-red-500">{aiError}</p>
            )}
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FF6A2A]/10 text-[#FF6A2A] rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {filters.radiusKm || '50'} km radius
              </span>
              <button onClick={() => setFilters(f => ({ ...f, originLat: null, originLng: null, destLat: null, destLng: null }))} className="text-xs text-[#6B7C86] hover:text-[#9AADB8]">Clear radius</button>
            </div>
          )}
        </div>
      </div>

      {/* ---- FILTER SHEET (works for mobile AND desktop) ---- */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div ref={mobileFilterRef} className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#162E3D] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-[#162E3D] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#F7F9FB]">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-xl hover:bg-[#162E3D] text-[#6B7C86] transition-colors">
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
              <svg className="w-5 h-5 text-[#F7F9FB]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-lg font-bold text-[#F7F9FB]">Featured Routes</h2>
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
            <p className="text-sm text-[#6B7C86] font-medium">
              {pagination.total === 0 ? 'No routes found' : `${pagination.total} route${pagination.total !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 rounded-xl border border-white/[0.08] bg-[#162E3D] text-sm text-[#F7F9FB] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
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
            <div className="bg-[#162E3D] rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider">{d}</div>
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
                      <div key={i} className={`min-h-[80px] p-1.5 border-b border-r border-slate-50 ${isToday ? 'bg-[#FF6A2A]/5' : ''}`}>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[#FF6A2A] font-bold' : 'text-[#6B7C86]'}`}>
                          {day.getDate()}
                        </div>
                        {dayListings.slice(0, 2).map(l => (
                          <div key={l.id} onClick={() => openBooking(l)} className="cursor-pointer text-[9px] leading-tight px-1 py-0.5 mb-0.5 rounded bg-[#FF6A2A]/10 text-[#FF6A2A] truncate font-medium hover:bg-[#FF6A2A]/20 transition-colors">
                            {l.originPort.split(',')[0]} → {l.destinationPort.split(',')[0]}
                          </div>
                        ))}
                        {dayListings.length > 2 && (
                          <div className="text-[9px] text-[#6B7C86] px-1">+{dayListings.length - 2} more</div>
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
        <div aria-live="polite" role="status">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-52 rounded-2xl" aria-hidden="true" />)}
            <span className="sr-only">Loading listings...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[#162E3D] rounded-2xl border border-white/[0.08] p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#102535] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-[#F7F9FB] font-semibold text-lg mb-2">No routes found</p>
            <p className="text-sm text-[#6B7C86] mb-6">Try adjusting your search or filters</p>
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
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-[#162E3D] text-[#9AADB8] hover:bg-[#162E3D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {pageNumbers().map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`e-${i}`} className="px-2 text-[#6B7C86] text-sm">...</span>
                  ) : (
                    <button key={p} onClick={() => goToPage(p)} className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-colors ${
                      p === pagination.page ? 'bg-[#1a1a1a] text-white' : 'border border-white/[0.08] bg-[#162E3D] text-[#9AADB8] hover:bg-[#162E3D]'
                    }`}>{p}</button>
                  )
                )}
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-[#162E3D] text-[#9AADB8] hover:bg-[#162E3D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* ---- BOOKING MODAL ---- */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingModal(null)} />
          <div className="relative bg-[#162E3D] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-up">
            {/* Header */}
            <div className="sticky top-0 bg-[#162E3D] border-b border-white/[0.06] px-5 sm:px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#F7F9FB]">Book Space</h2>
                  <p className="text-sm text-[#6B7C86] mt-0.5">
                    {bookingModal.originPort} &rarr; {bookingModal.destinationPort} &middot; {formatDate(bookingModal.departureDate)}
                  </p>
                </div>
                <button onClick={() => setBookingModal(null)} className="p-2 rounded-xl hover:bg-[#162E3D] text-[#6B7C86] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#9ED36A]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#9ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#F7F9FB] mb-2">Booking Confirmed!</h3>
                <p className="text-[#6B7C86] mb-6">Your space has been reserved. Check your dashboard for details.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard" className="btn-primary !text-sm !py-2.5">View Dashboard</Link>
                  <button onClick={() => setBookingModal(null)} className="btn-secondary !text-sm !py-2.5">Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="p-5 sm:p-6 space-y-4">
                {bookingError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/15">
                    <p className="text-sm text-red-400">{bookingError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Cargo Description *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Wine cases for MY Ocean Dream" value={bookingForm.cargoDescription} onChange={(e) => setBookingForm({ ...bookingForm, cargoDescription: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Cargo Type</label>
                  <select className={selectClass} value={bookingForm.cargoType} onChange={(e) => setBookingForm({ ...bookingForm, cargoType: e.target.value })}>
                    <option value="">Select type...</option>
                    <option value="Provisions & Food">Provisions & Food</option>
                    <option value="Wine & Spirits">Wine & Spirits</option>
                    <option value="Marine Equipment">Marine Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Crew Gear & Uniforms">Crew Gear & Uniforms</option>
                    <option value="Interior & Decor">Interior & Decor</option>
                    <option value="Chandlery">Chandlery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Sails & Canvas">Sails & Canvas</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Package Builder */}
                <div className="border border-white/[0.08] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-[#F7F9FB]">Packages</label>
                    <button type="button" onClick={() => setShowPackagePicker(!showPackagePicker)}
                      className="text-xs text-[#FF6A2A] font-medium hover:underline">
                      {showPackagePicker ? 'Hide presets' : 'Add packages'}
                    </button>
                  </div>

                  {showPackagePicker && (
                    <div className="space-y-3 mb-3">
                      {['Pallets', 'Boxes', 'Other'].map(group => (
                        <div key={group}>
                          <p className="text-[10px] font-semibold text-[#6B7C86] uppercase tracking-wider mb-1.5">{group}</p>
                          <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PACKAGE_PRESETS).filter(([, p]) => p.group === group).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const newPkg: Package = {
                              type: key.includes('pallet') ? 'pallet' : key.includes('crate') ? 'crate' : key.includes('tube') ? 'tube' : key.includes('drum') ? 'custom' : 'box',
                              quantity: 1,
                              lengthCm: preset.lengthCm,
                              widthCm: preset.widthCm,
                              heightCm: preset.heightCm,
                              weightKg: preset.weightKg,
                            }
                            const updated = [...packages, newPkg]
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
                          className="text-left p-2 rounded-lg border border-white/[0.08] hover:border-[#C6904D] hover:bg-[#FF6A2A]/5 transition-colors"
                        >
                          <div className="text-xs font-medium text-[#F7F9FB]">{preset.label}</div>
                          <div className="text-[10px] text-[#6B7C86]">{preset.weightKg}kg &middot; {(preset.lengthCm * preset.widthCm * preset.heightCm / 1000000).toFixed(2)}m&sup3;</div>
                        </button>
                      ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Package list */}
                  {packages.length > 0 && (
                    <div className="space-y-2">
                      {packages.map((pkg, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#102535] rounded-lg p-2">
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
                            className="w-16 px-2 py-1 rounded border border-white/[0.08] text-sm"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}×</option>)}
                          </select>
                          <div className="flex-1 text-xs text-[#F7F9FB]">
                            {PACKAGE_PRESETS[Object.keys(PACKAGE_PRESETS).find(k => {
                              const p = PACKAGE_PRESETS[k]
                              return p.lengthCm === pkg.lengthCm && p.widthCm === pkg.widthCm && p.heightCm === pkg.heightCm
                            }) || '']?.label || `${pkg.lengthCm}×${pkg.widthCm}×${pkg.heightCm}cm`}
                          </div>
                          <span className="text-xs text-[#6B7C86]">{(pkg.weightKg * pkg.quantity).toFixed(1)}kg</span>
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
                      <div className="flex justify-between text-xs text-[#6B7C86] pt-1 border-t border-white/[0.08]">
                        <span>Total: {packages.reduce((s, p) => s + p.quantity, 0)} items</span>
                        <span>{packages.reduce((s, p) => s + p.weightKg * p.quantity, 0).toFixed(1)} kg / {packages.reduce((s, p) => s + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1000000, 0).toFixed(2)} m³</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#6B7C86] -mb-2">Or enter weight and volume manually below</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Weight (kg) *</label>
                    <input type="number" required step="0.1" min="0.1" max={bookingModal.availableKg} className={inputClass} placeholder={`Max ${bookingModal.availableKg}kg`} value={bookingForm.weightKg} onChange={(e) => setBookingForm({ ...bookingForm, weightKg: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Volume (m&sup3;) *</label>
                    <input type="number" required step="0.1" min="0.1" max={bookingModal.availableM3} className={inputClass} placeholder={`Max ${bookingModal.availableM3}m\u00B3`} value={bookingForm.volumeM3} onChange={(e) => setBookingForm({ ...bookingForm, volumeM3: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Items</label>
                    <input type="number" min="1" step="1" className={inputClass} placeholder="1" value={bookingForm.itemCount} onChange={(e) => setBookingForm({ ...bookingForm, itemCount: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Declared Value</label>
                    <input type="number" min="0" step="0.01" className={inputClass} placeholder="e.g. 5000" value={bookingForm.declaredValue} onChange={(e) => setBookingForm({ ...bookingForm, declaredValue: e.target.value })} />
                  </div>
                </div>

                {/* Cargo Dimensions — auto-calculates volume */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Cargo Size (optional — auto-fills volume)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6B7C86] mb-1">Length (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoLengthCm} onChange={(e) => {
                        const l = parseFloat(e.target.value) || 0
                        const w = parseFloat(bookingForm.cargoWidthCm) || 0
                        const h = parseFloat(bookingForm.cargoHeightCm) || 0
                        const count = parseInt(bookingForm.itemCount) || 1
                        const vol = l > 0 && w > 0 && h > 0 ? ((l * w * h * count) / 1000000).toFixed(2) : bookingForm.volumeM3
                        setBookingForm({ ...bookingForm, cargoLengthCm: e.target.value, ...(l > 0 && w > 0 && h > 0 ? { volumeM3: vol } : {}) })
                      }} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B7C86] mb-1">Width (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoWidthCm} onChange={(e) => {
                        const l = parseFloat(bookingForm.cargoLengthCm) || 0
                        const w = parseFloat(e.target.value) || 0
                        const h = parseFloat(bookingForm.cargoHeightCm) || 0
                        const count = parseInt(bookingForm.itemCount) || 1
                        const vol = l > 0 && w > 0 && h > 0 ? ((l * w * h * count) / 1000000).toFixed(2) : bookingForm.volumeM3
                        setBookingForm({ ...bookingForm, cargoWidthCm: e.target.value, ...(l > 0 && w > 0 && h > 0 ? { volumeM3: vol } : {}) })
                      }} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B7C86] mb-1">Height (cm)</label>
                      <input type="number" min="0" step="1" className={inputClass} placeholder="cm" value={bookingForm.cargoHeightCm} onChange={(e) => {
                        const l = parseFloat(bookingForm.cargoLengthCm) || 0
                        const w = parseFloat(bookingForm.cargoWidthCm) || 0
                        const h = parseFloat(e.target.value) || 0
                        const count = parseInt(bookingForm.itemCount) || 1
                        const vol = l > 0 && w > 0 && h > 0 ? ((l * w * h * count) / 1000000).toFixed(2) : bookingForm.volumeM3
                        setBookingForm({ ...bookingForm, cargoHeightCm: e.target.value, ...(l > 0 && w > 0 && h > 0 ? { volumeM3: vol } : {}) })
                      }} />
                    </div>
                  </div>
                  {bookingForm.cargoLengthCm && bookingForm.cargoWidthCm && bookingForm.cargoHeightCm && (
                    <p className="text-[11px] text-[#6B7C86] mt-1.5">
                      {(parseFloat(bookingForm.cargoLengthCm) * parseFloat(bookingForm.cargoWidthCm) / 10000).toFixed(2)} m&sup2; floor area &middot;{' '}
                      {(parseFloat(bookingForm.cargoLengthCm) * parseFloat(bookingForm.cargoWidthCm) * parseFloat(bookingForm.cargoHeightCm) / 1000000).toFixed(3)} m&sup3; volume
                    </p>
                  )}
                </div>

                {/* Cargo Photos */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Cargo Photos (optional)</p>
                  <CargoImageUpload
                    images={bookingForm.cargoImages}
                    onChange={(imgs) => setBookingForm({ ...bookingForm, cargoImages: imgs })}
                    maxImages={5}
                  />
                </div>

                {/* Pickup Details */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Pickup Details</p>
                  <div className="space-y-3">
                    <AddressAutocomplete
                      value={bookingForm.pickupAddress}
                      onChange={(val) => setBookingForm({ ...bookingForm, pickupAddress: val })}
                      onSelect={(addr) => setBookingForm((prev) => ({ ...prev, pickupAddress: addr.display, pickupCity: addr.city || '', pickupCountry: addr.country || '' }))}
                      placeholder="Pickup address"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className={inputClass} placeholder="Contact name" value={bookingForm.pickupContact} onChange={(e) => setBookingForm({ ...bookingForm, pickupContact: e.target.value })} />
                      <input type="tel" className={inputClass} placeholder="Phone" value={bookingForm.pickupPhone} onChange={(e) => setBookingForm({ ...bookingForm, pickupPhone: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Delivery Details</p>
                  <div className="space-y-3">
                    <AddressAutocomplete
                      value={bookingForm.deliveryAddress}
                      onChange={(val) => setBookingForm({ ...bookingForm, deliveryAddress: val })}
                      onSelect={(addr) => setBookingForm((prev) => ({ ...prev, deliveryAddress: addr.display, deliveryCity: addr.city || '', deliveryCountry: addr.country || '' }))}
                      placeholder="Delivery address (marina, port, etc.)"
                      className={inputClass}
                    />
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
                  <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Special Handling</label>
                  <input type="text" className={inputClass} placeholder="e.g. Refrigerated, fragile" value={bookingForm.specialHandling} onChange={(e) => setBookingForm({ ...bookingForm, specialHandling: e.target.value })} />
                </div>

                {/* Yacht / Vessel Details */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#FF6A2A] uppercase tracking-wider mb-3">Delivery Location</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#F7F9FB] mb-1">Yacht Name</label>
                        <input type="text" className={inputClass} placeholder="e.g. MY Serenity" value={bookingForm.yachtName} onChange={(e) => setBookingForm({ ...bookingForm, yachtName: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#F7F9FB] mb-1">Berth Number</label>
                        <input type="text" className={inputClass} placeholder="e.g. B-24" value={bookingForm.berthNumber} onChange={(e) => setBookingForm({ ...bookingForm, berthNumber: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#F7F9FB] mb-1">Marina</label>
                      <input type="text" className={inputClass} placeholder="e.g. Port Vauban" value={bookingForm.marinaName} onChange={(e) => setBookingForm({ ...bookingForm, marinaName: e.target.value })} />
                    </div>
                    {/* MMSI — only shown for yacht accounts */}
                    {user && (user.role === 'YACHT_OWNER' || user.role === 'CREW') && (
                      <div>
                        <label className="block text-xs font-medium text-[#F7F9FB] mb-1">MMSI Number</label>
                        <input type="text" className={inputClass} placeholder="9-digit MMSI for vessel tracking" maxLength={9} pattern="\d{9}" value={bookingForm.yachtMMSI} onChange={(e) => setBookingForm({ ...bookingForm, yachtMMSI: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                        {bookingForm.yachtMMSI && bookingForm.yachtMMSI.length === 9 && (
                          <div className="flex items-center gap-2 text-xs text-[#F7F9FB] mt-1.5">
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
                    <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Which leg?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'outbound', label: 'Outbound', desc: `To ${bookingModal.destinationPort}` },
                        { value: 'return', label: 'Return', desc: `Back to ${bookingModal.originPort}` },
                      ].map(opt => (
                        <label key={opt.value} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${bookingForm.routeDirection === opt.value ? 'border-[#C6904D] bg-[#FF6A2A]/10/50' : 'border-white/[0.08]'}`}>
                          <input type="radio" name="routeDirection" value={opt.value} checked={bookingForm.routeDirection === opt.value} onChange={(e) => setBookingForm({ ...bookingForm, routeDirection: e.target.value })} className="sr-only" />
                          <span className="text-sm font-semibold text-[#F7F9FB]">{opt.label}</span>
                          <span className="text-[11px] text-[#6B7C86]">{opt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price estimate */}
                {bookingForm.weightKg && bookingForm.volumeM3 && (
                  <div className="bg-[#102535] rounded-xl p-4 border border-white/[0.08]">
                    <div className="text-xs font-semibold text-[#F7F9FB] uppercase tracking-wider mb-1">Estimated Price</div>
                    <div className="text-2xl font-bold text-[#F7F9FB]">
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
          <div className="relative bg-[#162E3D] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
            {alertSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-semibold text-[#F7F9FB]">Alert saved!</p>
                <p className="text-xs text-[#6B7C86] mt-1">We&apos;ll notify you when matching listings appear.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[#F7F9FB] mb-1">Set Listing Alert</h3>
                <p className="text-xs text-[#6B7C86] mb-4">Get notified when new listings match your search.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#F7F9FB] mb-1">Alert Name (optional)</label>
                    <input type="text" className={inputClass} placeholder={`${filters.origin || 'Any'} → ${filters.destination || 'Any'}`} value={alertName} onChange={e => setAlertName(e.target.value)} />
                  </div>
                  <div className="bg-[#102535] rounded-xl p-3 text-xs text-[#9AADB8] space-y-1">
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
