'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AddressResult {
  display: string
  street?: string
  city?: string
  county?: string
  state?: string
  postcode?: string
  country?: string
  countryCode?: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: AddressResult) => void
  placeholder?: string
  label?: string
  className?: string
}

// Uses Google Places API via /api/places proxy when GOOGLE_PLACES_API_KEY is set
// Falls back to Photon (OpenStreetMap) if Google is unavailable

interface GooglePrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

export default function AddressAutocomplete({
  value, onChange, onSelect, placeholder = 'Start typing an address...', label, className = '',
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<AddressResult[]>([])
  const [predictions, setPredictions] = useState<GooglePrediction[]>([])
  const [useGoogle, setUseGoogle] = useState(true)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchGoogle = useCallback(async (query: string) => {
    const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Google Places failed')
    const data = await res.json()
    if (!data.predictions || data.predictions.length === 0) throw new Error('No results')
    setPredictions(data.predictions)
    setResults([])
    setOpen(true)
  }, [])

  const selectGooglePlace = useCallback(async (prediction: GooglePrediction) => {
    setLoading(true)
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: prediction.placeId }),
      })
      if (res.ok) {
        const data = await res.json()
        const p = data.place
        const address: AddressResult = {
          display: p.address || prediction.description,
          street: p.name || '',
          city: p.city || '',
          county: p.region || '',
          state: p.region || '',
          postcode: p.postcode || '',
          country: p.country || '',
          countryCode: p.countryCode || '',
          lat: p.lat || 0,
          lng: p.lng || 0,
        }
        onChange(address.display)
        onSelect(address)
      } else {
        onChange(prediction.description)
        onSelect({ display: prediction.description, lat: 0, lng: 0 })
      }
    } catch {
      onChange(prediction.description)
      onSelect({ display: prediction.description, lat: 0, lng: 0 })
    }
    setOpen(false)
    setLoading(false)
  }, [onChange, onSelect])

  const searchPhoton = useCallback(async (query: string) => {
    const params = new URLSearchParams({ q: query, limit: '6', lang: 'en', lat: '43.58', lon: '7.12' })
    const res = await fetch(`https://photon.komoot.io/api/?${params}`)
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    const mapped: AddressResult[] = data.features?.map((f: {
      properties: { name?: string; street?: string; housenumber?: string; city?: string; county?: string; state?: string; postcode?: string; country?: string; countrycode?: string }
      geometry: { coordinates: [number, number] }
    }) => {
      const p = f.properties
      const parts = [
        p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street || p.name,
        p.city, p.state || p.county, p.postcode, p.country,
      ].filter(Boolean)
      return {
        display: parts.join(', '),
        street: p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street || p.name || '',
        city: p.city || '', county: p.county || p.state || '', state: p.state || '',
        postcode: p.postcode || '', country: p.country || '', countryCode: p.countrycode || '',
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
      }
    }) || []
    setPredictions([])
    setResults(mapped)
    setOpen(mapped.length > 0)
  }, [])

  const search = useCallback(async (query: string) => {
    if (query.length < 3) { setResults([]); setPredictions([]); setOpen(false); return }
    setLoading(true)
    try {
      if (useGoogle) {
        await searchGoogle(query)
      } else {
        await searchPhoton(query)
      }
    } catch {
      // If Google fails, fall back to Photon
      if (useGoogle) {
        setUseGoogle(false)
        try { await searchPhoton(query) } catch { setResults([]) }
      } else {
        setResults([])
      }
    }
    setLoading(false)
  }, [useGoogle, searchGoogle, searchPhoton])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = (result: AddressResult) => {
    onChange(result.display)
    onSelect(result)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-3 rounded border border-[rgba(255,255,255,0.08)] text-sm text-[#F7F9FB] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <svg className="w-4 h-4 text-[#6B7C86] animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
        </div>
      </div>

      {open && (predictions.length > 0 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-[#162E3D] rounded-lg shadow-lg border border-[rgba(255,255,255,0.08)] overflow-hidden max-h-64 overflow-y-auto">
          {predictions.length > 0 ? predictions.map((pred, i) => (
            <button
              key={pred.placeId || i}
              type="button"
              onClick={() => selectGooglePlace(pred)}
              className="w-full text-left px-4 py-3 hover:bg-[#102535] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
            >
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#FF6A2A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <span className="text-sm text-[#F7F9FB] font-medium block">{pred.mainText}</span>
                  <span className="text-xs text-[#6B7C86]">{pred.secondaryText}</span>
                </div>
              </div>
            </button>
          )) : results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-[#102535] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
            >
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#FF6A2A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <span className="text-sm text-[#F7F9FB] font-medium block">{result.street || result.city}</span>
                  <span className="text-xs text-[#6B7C86]">
                    {[result.city, result.postcode, result.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-[10px] text-[#6B7C86] text-center bg-[#102535]">
            {predictions.length > 0 ? 'Powered by Google' : 'Powered by OpenStreetMap'}
          </div>
        </div>
      )}
    </div>
  )
}
