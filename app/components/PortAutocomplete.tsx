'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { searchPorts, formatPortDisplay, type PortEntry } from '@/lib/ports'

interface PortAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (entry: PortEntry | null) => void
  placeholder?: string
  required?: boolean
  className?: string
  name?: string
}

const typeLabels: Record<string, { label: string; color: string }> = {
  port: { label: 'Port', color: 'bg-blue-100 text-blue-700' },
  marina: { label: 'Marina', color: 'bg-emerald-100 text-emerald-700' },
  shipyard: { label: 'Shipyard', color: 'bg-amber-100 text-amber-700' },
}

export default function PortAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ports, marinas, companies, addresses...',
  required = false,
  className = '',
  name,
}: PortAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<PortEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    const matches = searchPorts(q, 8)
    setResults(matches)
    setIsOpen(matches.length > 0)
    setHighlightIndex(-1)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    onSelect?.(null) // Clear selection when typing freely
    doSearch(val)
  }

  const selectResult = (entry: PortEntry) => {
    const display = formatPortDisplay(entry)
    setQuery(display)
    onChange(display)
    onSelect?.(entry)
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const defaultInputCls =
    'w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all'

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
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
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {results.map((entry, i) => {
            const typeInfo = typeLabels[entry.type] || typeLabels.port
            return (
              <li
                key={`${entry.name}-${entry.city}-${i}`}
                role="option"
                aria-selected={i === highlightIndex}
                onMouseDown={(e) => { e.preventDefault(); selectResult(entry) }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                  i === highlightIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{entry.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {entry.city}, {entry.country}
                    {entry.region && <span className="text-slate-400"> &middot; {entry.region}</span>}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
