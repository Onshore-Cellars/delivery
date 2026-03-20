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

// Uses Photon (OpenStreetMap Nominatim) — free, no API key, great EU+UK coverage
// For production consider Google Places API for better autocomplete quality

export default function AddressAutocomplete({
  value, onChange, onSelect, placeholder = 'Start typing an address...', label, className = '',
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<AddressResult[]>([])
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

  const search = useCallback(async (query: string) => {
    if (query.length < 3) { setResults([]); setOpen(false); return }

    setLoading(true)
    try {
      // Photon API — bias towards EU (France) + UK
      const params = new URLSearchParams({
        q: query,
        limit: '6',
        lang: 'en',
        lat: '43.58',   // Antibes/Cannes area as default bias
        lon: '7.12',
      })

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
          city: p.city || '',
          county: p.county || p.state || '',
          state: p.state || '',
          postcode: p.postcode || '',
          country: p.country || '',
          countryCode: p.countrycode || '',
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }
      }) || []

      setResults(mapped)
      setOpen(mapped.length > 0)
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [])

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
      {label && <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-3 rounded border border-[#e8e4de] text-sm text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <svg className="w-4 h-4 text-slate-400 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-[#e8e4de] overflow-hidden max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-[#faf9f7] transition-colors border-b border-[#f5f3f0] last:border-0"
            >
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#C6904D] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div>
                  <span className="text-sm text-[#1a1a1a] font-medium block">{result.street || result.city}</span>
                  <span className="text-xs text-slate-500">
                    {[result.city, result.postcode, result.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-[10px] text-slate-400 text-center bg-[#faf9f7]">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  )
}
