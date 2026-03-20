'use client'

import { useState } from 'react'
import { packagingTypes, PackagingType } from '@/lib/vehicles'

interface CargoPackagingSelectorProps {
  onSelect: (packaging: PackagingType & { quantity: number }) => void
  selectedId?: string
}

export default function CargoPackagingSelector({ onSelect, selectedId }: CargoPackagingSelectorProps) {
  const [category, setCategory] = useState<'boxes' | 'pallets' | 'other'>('boxes')
  const [quantity, setQuantity] = useState(1)

  const categories = {
    boxes: packagingTypes.filter(p => p.id.startsWith('box_') || p.id === 'multi_boxes'),
    pallets: packagingTypes.filter(p => p.id.startsWith('pallet_') || p.id === 'multi_pallets'),
    other: packagingTypes.filter(p => ['crate', 'drum', 'loose', 'wine_case'].includes(p.id)),
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Packaging Type</label>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 bg-[#f5f3f0] rounded-lg p-1">
        {(['boxes', 'pallets', 'other'] as const).map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`flex-1 py-2 text-xs font-semibold rounded transition-all capitalize ${
              category === cat ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b6b6b]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Packaging options */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {categories[category].map(pkg => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect({ ...pkg, quantity })}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedId === pkg.id
                ? 'border-[#C6904D] bg-[#C6904D]/5'
                : 'border-[#e8e4de] hover:border-[#C6904D]/40'
            }`}
          >
            <span className="text-sm font-semibold text-[#1a1a1a] block">{pkg.label}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{pkg.description}</span>
            {pkg.defaultWeightKg && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                ~{pkg.defaultWeightKg}kg &middot; {pkg.defaultVolumeM3}m³
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quantity for multi-package */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#4a4a4a]">Quantity:</label>
        <div className="flex items-center border border-[#e8e4de] rounded-lg overflow-hidden">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1.5 text-sm hover:bg-[#f5f3f0]">-</button>
          <input type="number" min={1} max={100} value={quantity}
            onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-12 text-center text-sm border-x border-[#e8e4de] py-1.5 outline-none" />
          <button type="button" onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1.5 text-sm hover:bg-[#f5f3f0]">+</button>
        </div>
      </div>
    </div>
  )
}
