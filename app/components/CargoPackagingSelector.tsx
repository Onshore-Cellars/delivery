'use client'

import { useState, useEffect, useCallback } from 'react'
import { packagingTypes, PackagingType } from '@/lib/vehicles'

export interface PackagingSelection extends PackagingType {
  quantity: number
  cubicMeters: number
  totalCubicMeters: number
}

interface CargoPackagingSelectorProps {
  onSelect: (packaging: PackagingSelection) => void
  selectedId?: string
}

function calcCubicMeters(l?: number, w?: number, h?: number): number {
  if (!l || !w || !h) return 0
  return Math.round(((l / 100) * (w / 100) * (h / 100)) * 10000) / 10000
}

export default function CargoPackagingSelector({ onSelect, selectedId }: CargoPackagingSelectorProps) {
  const [category, setCategory] = useState<'boxes' | 'pallets' | 'other'>('boxes')
  const [quantity, setQuantity] = useState(1)
  const [selected, setSelected] = useState<PackagingType | null>(null)
  const [lengthCm, setLengthCm] = useState<number | ''>('')
  const [widthCm, setWidthCm] = useState<number | ''>('')
  const [heightCm, setHeightCm] = useState<number | ''>('')

  const categories = {
    boxes: packagingTypes.filter(p => p.id.startsWith('box_') || p.id === 'multi_boxes'),
    pallets: packagingTypes.filter(p => p.id.startsWith('pallet_') || p.id === 'multi_pallets'),
    other: packagingTypes.filter(p => ['crate', 'drum', 'envelope', 'tube', 'bag', 'ibc', 'loose', 'custom'].includes(p.id)),
  }

  const isPallet = selected?.id.startsWith('pallet_') ?? false
  const isCustomOrLoose = selected?.id === 'box_custom' || selected?.id === 'loose' || selected?.id === 'multi_boxes' || selected?.id === 'multi_pallets'
  // For pallets, length & width are fixed standard sizes — only height is editable
  const lockLength = isPallet && !isCustomOrLoose
  const lockWidth = isPallet && !isCustomOrLoose

  const unitCbm = calcCubicMeters(
    typeof lengthCm === 'number' ? lengthCm : 0,
    typeof widthCm === 'number' ? widthCm : 0,
    typeof heightCm === 'number' ? heightCm : 0
  )
  const totalCbm = Math.round(unitCbm * quantity * 10000) / 10000

  const emitSelection = useCallback(() => {
    if (!selected) return
    onSelect({
      ...selected,
      lengthCm: typeof lengthCm === 'number' ? lengthCm : undefined,
      widthCm: typeof widthCm === 'number' ? widthCm : undefined,
      heightCm: typeof heightCm === 'number' ? heightCm : undefined,
      quantity,
      cubicMeters: unitCbm,
      totalCubicMeters: totalCbm,
    })
  }, [selected, lengthCm, widthCm, heightCm, quantity, unitCbm, totalCbm, onSelect])

  // Emit whenever dimensions/quantity change
  useEffect(() => {
    emitSelection()
  }, [emitSelection])

  function handleSelect(pkg: PackagingType) {
    setSelected(pkg)
    // Auto-fill dimensions from the packaging type defaults
    setLengthCm(pkg.lengthCm ?? '')
    setWidthCm(pkg.widthCm ?? '')
    setHeightCm(pkg.heightCm ?? '')
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
            onClick={() => handleSelect(pkg)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selected?.id === pkg.id
                ? 'border-[#C6904D] bg-[#C6904D]/5'
                : 'border-[#e8e4de] hover:border-[#C6904D]/40'
            }`}
          >
            <span className="text-sm font-semibold text-[#1a1a1a] block">{pkg.label}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{pkg.description}</span>
            {pkg.lengthCm && pkg.widthCm && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                {pkg.lengthCm} × {pkg.widthCm} × {pkg.heightCm} cm
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dimensions input — shown after selecting a packaging type */}
      {selected && (
        <div className="bg-[#f9f7f4] rounded-lg p-3 mb-3 border border-[#e8e4de]">
          <p className="text-xs font-semibold text-[#4a4a4a] uppercase tracking-wider mb-2">
            Dimensions (cm)
            {isPallet && !isCustomOrLoose && (
              <span className="font-normal normal-case tracking-normal text-slate-400 ml-1">
                — standard footprint, enter stack height
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Length</label>
              <input
                type="number"
                min={1}
                max={2400}
                value={lengthCm}
                disabled={lockLength}
                onChange={e => setLengthCm(e.target.value ? Math.max(1, Number(e.target.value)) : '')}
                placeholder="cm"
                className={`w-full px-2 py-1.5 text-sm border rounded-md outline-none transition-colors
                  ${lockLength ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'border-[#e8e4de] focus:border-[#C6904D]'}`}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Width</label>
              <input
                type="number"
                min={1}
                max={2400}
                value={widthCm}
                disabled={lockWidth}
                onChange={e => setWidthCm(e.target.value ? Math.max(1, Number(e.target.value)) : '')}
                placeholder="cm"
                className={`w-full px-2 py-1.5 text-sm border rounded-md outline-none transition-colors
                  ${lockWidth ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'border-[#e8e4de] focus:border-[#C6904D]'}`}
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Height</label>
              <input
                type="number"
                min={1}
                max={2400}
                value={heightCm}
                onChange={e => setHeightCm(e.target.value ? Math.max(1, Number(e.target.value)) : '')}
                placeholder="cm"
                className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-md outline-none focus:border-[#C6904D] transition-colors"
              />
            </div>
          </div>

          {/* Cubic meters display */}
          {unitCbm > 0 && (
            <div className="mt-3 flex items-center justify-between bg-white rounded-md px-3 py-2 border border-[#e8e4de]">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Per unit</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">{unitCbm} m³</span>
                </div>
                {quantity > 1 && (
                  <div className="pl-3 border-l border-[#e8e4de]">
                    <span className="text-[11px] text-slate-400 block">Total ({quantity} units)</span>
                    <span className="text-sm font-semibold text-[#C6904D]">{totalCbm} m³</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Dimensions</span>
                <span className="text-xs text-slate-500">
                  {lengthCm} × {widthCm} × {heightCm} cm
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
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
