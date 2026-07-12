'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

/**
 * Lightweight live-position map (OpenStreetMap tiles via Leaflet).
 * Client-only — import with next/dynamic { ssr: false }.
 */
export default function LiveMap({ lat, lng }: { lat: number; lng: number }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!elRef.current) return
    if (!mapRef.current) {
      mapRef.current = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lng], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current)
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#A8813C;border:3px solid #0C5C54;box-shadow:0 0 0 5px rgba(12,92,84,0.22)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current)
    } else {
      markerRef.current?.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], mapRef.current.getZoom())
    }
  }, [lat, lng])

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null }, [])

  return <div ref={elRef} className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-[var(--c-border)]" style={{ zIndex: 0 }} />
}
