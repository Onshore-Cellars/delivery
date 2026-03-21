'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'
import PortAutocomplete from '../../components/PortAutocomplete'
import { vehicleSpecs, vehicleTypes, getVehicleMakes, getModelsForMake, type VehicleSpec } from '@/lib/vehicles'

export default function CreateListingPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedSpec, setSelectedSpec] = useState<VehicleSpec | null>(null)
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
    destinationPort: '',
    destinationRegion: '',
    destinationCountry: '',
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
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
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

  if (!user || (!user.canCarry && user.role !== 'ADMIN')) {
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
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">List Your Van Space</h1>
          <p className="text-sm text-slate-500 mt-1.5">Share spare capacity on your next delivery run.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Vehicle Selection */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Vehicle Selection</h2>
            <p className="text-xs text-slate-400 mb-4">Select your vehicle to auto-fill capacity specs, or enter manually below.</p>
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

          {/* Route Details */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Route Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Listing Title *</label>
                <input
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
                <label className={labelCls}>Description</label>
                <textarea
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
                  <label className={labelCls}>Origin (Port, Address or Company) *</label>
                  <PortAutocomplete
                    value={form.originPort}
                    onChange={v => setForm(prev => ({ ...prev, originPort: v }))}
                    onSelect={entry => {
                      if (entry) {
                        setForm(prev => ({
                          ...prev,
                          originPort: `${entry.name}, ${entry.city}`,
                          originRegion: entry.region || prev.originRegion,
                          originCountry: entry.country || prev.originCountry,
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
                    placeholder="Auto-filled from port, or type manually"
                    value={form.originRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Destination (Port, Address or Company) *</label>
                  <PortAutocomplete
                    value={form.destinationPort}
                    onChange={v => setForm(prev => ({ ...prev, destinationPort: v }))}
                    onSelect={entry => {
                      if (entry) {
                        setForm(prev => ({
                          ...prev,
                          destinationPort: `${entry.name}, ${entry.city}`,
                          destinationRegion: entry.region || prev.destinationRegion,
                          destinationCountry: entry.country || prev.destinationCountry,
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
                    placeholder="Auto-filled from port, or type manually"
                    value={form.destinationRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Departure Date *</label>
                  <input
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
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Vehicle & Capacity</h2>
            {selectedSpec && <p className="text-xs text-emerald-500 font-medium mb-4">Auto-filled from {selectedSpec.make} {selectedSpec.model} specs. You can override any value.</p>}
            {!selectedSpec && <p className="text-xs text-slate-400 mb-4">Enter capacity manually, or select a vehicle above to auto-fill.</p>}
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Max Payload (kg) *</label>
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
                  <label className={labelCls}>Cargo Volume (m&sup3;) *</label>
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
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Price per kg</label>
                  <input
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
                  <label className={labelCls}>Price per m&sup3;</label>
                  <input
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
                  <label className={labelCls}>Or Flat Rate</label>
                  <input
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary !py-3 sm:!px-8 text-sm disabled:opacity-50 w-full sm:w-auto">
              {loading ? 'Creating...' : 'Publish Listing'}
            </button>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-[#1a1a1a] transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
  )
}
