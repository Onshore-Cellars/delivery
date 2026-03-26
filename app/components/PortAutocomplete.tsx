'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { searchPorts, formatPortDisplay, type PortEntry } from '@/lib/ports'

export interface AddressData {
  name: string
  address?: string
  city: string
  country: string
  region: string
  postcode?: string
  lat?: number
  lng?: number
  type: 'port' | 'marina' | 'shipyard' | 'address'
}

interface PortAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (data: AddressData | null) => void
  placeholder?: string
  required?: boolean
  className?: string
  name?: string
  id?: string
}

interface GooglePrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  types: string[]
}

interface CombinedResult {
  source: 'local' | 'google'
  port?: PortEntry
  google?: GooglePrediction
  display: string
  sub: string
  tag: string
  tagColor: string
}

const typeLabels: Record<string, { label: string; color: string }> = {
  port: { label: 'Port', color: 'bg-indigo-100 text-indigo-700' },
  marina: { label: 'Marina', color: 'bg-emerald-100 text-emerald-700' },
  shipyard: { label: 'Shipyard', color: 'bg-[#FF6A2A]/15 text-[#FF6A2A]' },
  address: { label: 'Address', color: 'bg-[#102535] text-[#9AADB8]' },
}

export default function PortAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ports, marinas, addresses...',
  required = false,
  className = '',
  name,
  id,
}: PortAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<CombinedResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [googleLoading, setGoogleLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const googleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  // Search local ports immediately, Google Places with debounce
  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    // Local port results — instant
    const localMatches = searchPorts(q, 6)
    const localResults: CombinedResult[] = localMatches.map(p => {
      const info = typeLabels[p.type] || typeLabels.port
      return {
        source: 'local' as const,
        port: p,
        display: p.name,
        sub: `${p.city}, ${p.country}${p.postcode ? ` ${p.postcode}` : ''}${p.region ? ` · ${p.region}` : ''}`,
        tag: info.label,
        tagColor: info.color,
      }
    })

    setResults(localResults)
    setIsOpen(localResults.length > 0)
    setHighlightIndex(-1)

    // Google Places search — debounced 400ms
    if (googleTimerRef.current) clearTimeout(googleTimerRef.current)
    googleTimerRef.current = setTimeout(async () => {
      if (q.length < 3) return
      setGoogleLoading(true)
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          const googleResults: CombinedResult[] = (data.predictions || [])
            .slice(0, 4)
            .map((p: GooglePrediction) => ({
              source: 'google' as const,
              google: p,
              display: p.mainText,
              sub: p.secondaryText,
              tag: 'Address',
              tagColor: typeLabels.address.color,
            }))

          // Merge: local first, then Google (deduped)
          setResults(prev => {
            const localNames = new Set(prev.filter(r => r.source === 'local').map(r => r.display.toLowerCase()))
            const filtered = googleResults.filter(g => !localNames.has(g.display.toLowerCase()))
            const combined = [...prev.filter(r => r.source === 'local'), ...filtered]
            setIsOpen(combined.length > 0)
            return combined
          })
        }
      } catch { /* Google not available, local results still shown */ }
      setGoogleLoading(false)
    }, 400)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    onSelect?.(null)
    doSearch(val)
  }

  const selectResult = async (result: CombinedResult) => {
    if (result.source === 'local' && result.port) {
      const p = result.port
      const display = formatPortDisplay(p)
      setQuery(display)
      onChange(display)
      onSelect?.({
        name: p.name,
        address: p.address,
        city: p.city,
        country: p.country,
        region: p.region,
        postcode: p.postcode,
        lat: p.lat,
        lng: p.lng,
        type: p.type === 'address' ? 'address' : p.type,
      })
    } else if (result.source === 'google' && result.google) {
      // Fetch full place details from Google
      setQuery(result.google.mainText)
      onChange(result.google.description)

      try {
        const res = await fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId: result.google.placeId }),
        })
        if (res.ok) {
          const data = await res.json()
          const place = data.place
          onSelect?.({
            name: place.name || result.google.mainText,
            address: place.address,
            city: place.city,
            country: place.country,
            region: place.region,
            postcode: place.postcode,
            lat: place.lat,
            lng: place.lng,
            type: 'address',
          })
        }
      } catch {
        // Fallback — just pass the basic info
        onSelect?.({
          name: result.google.mainText,
          city: result.google.secondaryText.split(',')[0]?.trim() || '',
          country: result.google.secondaryText.split(',').pop()?.trim() || '',
          region: '',
          type: 'address',
        })
      }
    }

    setIsOpen(false)
    setResults([])
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => (prev <= 0 ? results.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      selectResult(results[highlightIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cleanup timer
  useEffect(() => {
    return () => { if (googleTimerRef.current) clearTimeout(googleTimerRef.current) }
  }, [])

  const defaultInputCls =
    'w-full px-4 py-2.5 rounded-lg border border-white/[0.08] bg-[#162E3D] text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none transition-all placeholder:text-[#6B7C86]'

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (query.length >= 2) doSearch(query) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className || defaultInputCls}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#162E3D] shadow-lg py-1"
        >
          {results.map((result, i) => (
            <li
              key={`${result.source}-${result.display}-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              onMouseDown={(e) => { e.preventDefault(); selectResult(result) }}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`px-4 py-2.5 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                i === highlightIndex ? 'bg-[#FF6A2A]/10' : 'hover:bg-[#162E3D]'
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#F7F9FB] truncate">{result.display}</div>
                <div className="text-xs text-[#6B7C86] truncate">{result.sub}</div>
              </div>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${result.tagColor}`}>
                {result.tag}
              </span>
            </li>
          ))}
          {googleLoading && (
            <li className="px-4 py-2 text-xs text-[#6B7C86] flex items-center gap-2">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Searching addresses...
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
