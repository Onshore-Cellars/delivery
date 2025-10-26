'use client'

import { useState } from 'react'

interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const [formData, setFormData] = useState({
    vehicleType: '',
    licensePlate: '',
    originAddress: '',
    destinationAddress: '',
    departureDate: '',
    arrivalDate: '',
    totalWeight: '',
    totalVolume: '',
    availableWeight: '',
    availableVolume: '',
    pricePerKg: '',
    pricePerCubicMeter: '',
    fixedPrice: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pricingType, setPricingType] = useState<'perUnit' | 'fixed'>('perUnit')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const payload = {
        ...formData,
        pricePerKg: pricingType === 'perUnit' && formData.pricePerKg ? formData.pricePerKg : null,
        pricePerCubicMeter: pricingType === 'perUnit' && formData.pricePerCubicMeter ? formData.pricePerCubicMeter : null,
        fixedPrice: pricingType === 'fixed' && formData.fixedPrice ? formData.fixedPrice : null,
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      // Reset form
      setFormData({
        vehicleType: '',
        licensePlate: '',
        originAddress: '',
        destinationAddress: '',
        departureDate: '',
        arrivalDate: '',
        totalWeight: '',
        totalVolume: '',
        availableWeight: '',
        availableVolume: '',
        pricePerKg: '',
        pricePerCubicMeter: '',
        fixedPrice: '',
      })

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Van Listing</h2>
          <p className="text-sm text-gray-600 mt-1">List your available van space for other users to book</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                Vehicle Type *
              </label>
              <input
                type="text"
                name="vehicleType"
                id="vehicleType"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Sprinter Van, Box Truck"
                value={formData.vehicleType}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
                License Plate
              </label>
              <input
                type="text"
                name="licensePlate"
                id="licensePlate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ABC-123"
                value={formData.licensePlate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="originAddress" className="block text-sm font-medium text-gray-700">
                Origin *
              </label>
              <input
                type="text"
                name="originAddress"
                id="originAddress"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Monaco Port"
                value={formData.originAddress}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700">
                Destination *
              </label>
              <input
                type="text"
                name="destinationAddress"
                id="destinationAddress"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Cannes Marina"
                value={formData.destinationAddress}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                Departure Date *
              </label>
              <input
                type="datetime-local"
                name="departureDate"
                id="departureDate"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.departureDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700">
                Arrival Date (Optional)
              </label>
              <input
                type="datetime-local"
                name="arrivalDate"
                id="arrivalDate"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.arrivalDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalWeight" className="block text-sm font-medium text-gray-700">
                Total Capacity (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                name="totalWeight"
                id="totalWeight"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="1000"
                value={formData.totalWeight}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="totalVolume" className="block text-sm font-medium text-gray-700">
                Total Volume (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                name="totalVolume"
                id="totalVolume"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="10"
                value={formData.totalVolume}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="availableWeight" className="block text-sm font-medium text-gray-700">
                Available Weight (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                name="availableWeight"
                id="availableWeight"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="400"
                value={formData.availableWeight}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="availableVolume" className="block text-sm font-medium text-gray-700">
                Available Volume (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                name="availableVolume"
                id="availableVolume"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="4"
                value={formData.availableVolume}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pricing *
            </label>
            
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pricingType"
                  value="perUnit"
                  checked={pricingType === 'perUnit'}
                  onChange={(e) => setPricingType(e.target.value as 'perUnit' | 'fixed')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Per Unit (kg/m³)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="pricingType"
                  value="fixed"
                  checked={pricingType === 'fixed'}
                  onChange={(e) => setPricingType(e.target.value as 'perUnit' | 'fixed')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Fixed Price</span>
              </label>
            </div>

            {pricingType === 'perUnit' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700">
                    Price per kg (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerKg"
                    id="pricePerKg"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="2.50"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="pricePerCubicMeter" className="block text-sm font-medium text-gray-700">
                    Price per m³ (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerCubicMeter"
                    id="pricePerCubicMeter"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="50.00"
                    value={formData.pricePerCubicMeter}
                    onChange={handleChange}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="fixedPrice" className="block text-sm font-medium text-gray-700">
                  Fixed Price (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="fixedPrice"
                  id="fixedPrice"
                  required={pricingType === 'fixed'}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="500.00"
                  value={formData.fixedPrice}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
