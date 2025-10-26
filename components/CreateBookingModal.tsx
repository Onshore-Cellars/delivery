'use client'

import { useState } from 'react'

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  listing: {
    id: string
    vehicleType: string
    originAddress: string
    destinationAddress: string
    departureDate: string
    availableWeight: number
    availableVolume: number
    pricePerKg?: number
    pricePerCubicMeter?: number
    fixedPrice?: number
    carrier: {
      name: string
      company?: string
    }
  }
}

export default function CreateBookingModal({ isOpen, onClose, onSuccess, listing }: CreateBookingModalProps) {
  const [formData, setFormData] = useState({
    weightBooked: '',
    volumeBooked: '',
    itemDescription: '',
    pickupAddress: '',
    deliveryAddress: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const calculatePrice = () => {
    const weight = parseFloat(formData.weightBooked) || 0
    const volume = parseFloat(formData.volumeBooked) || 0

    if (listing.fixedPrice) {
      return listing.fixedPrice
    }

    let total = 0
    if (listing.pricePerKg && weight > 0) {
      total += listing.pricePerKg * weight
    }
    if (listing.pricePerCubicMeter && volume > 0) {
      total += listing.pricePerCubicMeter * volume
    }
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const weight = parseFloat(formData.weightBooked)
      const volume = parseFloat(formData.volumeBooked)

      if (weight > listing.availableWeight) {
        throw new Error(`Weight exceeds available capacity (${listing.availableWeight} kg)`)
      }

      if (volume > listing.availableVolume) {
        throw new Error(`Volume exceeds available capacity (${listing.availableVolume} m³)`)
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Reset form
      setFormData({
        weightBooked: '',
        volumeBooked: '',
        itemDescription: '',
        pickupAddress: '',
        deliveryAddress: '',
      })

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!isOpen) return null

  const estimatedPrice = calculatePrice()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-700 to-green-600">
          <h2 className="text-2xl font-bold text-white">Book Van Space</h2>
          <p className="text-sm text-green-100 mt-1">
            {listing.originAddress} → {listing.destinationAddress}
          </p>
          <p className="text-xs text-green-200 mt-1">
            Carrier: {listing.carrier.name}
            {listing.carrier.company && ` (${listing.carrier.company})`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Available Capacity</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Weight:</span>{' '}
                <span className="font-semibold text-blue-900">{listing.availableWeight} kg</span>
              </div>
              <div>
                <span className="text-blue-700">Volume:</span>{' '}
                <span className="font-semibold text-blue-900">{listing.availableVolume} m³</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="weightBooked" className="block text-sm font-medium text-gray-700">
                Weight Needed (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                name="weightBooked"
                id="weightBooked"
                required
                max={listing.availableWeight}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="100"
                value={formData.weightBooked}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="volumeBooked" className="block text-sm font-medium text-gray-700">
                Volume Needed (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                name="volumeBooked"
                id="volumeBooked"
                required
                max={listing.availableVolume}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="1"
                value={formData.volumeBooked}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">
              Item Description *
            </label>
            <textarea
              name="itemDescription"
              id="itemDescription"
              required
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe the items you need to ship..."
              value={formData.itemDescription}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
              Pickup Address (Optional)
            </label>
            <input
              type="text"
              name="pickupAddress"
              id="pickupAddress"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Where should the carrier pick up your items?"
              value={formData.pickupAddress}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">
              Delivery Address (Optional)
            </label>
            <input
              type="text"
              name="deliveryAddress"
              id="deliveryAddress"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Where should the carrier deliver your items?"
              value={formData.deliveryAddress}
              onChange={handleChange}
            />
          </div>

          {estimatedPrice > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-1">Estimated Price</h3>
              <p className="text-2xl font-bold text-green-900">€{estimatedPrice.toFixed(2)}</p>
              {!listing.fixedPrice && (
                <p className="text-xs text-green-700 mt-1">
                  {listing.pricePerKg && formData.weightBooked && (
                    <span>
                      {formData.weightBooked} kg × €{listing.pricePerKg}/kg
                      {listing.pricePerCubicMeter && formData.volumeBooked && ' + '}
                    </span>
                  )}
                  {listing.pricePerCubicMeter && formData.volumeBooked && (
                    <span>
                      {formData.volumeBooked} m³ × €{listing.pricePerCubicMeter}/m³
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
