'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'
import PortAutocomplete from '../components/PortAutocomplete'

interface PackageItem {
  id: string
  type: string
  quantity: number
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  description: string
}

const PACKAGE_TYPES = [
  { value: 'pallet', label: 'Full Pallet', defaultW: 120, defaultD: 80, defaultH: 150, defaultKg: 300 },
  { value: 'half-pallet', label: 'Half Pallet', defaultW: 80, defaultD: 60, defaultH: 100, defaultKg: 150 },
  { value: 'quarter-pallet', label: 'Quarter Pallet', defaultW: 60, defaultD: 40, defaultH: 80, defaultKg: 75 },
  { value: 'euro-pallet', label: 'Euro Pallet (EUR)', defaultW: 120, defaultD: 80, defaultH: 144, defaultKg: 500 },
  { value: 'box', label: 'Box / Carton', defaultW: 60, defaultD: 40, defaultH: 40, defaultKg: 25 },
  { value: 'crate', label: 'Crate', defaultW: 100, defaultD: 60, defaultH: 60, defaultKg: 80 },
  { value: 'wine-case', label: 'Wine Case (12 btl)', defaultW: 50, defaultD: 34, defaultH: 18, defaultKg: 18 },
  { value: 'drum', label: 'Barrel / Drum', defaultW: 60, defaultD: 60, defaultH: 90, defaultKg: 200 },
  { value: 'loose', label: 'Loose Item', defaultW: 0, defaultD: 0, defaultH: 0, defaultKg: 0 },
  { value: 'oversized', label: 'Oversized / Custom', defaultW: 0, defaultD: 0, defaultH: 0, defaultKg: 0 },
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const CARGO_TYPES = [
  'Provisions & Food', 'Wine & Spirits', 'Marine Equipment', 'Spare Parts',
  'Luxury Goods', 'Crew Gear & Uniforms', 'Interior & Decor', 'Chandlery',
  'Electronics', 'Sails & Canvas', 'Cleaning Supplies', 'Medical Supplies', 'Other'
]

const TRANSPORT_METHODS = [
  { value: 'van', label: 'Van / Small Van' },
  { value: 'large_van', label: 'Large Van / Luton' },
  { value: 'refrigerated', label: 'Refrigerated Vehicle' },
  { value: 'truck', label: 'Truck / HGV' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'any', label: 'Any — best price' },
]

const URGENCY_OPTIONS = [
  { value: 'flexible', label: 'Flexible (cheapest)' },
  { value: 'within_week', label: 'Within a week' },
  { value: 'within_3_days', label: 'Within 3 days' },
  { value: 'next_day', label: 'Next day' },
  { value: 'same_day', label: 'Same day (premium)' },
]

const inputClass = "w-full px-4 py-3 rounded border border-[#e8e4de] bg-white text-[15px] text-[#1a1a1a] placeholder:text-[#9a9a9a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none"
const selectClass = inputClass + " appearance-none"
const labelClass = "block text-sm font-semibold text-[#1a1a1a] mb-2"

export default function GetQuotesPage() {
  const { user, token } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [packages, setPackages] = useState<PackageItem[]>([])

  const addPackage = (type = 'box') => {
    const def = PACKAGE_TYPES.find(t => t.value === type) || PACKAGE_TYPES[4]
    setPackages(prev => [...prev, {
      id: generateId(),
      type: def.value,
      quantity: 1,
      weightKg: def.defaultKg,
      lengthCm: def.defaultD,
      widthCm: def.defaultW,
      heightCm: def.defaultH,
      description: '',
    }])
  }

  const updatePackage = (id: string, field: keyof PackageItem, value: string | number) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p
      if (field === 'type') {
        const def = PACKAGE_TYPES.find(t => t.value === value)
        if (def) return { ...p, type: String(value), weightKg: def.defaultKg, lengthCm: def.defaultD, widthCm: def.defaultW, heightCm: def.defaultH }
      }
      return { ...p, [field]: value }
    }))
  }

  const removePackage = (id: string) => setPackages(prev => prev.filter(p => p.id !== id))

  const totalWeight = packages.reduce((s, p) => s + p.weightKg * p.quantity, 0)
  const totalVolume = packages.reduce((s, p) => s + (p.lengthCm * p.widthCm * p.heightCm * p.quantity) / 1_000_000, 0)

  const [form, setForm] = useState({
    // Cargo
    cargoType: '',
    cargoDescription: '',
    isFragile: false,
    requiresRefrigeration: false,
    isDangerous: false,
    declaredValue: '',
    specialHandling: '',

    // Pickup
    pickupLocation: '',
    pickupPostcode: '',
    pickupCountry: '',
    pickupContact: '',
    pickupPhone: '',
    pickupNotes: '',

    // Delivery
    deliveryLocation: '',
    deliveryPostcode: '',
    deliveryCountry: '',
    deliveryContact: '',
    deliveryPhone: '',
    deliveryNotes: '',
    yachtName: '',
    berthNumber: '',
    marinaName: '',

    // Preferences
    transportMethod: 'any',
    urgency: 'flexible',
    preferredDate: '',
    pricingType: 'quotes', // 'quotes' (bidding) or 'fixed'
    maxBudget: '',
    additionalInfo: '',
  })

  const updateForm = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!token) { setError('Please sign in to request quotes'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          originPort: form.pickupLocation,
          destinationPort: form.deliveryLocation,
          cargoDescription: form.cargoDescription || form.cargoType,
          cargoType: form.cargoType,
          weightKg: totalWeight,
          volumeM3: totalVolume,
          ...(packages.length > 0 ? { packages: JSON.stringify(packages) } : {}),
          preferredDate: form.preferredDate || null,
          specialRequirements: [
            form.specialHandling,
            form.isFragile ? 'Fragile' : '',
            form.requiresRefrigeration ? 'Refrigeration required' : '',
            form.isDangerous ? 'Dangerous goods' : '',
            form.urgency !== 'flexible' ? `Urgency: ${form.urgency}` : '',
            form.transportMethod !== 'any' ? `Transport: ${form.transportMethod}` : '',
            form.yachtName ? `Yacht: ${form.yachtName}` : '',
            form.berthNumber ? `Berth: ${form.berthNumber}` : '',
            form.marinaName ? `Marina: ${form.marinaName}` : '',
            form.additionalInfo,
          ].filter(Boolean).join('. '),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit quote request')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="page-container">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-[#1a1a1a] tracking-wide mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quote Request Submitted</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Carriers on matching routes will receive your request. You&apos;ll get notifications as quotes come in.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary">View Dashboard</Link>
            <button onClick={() => { setSubmitted(false); setStep(1); setForm({ ...form, cargoDescription: '' }) }} className="btn-secondary">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-light text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Get Delivery Quotes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Describe your shipment and receive quotes from carriers on matching routes.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Cargo Details', 'Pickup & Delivery', 'Preferences'].map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i + 1)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
              step === i + 1
                ? 'bg-[#C6904D] text-white'
                : step > i + 1
                  ? 'bg-green-50 text-green-700'
                  : 'bg-[#f5f3f0] text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {step > i + 1 ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded bg-red-50 border border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Cargo Details */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">What are you shipping?</h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Cargo Type</label>
                <select className={selectClass} value={form.cargoType} onChange={(e) => updateForm('cargoType', e.target.value)}>
                  <option value="">Select type...</option>
                  {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass + " min-h-[80px] resize-none"} placeholder="e.g. 6 cases of wine for MY Ocean Dream, Antibes Marina" value={form.cargoDescription} onChange={(e) => updateForm('cargoDescription', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1a1a1a]">Packages & Items</h2>
              <button type="button" onClick={() => addPackage('box')} className="text-sm font-semibold text-[#C6904D] hover:text-[#b07d3f] transition-colors">+ Add Package</button>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-[#e8e4de] rounded-lg">
                <p className="text-sm text-slate-500 mb-4">Add your packages to get accurate quotes</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { type: 'box', label: '+ Box' },
                    { type: 'pallet', label: '+ Pallet' },
                    { type: 'half-pallet', label: '+ Half Pallet' },
                    { type: 'wine-case', label: '+ Wine Case' },
                    { type: 'crate', label: '+ Crate' },
                    { type: 'euro-pallet', label: '+ Euro Pallet' },
                  ].map(btn => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => addPackage(btn.type)}
                      className="px-3 py-2 rounded border border-[#e8e4de] text-sm font-medium text-[#1a1a1a] hover:border-[#C6904D] hover:bg-amber-50 transition-all"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg, idx) => {
                  const typeInfo = PACKAGE_TYPES.find(t => t.value === pkg.type)
                  const showDimensions = typeInfo?.defaultW === 0 || pkg.type === 'loose' || pkg.type === 'oversized'
                  return (
                    <div key={pkg.id} className="p-4 bg-[#faf9f7] rounded-lg border border-[#e8e4de]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Package {idx + 1}</span>
                        <button type="button" onClick={() => removePackage(pkg.id)} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                          <select
                            className={selectClass + " !py-2 !text-sm"}
                            value={pkg.type}
                            onChange={e => updatePackage(pkg.id, 'type', e.target.value)}
                          >
                            {PACKAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                          <input type="number" min="1" className={inputClass + " !py-2 !text-sm"} value={pkg.quantity} onChange={e => updatePackage(pkg.id, 'quantity', parseInt(e.target.value) || 1)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Weight (kg ea.)</label>
                          <input type="number" min="0" step="0.1" className={inputClass + " !py-2 !text-sm"} value={pkg.weightKg} onChange={e => updatePackage(pkg.id, 'weightKg', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
                          <input type="text" className={inputClass + " !py-2 !text-sm"} placeholder="Optional" value={pkg.description} onChange={e => updatePackage(pkg.id, 'description', e.target.value)} />
                        </div>
                      </div>
                      {showDimensions && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Length (cm)</label>
                            <input type="number" min="0" className={inputClass + " !py-2 !text-sm"} value={pkg.lengthCm} onChange={e => updatePackage(pkg.id, 'lengthCm', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Width (cm)</label>
                            <input type="number" min="0" className={inputClass + " !py-2 !text-sm"} value={pkg.widthCm} onChange={e => updatePackage(pkg.id, 'widthCm', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Height (cm)</label>
                            <input type="number" min="0" className={inputClass + " !py-2 !text-sm"} value={pkg.heightCm} onChange={e => updatePackage(pkg.id, 'heightCm', parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Quick-add buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { type: 'box', label: '+ Box' },
                    { type: 'pallet', label: '+ Pallet' },
                    { type: 'half-pallet', label: '+ Half Pallet' },
                    { type: 'quarter-pallet', label: '+ Quarter Pallet' },
                    { type: 'euro-pallet', label: '+ Euro Pallet' },
                    { type: 'wine-case', label: '+ Wine Case' },
                    { type: 'crate', label: '+ Crate' },
                    { type: 'drum', label: '+ Drum' },
                  ].map(btn => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => addPackage(btn.type)}
                      className="px-2.5 py-1.5 rounded border border-[#e8e4de] text-xs font-medium text-slate-600 hover:border-[#C6904D] hover:text-[#C6904D] transition-all"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex gap-6 pt-3 border-t border-[#e8e4de] text-sm">
                  <div><span className="text-slate-500">Total items:</span> <strong className="text-[#1a1a1a]">{packages.reduce((s, p) => s + p.quantity, 0)}</strong></div>
                  <div><span className="text-slate-500">Total weight:</span> <strong className="text-[#1a1a1a]">{totalWeight.toFixed(1)} kg</strong></div>
                  <div><span className="text-slate-500">Total volume:</span> <strong className="text-[#1a1a1a]">{totalVolume.toFixed(2)} m&sup3;</strong></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Special Requirements</h2>
            <div className="space-y-3">
              {[
                { key: 'isFragile', label: 'Fragile — requires careful handling' },
                { key: 'requiresRefrigeration', label: 'Requires refrigeration / temperature control' },
                { key: 'isDangerous', label: 'Contains dangerous / hazardous goods' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(e) => updateForm(key, e.target.checked)}
                    className="w-4 h-4 rounded border-[#e8e4de] text-[#C6904D] focus:ring-[#C6904D]/20" />
                  <span className="text-sm text-[#1a1a1a]">{label}</span>
                </label>
              ))}
              <div className="pt-2">
                <label className={labelClass}>Declared Value (optional)</label>
                <input type="number" min="0" step="0.01" className={inputClass} placeholder="€0.00" value={form.declaredValue} onChange={(e) => updateForm('declaredValue', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Special Handling Notes</label>
                <input type="text" className={inputClass} placeholder="e.g. Keep upright, do not stack" value={form.specialHandling} onChange={(e) => updateForm('specialHandling', e.target.value)} />
              </div>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full">
            Continue — Pickup & Delivery
          </button>
        </div>
      )}

      {/* Step 2: Pickup & Delivery */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Pickup Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Pickup Location / Port</label>
                <PortAutocomplete
                  value={form.pickupLocation}
                  onChange={v => updateForm('pickupLocation', v)}
                  placeholder="City, port, or postcode"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Postcode / ZIP</label>
                  <input type="text" className={inputClass} placeholder="e.g. 06600" value={form.pickupPostcode} onChange={(e) => updateForm('pickupPostcode', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" className={inputClass} placeholder="e.g. France" value={form.pickupCountry} onChange={(e) => updateForm('pickupCountry', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input type="text" className={inputClass} placeholder="Pickup contact" value={form.pickupContact} onChange={(e) => updateForm('pickupContact', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" className={inputClass} placeholder="+33..." value={form.pickupPhone} onChange={(e) => updateForm('pickupPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pickup Notes</label>
                <input type="text" className={inputClass} placeholder="e.g. Ring bell at gate, loading bay access" value={form.pickupNotes} onChange={(e) => updateForm('pickupNotes', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Delivery Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Delivery Location / Port</label>
                <PortAutocomplete
                  value={form.deliveryLocation}
                  onChange={v => updateForm('deliveryLocation', v)}
                  placeholder="Marina, port, or address"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Postcode / ZIP</label>
                  <input type="text" className={inputClass} placeholder="e.g. 98000" value={form.deliveryPostcode} onChange={(e) => updateForm('deliveryPostcode', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" className={inputClass} placeholder="e.g. Monaco" value={form.deliveryCountry} onChange={(e) => updateForm('deliveryCountry', e.target.value)} />
                </div>
              </div>

              <div className="pt-2 border-t border-[#e8e4de]">
                <p className="text-xs font-semibold text-[#C6904D] uppercase tracking-wider mb-3">Yacht / Marina Details</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Yacht Name</label>
                  <input type="text" className={inputClass} placeholder="e.g. MY Ocean Dream" value={form.yachtName} onChange={(e) => updateForm('yachtName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Berth / Dock Number</label>
                  <input type="text" className={inputClass} placeholder="e.g. B-42" value={form.berthNumber} onChange={(e) => updateForm('berthNumber', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Marina Name</label>
                <input type="text" className={inputClass} placeholder="e.g. Port Vauban, Antibes" value={form.marinaName} onChange={(e) => updateForm('marinaName', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Delivery Contact</label>
                  <input type="text" className={inputClass} placeholder="Contact on yacht" value={form.deliveryContact} onChange={(e) => updateForm('deliveryContact', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" className={inputClass} placeholder="+33..." value={form.deliveryPhone} onChange={(e) => updateForm('deliveryPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Delivery Notes</label>
                <input type="text" className={inputClass} placeholder="e.g. Call crew chief on arrival, port gate code: 1234" value={form.deliveryNotes} onChange={(e) => updateForm('deliveryNotes', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue — Preferences</button>
          </div>
        </div>
      )}

      {/* Step 3: Preferences & Submit */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Transport Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Method of Transport</label>
                <select className={selectClass} value={form.transportMethod} onChange={(e) => updateForm('transportMethod', e.target.value)}>
                  {TRANSPORT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Urgency</label>
                <select className={selectClass} value={form.urgency} onChange={(e) => updateForm('urgency', e.target.value)}>
                  {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Preferred Date</label>
                <input type="date" className={inputClass} value={form.preferredDate} onChange={(e) => updateForm('preferredDate', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>How would you like to receive pricing?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => updateForm('pricingType', 'quotes')}
                    className={`p-4 rounded border-2 text-left transition-all ${
                      form.pricingType === 'quotes'
                        ? 'border-[#C6904D] bg-amber-50'
                        : 'border-[#e8e4de] hover:border-slate-300'
                    }`}>
                    <div className="text-sm font-semibold text-[#1a1a1a]">Get Quotes</div>
                    <div className="text-xs text-slate-500 mt-1">Carriers bid — you choose</div>
                  </button>
                  <button type="button"
                    onClick={() => updateForm('pricingType', 'fixed')}
                    className={`p-4 rounded border-2 text-left transition-all ${
                      form.pricingType === 'fixed'
                        ? 'border-[#C6904D] bg-amber-50'
                        : 'border-[#e8e4de] hover:border-slate-300'
                    }`}>
                    <div className="text-sm font-semibold text-[#1a1a1a]">Fixed Price</div>
                    <div className="text-xs text-slate-500 mt-1">Set your budget — instant match</div>
                  </button>
                </div>
              </div>
              {form.pricingType === 'fixed' && (
                <div>
                  <label className={labelClass}>Your Budget (EUR)</label>
                  <input type="number" min="0" step="0.01" className={inputClass} placeholder="€0.00" value={form.maxBudget} onChange={(e) => updateForm('maxBudget', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-5">Additional Information (Optional)</h2>
            <textarea className={inputClass + " min-h-[100px] resize-none"}
              placeholder="Any other details carriers should know..."
              value={form.additionalInfo} onChange={(e) => updateForm('additionalInfo', e.target.value)} />
          </div>

          {/* Summary */}
          <div className="bg-[#faf9f7] rounded-lg border border-[#e8e4de] p-6">
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              {form.cargoType && <div><span className="text-slate-500">Cargo:</span> <span className="font-medium text-[#1a1a1a]">{form.cargoType}</span></div>}
              {totalWeight > 0 && <div><span className="text-slate-500">Weight:</span> <span className="font-medium text-[#1a1a1a]">{totalWeight.toFixed(1)} kg</span></div>}
              {packages.length > 0 && <div><span className="text-slate-500">Packages:</span> <span className="font-medium text-[#1a1a1a]">{packages.reduce((s, p) => s + p.quantity, 0)} items ({packages.length} types)</span></div>}
              {form.pickupLocation && <div><span className="text-slate-500">From:</span> <span className="font-medium text-[#1a1a1a]">{form.pickupLocation}</span></div>}
              {form.deliveryLocation && <div><span className="text-slate-500">To:</span> <span className="font-medium text-[#1a1a1a]">{form.deliveryLocation}</span></div>}
              {form.yachtName && <div><span className="text-slate-500">Yacht:</span> <span className="font-medium text-[#1a1a1a]">{form.yachtName}</span></div>}
              {form.marinaName && <div><span className="text-slate-500">Marina:</span> <span className="font-medium text-[#1a1a1a]">{form.marinaName}</span></div>}
              {form.preferredDate && <div><span className="text-slate-500">Date:</span> <span className="font-medium text-[#1a1a1a]">{new Date(form.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
              <div><span className="text-slate-500">Pricing:</span> <span className="font-medium text-[#1a1a1a]">{form.pricingType === 'quotes' ? 'Open for quotes (bidding)' : `Fixed budget: €${form.maxBudget || '—'}`}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
            {user ? (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                {submitting ? 'Submitting...' : form.pricingType === 'quotes' ? 'Get Quotes' : 'Submit Request'}
              </button>
            ) : (
              <Link href="/login" className="btn-primary flex-1 text-center">
                Sign In to Get Quotes
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
