'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'
import PortAutocomplete, { type AddressData } from '../../components/PortAutocomplete'
import { vehicleSpecs, vehicleTypes, getVehicleMakes, getModelsForMake, type VehicleSpec } from '@/lib/vehicles'

export default function CreateListingPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedSpec, setSelectedSpec] = useState<VehicleSpec | null>(null)
  const [listingType, setListingType] = useState<'SPACE_AVAILABLE' | 'SPACE_NEEDED'>('SPACE_AVAILABLE')
  const [showVehicleRequirements, setShowVehicleRequirements] = useState(false)
  const isSpaceNeeded = listingType === 'SPACE_NEEDED'
  const [form, setForm] = useState({
    title: '',
    description: '',
    vehicleType: '',
    vehicleName: '',
    vehicleReg: '',
    insuranceValue: '',
    hasRefrigeration: false,
    hasTailLift: false,
    hasGPS: true,
    originPort: '',
    originRegion: '',
    originCountry: '',
    originLat: 0,
    originLng: 0,
    destinationPort: '',
    destinationRegion: '',
    destinationCountry: '',
    destinationLat: 0,
    destinationLng: 0,
    departureDate: '',
    estimatedArrival: '',
    totalCapacityKg: '',
    totalCapacityM3: '',
    maxItemLength: '',
    maxItemWidth: '',
    maxItemHeight: '',
    pricePerKg: '',
    pricePerM3: '',
    flatRate: '',
    currency: 'EUR',
    minimumCharge: '',
    biddingEnabled: false,
    minBidPrice: '',
    acceptedCargo: '',
    restrictedItems: '',
    routeDirection: 'OUTBOUND',
    returnDepartureDate: '',
    returnEstimatedArrival: '',
    returnAvailableKg: '',
    returnAvailableM3: '',
    returnPricePerKg: '',
    returnPricePerM3: '',
    returnFlatRate: '',
    returnNotes: '',
    cargoDescription: '',
    specialRequirements: '',
    flexibleRoute: false,
    maxDetourKm: '30',
    flexibleStops: false,
  })

  const [costEstimate, setCostEstimate] = useState<null | { fuelCost: number; tollEstimate: number; ferryWarning?: string; totalEstimate: number; breakdown: { label: string; amount: number }[] }>(null)
  const [estimateDistance, setEstimateDistance] = useState('')
  const [estimateDuration, setEstimateDuration] = useState('')
  const [distanceSource, setDistanceSource] = useState<'google' | 'estimate' | ''>('')
  const [estimateLoading, setEstimateLoading] = useState(false)
  const [estimateOpen, setEstimateOpen] = useState(false)
  const distanceFetchRef = useRef(false)
  const [generatingDescription, setGeneratingDescription] = useState(false)

  const makes = useMemo(() => getVehicleMakes(), [])
  const modelsForMake = useMemo(() => selectedMake ? getModelsForMake(selectedMake) : [], [selectedMake])

  const handleMakeChange = (make: string) => {
    setSelectedMake(make)
    setSelectedSpec(null)
  }

  const handleModelSelect = (modelStr: string) => {
    if (!modelStr) {
      setSelectedSpec(null)
      return
    }
    const spec = vehicleSpecs.find(v => v.make === selectedMake && v.model === modelStr)
    if (spec) {
      setSelectedSpec(spec)
      setForm(prev => ({
        ...prev,
        vehicleType: spec.type,
        vehicleName: `${spec.make} ${spec.model}`,
        totalCapacityKg: String(spec.maxPayloadKg),
        totalCapacityM3: String(spec.cargoVolumeM3),
        maxItemLength: String(spec.cargoLengthCm),
        maxItemWidth: String(spec.cargoWidthCm),
        maxItemHeight: String(spec.cargoHeightCm),
        hasRefrigeration: spec.type === 'Refrigerated Van',
      }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setForm({ ...form, [target.name]: value })
  }

  // Auto-calculate distance when both origin and destination have coordinates
  const fetchDistance = useCallback(async (oLat: number, oLng: number, dLat: number, dLng: number) => {
    if (!oLat || !oLng || !dLat || !dLng) return
    if (distanceFetchRef.current) return
    distanceFetchRef.current = true
    try {
      const res = await fetch('/api/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originLat: oLat, originLng: oLng, destinationLat: dLat, destinationLng: dLng }),
      })
      if (res.ok) {
        const data = await res.json()
        setEstimateDistance(String(data.distanceKm))
        setEstimateDuration(data.durationText || '')
        setDistanceSource(data.source || 'estimate')
        setEstimateOpen(true) // Auto-open the cost estimator panel
      }
    } catch { /* fallback — user can still enter manually */ }
    distanceFetchRef.current = false
  }, [])

  // Trigger distance calc whenever both coordinates are set
  useEffect(() => {
    if (form.originLat && form.originLng && form.destinationLat && form.destinationLng) {
      fetchDistance(form.originLat, form.originLng, form.destinationLat, form.destinationLng)
    }
  }, [form.originLat, form.originLng, form.destinationLat, form.destinationLng, fetchDistance])

  // Auto-trigger cost estimate when distance + country + vehicle type are all set
  useEffect(() => {
    if (!estimateDistance || !form.originCountry || !form.destinationCountry || !form.vehicleType) return
    const timer = setTimeout(async () => {
      setEstimateLoading(true)
      setCostEstimate(null)
      try {
        const res = await fetch('/api/route-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originCountry: form.originCountry,
            destinationCountry: form.destinationCountry,
            distanceKm: Number(estimateDistance),
            vehicleType: form.vehicleType,
            fuelType: selectedSpec?.fuelType,
          }),
        })
        const data = await res.json()
        if (res.ok) setCostEstimate(data.estimate)
      } catch { /* ignore */ }
      setEstimateLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [estimateDistance, form.originCountry, form.destinationCountry, form.vehicleType, selectedSpec?.fuelType])

  const handleEstimateCost = async () => {
    if (!estimateDistance || !form.originCountry || !form.destinationCountry || !form.vehicleType) return
    setEstimateLoading(true)
    setCostEstimate(null)
    try {
      const res = await fetch('/api/route-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCountry: form.originCountry,
          destinationCountry: form.destinationCountry,
          distanceKm: Number(estimateDistance),
          vehicleType: form.vehicleType,
          fuelType: selectedSpec?.fuelType,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCostEstimate(data.estimate)
    } catch {
      setCostEstimate(null)
    } finally {
      setEstimateLoading(false)
    }
  }

  const handleGenerateDescription = async () => {
    setGeneratingDescription(true)
    try {
      const features = [
        form.hasRefrigeration && 'Refrigeration',
        form.hasTailLift && 'Tail Lift',
        form.hasGPS && 'GPS Tracking',
      ].filter(Boolean)
      const res = await fetch('/api/ai/listing-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          origin: form.originPort,
          destination: form.destinationPort,
          vehicleType: form.vehicleType,
          vehicleName: form.vehicleName,
          departureDate: form.departureDate,
          capacity: form.totalCapacityKg ? `${form.totalCapacityKg}kg / ${form.totalCapacityM3}m³` : '',
          features,
          routeDirection: form.routeDirection,
          acceptedCargo: form.acceptedCargo,
          returnNotes: form.returnNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate description')
      setForm(prev => ({ ...prev, description: data.description }))
    } catch (err) {
      console.error('AI description generation failed:', err)
    } finally {
      setGeneratingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, listingType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  if (!user || (!user.canCarry && !user.canShip && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-6">Enable &ldquo;I can carry / deliver&rdquo; in your profile to create listings.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/profile" className="btn-primary text-sm">Update Profile</Link>
            <Link href="/dashboard" className="btn-outline text-sm">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  const inputCls = "w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 focus:bg-white transition-all outline-none"
  const selectCls = `${inputCls} bg-slate-50/50`
  const labelCls = "block text-sm font-medium text-[#1a1a1a] mb-1.5"

  return (
    <div className="page-container narrow">
        <div className="mb-8 sm:mb-10">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#1a1a1a] transition-colors">
            &larr; Back to Dashboard
          </Link>
          <p className="text-[11px] font-semibold text-[#C6904D] uppercase tracking-[0.15em] mt-4 sm:mt-5 mb-1">New Listing</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">{isSpaceNeeded ? 'Post a Load / Space Needed' : 'List Your Van Space'}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{isSpaceNeeded ? 'Describe what you need delivered and let carriers bid.' : 'Share spare capacity on your next delivery run.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100" role="alert">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Listing Type Toggle */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">What do you need?</h2>
            <p className="text-xs text-slate-400 mb-4">Choose whether you have space to offer or need something delivered.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  listingType === 'SPACE_AVAILABLE'
                    ? 'border-[#C6904D] bg-amber-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="SPACE_AVAILABLE"
                  checked={listingType === 'SPACE_AVAILABLE'}
                  onChange={() => setListingType('SPACE_AVAILABLE')}
                  className="sr-only"
                />
                <span className="text-2xl">&#128666;</span>
                <span className="text-sm font-semibold text-[#1a1a1a]">I have space available</span>
                <span className="text-xs text-slate-400">List spare capacity on your vehicle</span>
              </label>
              <label
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  listingType === 'SPACE_NEEDED'
                    ? 'border-[#C6904D] bg-amber-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="SPACE_NEEDED"
                  checked={listingType === 'SPACE_NEEDED'}
                  onChange={() => setListingType('SPACE_NEEDED')}
                  className="sr-only"
                />
                <span className="text-2xl">&#128230;</span>
                <span className="text-sm font-semibold text-[#1a1a1a]">I need space / delivery</span>
                <span className="text-xs text-slate-400">Post a load for carriers to bid on</span>
              </label>
            </div>
          </div>

          {/* Vehicle Selection - hidden for SPACE_NEEDED unless user opts in */}
          {(!isSpaceNeeded || showVehicleRequirements) && (
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">{isSpaceNeeded ? 'Vehicle Requirements' : 'Vehicle Selection'}</h2>
            <p className="text-xs text-slate-400 mb-4">{isSpaceNeeded ? 'Specify vehicle requirements for your shipment (optional).' : 'Select your vehicle to auto-fill capacity specs, or enter manually below.'}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Vehicle Make</label>
                  <select
                    className={selectCls}
                    value={selectedMake}
                    onChange={e => handleMakeChange(e.target.value)}
                  >
                    <option value="">— Select Make —</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Vehicle Model</label>
                  <select
                    className={selectCls}
                    value={selectedSpec?.model || ''}
                    onChange={e => handleModelSelect(e.target.value)}
                    disabled={!selectedMake}
                  >
                    <option value="">— Select Model —</option>
                    {modelsForMake.map(v => (
                      <option key={v.model} value={v.model}>
                        {v.model} — {v.maxPayloadKg}kg / {v.cargoVolumeM3}m&sup3;
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSpec && (
                <div className="rounded-lg bg-[#f5f5f7] border border-[#d2d2d7] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">&#128666;</span>
                    <span className="font-semibold text-[#1a1a1a] text-sm">{selectedSpec.make} {selectedSpec.model}</span>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1a1a1a]">{selectedSpec.type}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white rounded-lg p-2.5 text-center">
                      <div className="font-bold text-[#1a1a1a] text-base">{selectedSpec.maxPayloadKg}</div>
                      <div className="text-slate-400 mt-0.5">kg payload</div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 text-center">
                      <div className="font-bold text-[#1a1a1a] text-base">{selectedSpec.cargoVolumeM3}</div>
                      <div className="text-slate-400 mt-0.5">m&sup3; volume</div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 text-center">
                      <div className="font-bold text-[#1a1a1a] text-base">{selectedSpec.cargoLengthCm}</div>
                      <div className="text-slate-400 mt-0.5">cm length</div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 text-center">
                      <div className="font-bold text-[#1a1a1a] text-base">{selectedSpec.cargoWidthCm}x{selectedSpec.cargoHeightCm}</div>
                      <div className="text-slate-400 mt-0.5">cm W&times;H</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Vehicle requirements toggle for SPACE_NEEDED */}
          {isSpaceNeeded && !showVehicleRequirements && (
            <button
              type="button"
              onClick={() => setShowVehicleRequirements(true)}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all"
            >
              + Add vehicle requirements (optional)
            </button>
          )}

          {/* Cargo Description & Special Requirements for SPACE_NEEDED */}
          {isSpaceNeeded && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Cargo Information</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Cargo Description *</label>
                  <textarea
                    name="cargoDescription"
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Describe what you need shipped, e.g. 10 cases of wine, marine engine parts..."
                    value={form.cargoDescription}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>Special Requirements</label>
                  <textarea
                    name="specialRequirements"
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="e.g. Needs refrigeration, fragile items, must be insured for X..."
                    value={form.specialRequirements}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Route Details */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Route Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="listing-title" className={labelCls}>Listing Title *</label>
                <input
                  id="listing-title"
                  name="title"
                  type="text"
                  required
                  className={inputCls}
                  placeholder="e.g. Antibes to Monaco - Weekly Run"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="listing-description" className="text-sm font-medium text-[#1a1a1a]">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#C6904D] hover:text-[#b07e3a] disabled:opacity-50 transition-colors"
                  >
                    {generatingDescription ? (
                      <>
                        <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <span className="text-sm leading-none">&#10022;</span>
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="listing-description"
                  name="description"
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Describe your route, vehicle condition, any restrictions..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="listing-origin" className={labelCls}>Origin (Port, Address or Company) *</label>
                  <PortAutocomplete
                    id="listing-origin"
                    value={form.originPort}
                    onChange={v => setForm(prev => ({ ...prev, originPort: v }))}
                    onSelect={(data: AddressData | null) => {
                      if (data) {
                        setForm(prev => ({
                          ...prev,
                          originPort: data.address || `${data.name}, ${data.city}`,
                          originRegion: data.region || prev.originRegion,
                          originCountry: data.country || prev.originCountry,
                          originLat: data.lat || 0,
                          originLng: data.lng || 0,
                        }))
                      }
                    }}
                    placeholder="e.g. Port Vauban, Antibes or a company address"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Origin Region</label>
                  <input
                    name="originRegion"
                    type="text"
                    className={inputCls}
                    placeholder="Auto-filled, or type manually"
                    value={form.originRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="listing-destination" className={labelCls}>Destination (Port, Address or Company) *</label>
                  <PortAutocomplete
                    id="listing-destination"
                    value={form.destinationPort}
                    onChange={v => setForm(prev => ({ ...prev, destinationPort: v }))}
                    onSelect={(data: AddressData | null) => {
                      if (data) {
                        setForm(prev => ({
                          ...prev,
                          destinationPort: data.address || `${data.name}, ${data.city}`,
                          destinationRegion: data.region || prev.destinationRegion,
                          destinationCountry: data.country || prev.destinationCountry,
                          destinationLat: data.lat || 0,
                          destinationLng: data.lng || 0,
                        }))
                      }
                    }}
                    placeholder="e.g. Port Hercules, Monaco or a company address"
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Destination Region</label>
                  <input
                    name="destinationRegion"
                    type="text"
                    className={inputCls}
                    placeholder="Auto-filled, or type manually"
                    value={form.destinationRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="listing-departure-date" className={labelCls}>Departure Date *</label>
                  <input
                    id="listing-departure-date"
                    name="departureDate"
                    type="datetime-local"
                    required
                    className={inputCls}
                    value={form.departureDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>Est. Arrival</label>
                  <input
                    name="estimatedArrival"
                    type="datetime-local"
                    className={inputCls}
                    value={form.estimatedArrival}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two-Way Route */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Route Direction</h2>
            <p className="text-xs text-slate-400 mb-4">Offer space on your return journey too &mdash; reduce empty runs and earn more.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'OUTBOUND', label: 'Outbound Only', desc: 'To destination' },
                  { value: 'RETURN', label: 'Return Only', desc: 'Heading back' },
                  { value: 'BOTH', label: 'Both Ways', desc: 'Space there & back' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      form.routeDirection === opt.value
                        ? 'border-[#C6904D] bg-amber-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="routeDirection"
                      value={opt.value}
                      checked={form.routeDirection === opt.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-[#1a1a1a]">{opt.label}</span>
                    <span className="text-xs text-slate-400">{opt.desc}</span>
                  </label>
                ))}
              </div>

              {(form.routeDirection === 'BOTH' || form.routeDirection === 'RETURN') && (
                <div className="mt-4 p-4 rounded-xl bg-[#faf9f7] border border-[#e8e4de] space-y-4">
                  <p className="text-xs font-semibold text-[#C6904D] uppercase tracking-wide">Return Journey Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Return Departure</label>
                      <input name="returnDepartureDate" type="datetime-local" className={inputCls} value={form.returnDepartureDate} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={labelCls}>Return Est. Arrival</label>
                      <input name="returnEstimatedArrival" type="datetime-local" className={inputCls} value={form.returnEstimatedArrival} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Return Capacity (kg)</label>
                      <input name="returnAvailableKg" type="number" step="0.1" className={inputCls} placeholder="e.g. 1200" value={form.returnAvailableKg} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={labelCls}>Return Volume (m&sup3;)</label>
                      <input name="returnAvailableM3" type="number" step="0.1" className={inputCls} placeholder="e.g. 8.5" value={form.returnAvailableM3} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Return Price/kg</label>
                      <input name="returnPricePerKg" type="number" step="0.01" className={inputCls} placeholder="e.g. 1.50" value={form.returnPricePerKg} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={labelCls}>Return Price/m&sup3;</label>
                      <input name="returnPricePerM3" type="number" step="0.01" className={inputCls} placeholder="e.g. 30.00" value={form.returnPricePerM3} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={labelCls}>Return Flat Rate</label>
                      <input name="returnFlatRate" type="number" step="0.01" className={inputCls} placeholder="e.g. 300.00" value={form.returnFlatRate} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Return Journey Notes</label>
                    <input name="returnNotes" type="text" className={inputCls} placeholder="e.g. Van empty on return, full capacity. Can collect from yacht." value={form.returnNotes} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle & Capacity */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">{isSpaceNeeded ? 'Shipment Size' : 'Vehicle & Capacity'}</h2>
            {!isSpaceNeeded && selectedSpec && <p className="text-xs text-emerald-500 font-medium mb-4">Auto-filled from {selectedSpec.make} {selectedSpec.model} specs. You can override any value.</p>}
            {!isSpaceNeeded && !selectedSpec && <p className="text-xs text-slate-400 mb-4">Enter capacity manually, or select a vehicle above to auto-fill.</p>}
            {isSpaceNeeded && <p className="text-xs text-slate-400 mb-4">Enter the size and weight of your cargo.</p>}
            <div className="space-y-4">
              {!isSpaceNeeded && (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    required
                    className={selectCls}
                    value={form.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="">— Select Type —</option>
                    {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Vehicle Name</label>
                  <input
                    name="vehicleName"
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Mercedes Sprinter 316"
                    value={form.vehicleName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Vehicle Registration</label>
                  <input
                    name="vehicleReg"
                    type="text"
                    className={inputCls}
                    placeholder="e.g. AB12 CDE"
                    value={form.vehicleReg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>Insurance Value (&euro;)</label>
                  <input
                    name="insuranceValue"
                    type="number"
                    step="0.01"
                    className={inputCls}
                    placeholder="e.g. 50000"
                    value={form.insuranceValue}
                    onChange={handleChange}
                  />
                </div>
              </div>
              </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{isSpaceNeeded ? 'Cargo Weight (kg) *' : 'Max Payload (kg) *'}</label>
                  <input
                    name="totalCapacityKg"
                    type="number"
                    required
                    step="0.1"
                    className={inputCls}
                    placeholder="e.g. 1200"
                    value={form.totalCapacityKg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>{isSpaceNeeded ? 'Cargo Volume Needed (m\u00B3) *' : 'Cargo Volume (m\u00B3) *'}</label>
                  <input
                    name="totalCapacityM3"
                    type="number"
                    required
                    step="0.1"
                    className={inputCls}
                    placeholder="e.g. 8.5"
                    value={form.totalCapacityM3}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>Max Item Length (cm)</label>
                  <input
                    name="maxItemLength"
                    type="number"
                    step="1"
                    className={inputCls}
                    placeholder="e.g. 347"
                    value={form.maxItemLength}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Item Width (cm)</label>
                  <input
                    name="maxItemWidth"
                    type="number"
                    step="1"
                    className={inputCls}
                    placeholder="e.g. 183"
                    value={form.maxItemWidth}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Item Height (cm)</label>
                  <input
                    name="maxItemHeight"
                    type="number"
                    step="1"
                    className={inputCls}
                    placeholder="e.g. 193"
                    value={form.maxItemHeight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Vehicle Features */}
              {!isSpaceNeeded && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasRefrigeration" checked={form.hasRefrigeration} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-[#1a1a1a] focus:ring-[#C6904D]" />
                  <span className="text-sm text-[#1a1a1a]">Refrigeration</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasTailLift" checked={form.hasTailLift} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-[#1a1a1a] focus:ring-[#C6904D]" />
                  <span className="text-sm text-[#1a1a1a]">Tail Lift</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="hasGPS" checked={form.hasGPS} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-[#1a1a1a] focus:ring-[#C6904D]" />
                  <span className="text-sm text-[#1a1a1a]">GPS Tracking</span>
                </label>
              </div>
              )}
            </div>
          </div>

          {/* Cargo Restrictions */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Cargo Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Accepted Cargo Types</label>
                <input
                  name="acceptedCargo"
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Marine parts, provisions, wine, electronics, general supplies"
                  value={form.acceptedCargo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelCls}>Restricted Items</label>
                <input
                  name="restrictedItems"
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Hazardous materials, flammables, live animals"
                  value={form.restrictedItems}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">{isSpaceNeeded ? 'Budget' : 'Pricing'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="listing-price-per-kg" className={labelCls}>{isSpaceNeeded ? 'Budget per kg' : 'Price per kg'}</label>
                  <input
                    id="listing-price-per-kg"
                    name="pricePerKg"
                    type="number"
                    step="0.01"
                    className={inputCls}
                    placeholder="e.g. 2.50"
                    value={form.pricePerKg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="listing-price-per-m3" className={labelCls}>Price per m&sup3;</label>
                  <input
                    id="listing-price-per-m3"
                    name="pricePerM3"
                    type="number"
                    step="0.01"
                    className={inputCls}
                    placeholder="e.g. 50.00"
                    value={form.pricePerM3}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="listing-flat-rate" className={labelCls}>{isSpaceNeeded ? 'Budget (flat rate)' : 'Or Flat Rate'}</label>
                  <input
                    id="listing-flat-rate"
                    name="flatRate"
                    type="number"
                    step="0.01"
                    className={inputCls}
                    placeholder="e.g. 500.00"
                    value={form.flatRate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Auto-pricing suggestion */}
              {form.originPort && form.destinationPort && !isSpaceNeeded && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/auto-price', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          originPort: form.originPort,
                          destinationPort: form.destinationPort,
                          distanceKm: estimateDistance || undefined,
                          weightKg: form.totalCapacityKg || undefined,
                          volumeM3: form.totalCapacityM3 || undefined,
                          vehicleType: form.vehicleType || undefined,
                        }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const s = data.suggestion
                        setForm(prev => ({
                          ...prev,
                          pricePerKg: s.pricePerKg ? String(s.pricePerKg) : prev.pricePerKg,
                          pricePerM3: s.pricePerM3 ? String(s.pricePerM3) : prev.pricePerM3,
                          flatRate: s.flatRate ? String(s.flatRate) : prev.flatRate,
                        }))
                      }
                    } catch { /* ignore */ }
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C6904D] hover:text-[#a87a3d] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Auto-suggest prices based on similar routes
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Currency</label>
                  <select
                    name="currency"
                    className={selectCls}
                    value={form.currency}
                    onChange={handleChange}
                  >
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Minimum Charge</label>
                  <input
                    name="minimumCharge"
                    type="number"
                    step="0.01"
                    className={inputCls}
                    placeholder="e.g. 50.00"
                    value={form.minimumCharge}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Bidding */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[#1a1a1a]">Enable Bidding</label>
                    <p className="text-xs text-slate-400 mt-0.5">Allow shippers to bid on your space</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="biddingEnabled"
                      checked={form.biddingEnabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
                  </label>
                </div>
                {form.biddingEnabled && (
                  <div className="mt-3">
                    <label className={labelCls}>Minimum Bid Price</label>
                    <input
                      name="minBidPrice"
                      type="number"
                      step="0.01"
                      className={inputCls}
                      placeholder="Optional minimum bid amount"
                      value={form.minBidPrice}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Route Flexibility */}
          {!isSpaceNeeded && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Route Flexibility</h2>
              <p className="text-xs text-slate-400 mb-4">Let users along your route find your listing — even if their pickup/drop isn&apos;t your exact origin or destination.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[#1a1a1a]">Flexible Route</label>
                    <p className="text-xs text-slate-400 mt-0.5">Willing to detour for pickups/drops along your route</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="flexibleRoute" checked={form.flexibleRoute} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
                  </label>
                </div>
                {form.flexibleRoute && (
                  <div>
                    <label className={labelCls}>Max Detour (km)</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="5" max="100" step="5" className="flex-1 accent-[#C6904D]" value={form.maxDetourKm} onChange={e => setForm({ ...form, maxDetourKm: e.target.value })} />
                      <span className="text-sm font-semibold text-[#1a1a1a] min-w-[48px] text-right">{form.maxDetourKm} km</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Users within {form.maxDetourKm}km of your route line will see this listing</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[#1a1a1a]">Extra Stops OK</label>
                    <p className="text-xs text-slate-400 mt-0.5">Willing to add stops along the way for additional pickups</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="flexibleStops" checked={form.flexibleStops} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Route Cost Estimator */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de]">
            <button
              type="button"
              onClick={() => setEstimateOpen(!estimateOpen)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
            >
              <div>
                <h2 className="text-lg font-bold text-[#1a1a1a]">Route Cost Estimator</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {estimateDistance
                    ? `${estimateDistance} km${estimateDuration ? ` · ${estimateDuration}` : ''}${distanceSource === 'google' ? ' (Google Maps)' : distanceSource === 'estimate' ? ' (estimated)' : ''}`
                    : 'Estimate fuel, tolls & ferry costs to help set your prices.'}
                </p>
              </div>
              <span className={`text-slate-400 transition-transform ${estimateOpen ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>
            {estimateOpen && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 border-t border-slate-100 pt-4">
                {estimateDuration && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-[#C6904D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Estimated drive time: <strong>{estimateDuration}</strong></span>
                    {distanceSource === 'google' && <span className="text-xs text-slate-400">(Google Maps)</span>}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Distance (km) {distanceSource && <span className="text-xs font-normal text-slate-400">— auto-calculated, adjust if needed</span>}</label>
                    <input
                      type="number"
                      step="1"
                      className={inputCls}
                      placeholder="e.g. 950"
                      value={estimateDistance}
                      onChange={e => { setEstimateDistance(e.target.value); setDistanceSource(''); }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleEstimateCost}
                      disabled={estimateLoading || !estimateDistance || !form.originCountry || !form.destinationCountry || !form.vehicleType}
                      className="btn-outline text-sm !py-2.5 w-full disabled:opacity-40"
                    >
                      {estimateLoading ? 'Calculating...' : 'Recalculate'}
                    </button>
                  </div>
                </div>

                {(!form.originCountry || !form.destinationCountry) && (
                  <p className="text-xs text-amber-600">Fill in origin and destination above to enable the estimator.</p>
                )}
                {!form.vehicleType && (
                  <p className="text-xs text-amber-600">Select a vehicle type above to enable the estimator.</p>
                )}

                {costEstimate && (
                  <div className="rounded-xl bg-[#faf9f7] border border-[#e8e4de] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#C6904D] uppercase tracking-wide">Cost Breakdown</p>
                    <div className="space-y-2">
                      {costEstimate.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-medium text-[#1a1a1a]">&euro;{item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-[#e8e4de]">
                        <span className="font-semibold text-[#1a1a1a]">Total Estimated Cost</span>
                        <span className="font-bold text-[#1a1a1a]">&euro;{costEstimate.totalEstimate.toFixed(2)}</span>
                      </div>
                    </div>

                    {costEstimate.ferryWarning && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs text-amber-800 font-medium">&#9875; Ferry: {costEstimate.ferryWarning}</p>
                      </div>
                    )}

                    {/* Guide pricing suggestions */}
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Guide Pricing</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Budget', margin: 1.15, color: 'text-slate-600' },
                          { label: 'Standard', margin: 1.35, color: 'text-emerald-700 font-bold' },
                          { label: 'Premium', margin: 1.6, color: 'text-amber-700' },
                        ].map(tier => (
                          <button
                            key={tier.label}
                            type="button"
                            onClick={() => {
                              const suggested = Math.round(costEstimate.totalEstimate * tier.margin * 100) / 100
                              setForm(prev => ({ ...prev, flatRate: String(suggested) }))
                            }}
                            className="rounded-lg bg-white border border-emerald-100 p-2 hover:border-emerald-300 transition-colors cursor-pointer"
                          >
                            <span className="text-[10px] text-slate-500 block">{tier.label}</span>
                            <span className={`text-sm ${tier.color}`}>
                              &euro;{(costEstimate.totalEstimate * tier.margin).toFixed(0)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-600 text-center">Click to set as your flat rate — includes {estimateDistance}km fuel + tolls</p>
                    </div>

                    {form.totalCapacityKg && Number(form.totalCapacityKg) > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Suggested minimum price per kg:</span>{' '}
                          &euro;{(costEstimate.totalEstimate / Number(form.totalCapacityKg)).toFixed(2)}/kg
                          <span className="text-[#C6904D] ml-1">(based on {form.totalCapacityKg}kg capacity)</span>
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400">Estimates are approximate and based on average European fuel and toll rates. Actual costs may vary.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary !py-3 sm:!px-8 text-sm disabled:opacity-50 w-full sm:w-auto">
              {loading ? 'Creating...' : (isSpaceNeeded ? 'Post Load' : 'Publish Listing')}
            </button>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#1a1a1a] transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
  )
}
