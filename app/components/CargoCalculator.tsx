'use client'
import { useState, useCallback } from 'react'

interface CargoItem {
  id: string
  type: 'pallet' | 'box' | 'custom'
  palletSize?: 'euro' | 'uk' | 'custom'
  quantity: number
  lengthCm: number
  widthCm: number
  heightCm: number
  weightKg: number
}

// Standard pallet dimensions (L x W in cm)
const PALLET_SIZES = {
  euro: { length: 120, width: 80, label: 'EUR Pallet (120×80cm)' },
  uk: { length: 120, width: 100, label: 'UK Pallet (120×100cm)' },
  custom: { length: 0, width: 0, label: 'Custom' },
}

let itemIdCounter = 0
function nextId() { return `cargo-${++itemIdCounter}` }

function newItem(type: CargoItem['type']): CargoItem {
  const pallet = type === 'pallet' ? 'euro' : undefined
  return {
    id: nextId(),
    type,
    palletSize: pallet,
    quantity: 1,
    lengthCm: type === 'pallet' ? PALLET_SIZES.euro.length : 0,
    widthCm: type === 'pallet' ? PALLET_SIZES.euro.width : 0,
    heightCm: 0,
    weightKg: 0,
  }
}

interface CargoCalculatorProps {
  onCalculated: (totalWeightKg: number, totalVolumeM3: number) => void
}

export default function CargoCalculator({ onCalculated }: CargoCalculatorProps) {
  const [items, setItems] = useState<CargoItem[]>([newItem('pallet')])
  const [open, setOpen] = useState(false)

  const updateItem = useCallback((id: string, updates: Partial<CargoItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, ...updates }
      // If pallet size changed, auto-fill dimensions
      if (updates.palletSize && updates.palletSize !== 'custom') {
        const dims = PALLET_SIZES[updates.palletSize]
        updated.lengthCm = dims.length
        updated.widthCm = dims.width
      }
      return updated
    }))
  }, [])

  const addItem = useCallback((type: CargoItem['type']) => {
    setItems(prev => [...prev, newItem(type)])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const calculate = useCallback(() => {
    let totalWeightKg = 0
    let totalVolumeM3 = 0

    for (const item of items) {
      const qty = item.quantity || 1
      const vol = (item.lengthCm / 100) * (item.widthCm / 100) * (item.heightCm / 100)
      totalVolumeM3 += vol * qty
      totalWeightKg += item.weightKg * qty
    }

    // Round to sensible precision
    totalWeightKg = Math.round(totalWeightKg * 10) / 10
    totalVolumeM3 = Math.round(totalVolumeM3 * 100) / 100

    onCalculated(totalWeightKg, totalVolumeM3)
    setOpen(false)
  }, [items, onCalculated])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[#FF6A2A] hover:text-[#b07e3a] transition-colors"
      >
        Calculate from pallets/boxes
      </button>
    )
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#1a1a1a]">Cargo Calculator</h4>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-[#9AADB8]">Close</button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="bg-[#162E3D] rounded-lg border border-slate-100 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select
                className="text-xs px-2 py-1 rounded border border-slate-200 bg-[#162E3D] outline-none focus:border-[#FF6A2A]"
                value={item.type}
                onChange={e => updateItem(item.id, { type: e.target.value as CargoItem['type'], palletSize: e.target.value === 'pallet' ? 'euro' : undefined })}
              >
                <option value="pallet">Pallet</option>
                <option value="box">Box</option>
                <option value="custom">Custom</option>
              </select>
              {item.type === 'pallet' && (
                <select
                  className="text-xs px-2 py-1 rounded border border-slate-200 bg-[#162E3D] outline-none focus:border-[#FF6A2A]"
                  value={item.palletSize}
                  onChange={e => updateItem(item.id, { palletSize: e.target.value as CargoItem['palletSize'] })}
                >
                  {Object.entries(PALLET_SIZES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              )}
            </div>
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-400">Remove</button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div>
              <label className="block text-[10px] text-[#6B7C86] mb-0.5">Qty</label>
              <input type="number" min="1" className="w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-[#FF6A2A]" value={item.quantity || ''} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B7C86] mb-0.5">L (cm)</label>
              <input type="number" min="0" className="w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-[#FF6A2A]" value={item.lengthCm || ''} onChange={e => updateItem(item.id, { lengthCm: parseFloat(e.target.value) || 0 })} disabled={item.type === 'pallet' && item.palletSize !== 'custom'} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B7C86] mb-0.5">W (cm)</label>
              <input type="number" min="0" className="w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-[#FF6A2A]" value={item.widthCm || ''} onChange={e => updateItem(item.id, { widthCm: parseFloat(e.target.value) || 0 })} disabled={item.type === 'pallet' && item.palletSize !== 'custom'} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B7C86] mb-0.5">H (cm)</label>
              <input type="number" min="0" className="w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-[#FF6A2A]" value={item.heightCm || ''} onChange={e => updateItem(item.id, { heightCm: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-[10px] text-[#6B7C86] mb-0.5">Wt (kg)</label>
              <input type="number" min="0" step="0.1" className="w-full px-2 py-1 text-xs rounded border border-slate-200 outline-none focus:border-[#FF6A2A]" value={item.weightKg || ''} onChange={e => updateItem(item.id, { weightKg: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {item.heightCm > 0 && (
            <div className="text-[10px] text-slate-400">
              {item.quantity}× = {((item.lengthCm / 100) * (item.widthCm / 100) * (item.heightCm / 100) * (item.quantity || 1)).toFixed(3)} m&sup3;, {(item.weightKg * (item.quantity || 1)).toFixed(1)} kg
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={() => addItem('pallet')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-[#162E3D] transition-colors">+ Pallet</button>
        <button type="button" onClick={() => addItem('box')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-[#162E3D] transition-colors">+ Box</button>
      </div>

      {/* Summary */}
      {items.some(i => i.heightCm > 0) && (
        <div className="bg-[#0f1628] text-white rounded-lg p-3 flex justify-between items-center">
          <div className="text-xs">
            <span className="text-slate-400">Total: </span>
            <span className="font-semibold">
              {(items.reduce((sum, i) => sum + (i.weightKg * (i.quantity || 1)), 0)).toFixed(1)} kg
            </span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="font-semibold">
              {(items.reduce((sum, i) => sum + ((i.lengthCm / 100) * (i.widthCm / 100) * (i.heightCm / 100) * (i.quantity || 1)), 0)).toFixed(2)} m&sup3;
            </span>
          </div>
          <button type="button" onClick={calculate} className="text-xs font-semibold bg-[#FF6A2A] px-4 py-1.5 rounded-lg hover:bg-[#b07e3a] transition-colors">
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
