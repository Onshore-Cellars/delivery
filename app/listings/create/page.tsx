'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../components/AuthProvider'

export default function CreateListingPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    vehicleType: 'Van',
    vehicleName: '',
    originPort: '',
    originRegion: '',
    destinationPort: '',
    destinationRegion: '',
    departureDate: '',
    estimatedArrival: '',
    totalCapacityKg: '',
    totalCapacityM3: '',
    pricePerKg: '',
    pricePerM3: '',
    flatRate: '',
    currency: 'EUR',
    biddingEnabled: false,
    minBidPrice: '',
  })

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

  if (!user || (user.role !== 'CARRIER' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-6">Only carriers can create listings.</p>
          <Link href="/dashboard" className="btn-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy-700 transition-colors">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mt-4">List Available Space</h1>
          <p className="text-slate-500 mt-1">Create a new route listing to offer your van space.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Route Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Route Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Listing Title *</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                  placeholder="e.g. Antibes to Monaco - Weekly Run"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none resize-none"
                  placeholder="Describe your route, vehicle condition, any restrictions..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Origin Port *</label>
                  <input
                    name="originPort"
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Port Vauban, Antibes"
                    value={form.originPort}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Origin Region</label>
                  <input
                    name="originRegion"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. French Riviera"
                    value={form.originRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Destination Port *</label>
                  <input
                    name="destinationPort"
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Port Hercules, Monaco"
                    value={form.destinationPort}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Destination Region</label>
                  <input
                    name="destinationRegion"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Monaco"
                    value={form.destinationRegion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Departure Date *</label>
                  <input
                    name="departureDate"
                    type="datetime-local"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    value={form.departureDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Est. Arrival</label>
                  <input
                    name="estimatedArrival"
                    type="datetime-local"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    value={form.estimatedArrival}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Capacity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Vehicle & Capacity</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none bg-white"
                    value={form.vehicleType}
                    onChange={handleChange}
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Refrigerated">Refrigerated Van</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Sprinter">Sprinter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Vehicle Name</label>
                  <input
                    name="vehicleName"
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. Mercedes Sprinter 316"
                    value={form.vehicleName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Total Weight Capacity (kg) *</label>
                  <input
                    name="totalCapacityKg"
                    type="number"
                    required
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. 1200"
                    value={form.totalCapacityKg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Total Volume Capacity (m&sup3;) *</label>
                  <input
                    name="totalCapacityM3"
                    type="number"
                    required
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. 8.5"
                    value={form.totalCapacityM3}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Price per kg</label>
                  <input
                    name="pricePerKg"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. 2.50"
                    value={form.pricePerKg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Price per m&sup3;</label>
                  <input
                    name="pricePerM3"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. 50.00"
                    value={form.pricePerM3}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1.5">Or Flat Rate</label>
                  <input
                    name="flatRate"
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                    placeholder="e.g. 500.00"
                    value={form.flatRate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1.5">Currency</label>
                <select
                  name="currency"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none bg-white"
                  value={form.currency}
                  onChange={handleChange}
                >
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Bidding */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-navy-900">Enable Bidding</label>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-700"></div>
                  </label>
                </div>
                {form.biddingEnabled && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Minimum Bid Price</label>
                    <input
                      name="minBidPrice"
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-navy-900 focus:border-navy-400 focus:ring-2 focus:ring-navy-100 outline-none"
                      placeholder="Optional minimum bid amount"
                      value={form.minBidPrice}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-gold !py-3 !px-8 text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Publish Listing'}
            </button>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy-700 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
