'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'
import { vehicleTypes, vehicleSpecs } from '@/lib/vehicles'

interface Vehicle {
  id: string
  make: string
  model: string
  year?: number
  vehicleType: string
  registrationPlate?: string
  colour?: string
  maxPayloadKg?: number
  cargoVolumeM3?: number
  cargoLengthCm?: number
  cargoWidthCm?: number
  cargoHeightCm?: number
  hasRefrigeration: boolean
  hasTailLift: boolean
  hasGPS: boolean
  hasRacking: boolean
  insuranceProvider?: string
  insuranceExpiry?: string
  goodsInTransitInsurance: boolean
  goodsInTransitMax?: number
  motExpiry?: string
  verified: boolean
  active: boolean
}

export default function VehiclesPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ make: '', model: '', vehicleType: 'Van', registrationPlate: '', maxPayloadKg: '', cargoVolumeM3: '' })
  const [saving, setSaving] = useState(false)

  // Derive unique makes from vehicleSpecs, filtered by selected type
  const availableMakes = useMemo(() => {
    const specs = addForm.vehicleType
      ? vehicleSpecs.filter(s => s.type === addForm.vehicleType)
      : vehicleSpecs
    return [...new Set(specs.map(s => s.make))].sort()
  }, [addForm.vehicleType])

  // Derive models for selected make (and type)
  const availableModels = useMemo(() => {
    if (!addForm.make) return []
    return vehicleSpecs
      .filter(s => s.make === addForm.make && (!addForm.vehicleType || s.type === addForm.vehicleType))
      .map(s => s.model)
      .sort()
  }, [addForm.make, addForm.vehicleType])

  // Auto-populate specs when model is selected
  const handleModelSelect = useCallback((model: string) => {
    const spec = vehicleSpecs.find(s => s.make === addForm.make && s.model === model)
    if (spec) {
      setAddForm(prev => ({
        ...prev,
        model,
        maxPayloadKg: String(spec.maxPayloadKg),
        cargoVolumeM3: String(spec.cargoVolumeM3),
      }))
    } else {
      setAddForm(prev => ({ ...prev, model }))
    }
  }, [addForm.make])

  const fetchVehicles = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/vehicles', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles || [])
      }
    } catch { setError('Failed to load vehicles') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleAdd = async () => {
    if (!addForm.make || !addForm.model) { setError('Make and model are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...addForm, maxPayloadKg: addForm.maxPayloadKg ? parseFloat(addForm.maxPayloadKg) : undefined, cargoVolumeM3: addForm.cargoVolumeM3 ? parseFloat(addForm.cargoVolumeM3) : undefined }),
      })
      if (res.ok) { setShowAdd(false); setAddForm({ make: '', model: '', vehicleType: 'Van', registrationPlate: '', maxPayloadKg: '', cargoVolumeM3: '' }); setSuccess('Vehicle added'); fetchVehicles() }
      else { const d = await res.json(); setError(d.error) }
    } catch { setError('Failed to add vehicle') }
    finally { setSaving(false) }
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { setEditingId(null); setSuccess('Vehicle updated'); fetchVehicles() }
      else { const d = await res.json(); setError(d.error) }
    } catch { setError('Failed to update vehicle') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { setSuccess('Vehicle deleted'); fetchVehicles() }
      else { const d = await res.json(); setError(d.error) }
    } catch { setError('Failed to delete vehicle') }
  }

  if (authLoading) return <div className="min-h-screen bg-[#102535]" />
  if (!user) return (
    <div className="min-h-screen bg-[#102535] flex items-center justify-center">
      <p className="text-[#6B7C86]">Please <Link href="/login" className="text-[#FF6A2A]">sign in</Link> to manage vehicles</p>
    </div>
  )

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-white/[0.08] text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none'

  return (
    <div id="main-content" className="min-h-screen bg-[#102535] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#F7F9FB]" style={{ fontFamily: 'var(--font-display)' }}>My Vehicles</h1>
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-[#1d1916] text-white rounded-lg text-sm font-semibold hover:bg-[#2C2520] transition-colors">
            {showAdd ? 'Cancel' : '+ Add Vehicle'}
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-200 rounded-lg text-sm text-red-600 flex justify-between"><span>{error}</span><button onClick={() => setError('')} className="text-red-400">&times;</button></div>}
        {success && <div className="mb-4 p-3 bg-[#9ED36A]/10 border border-[#9ED36A]/20 rounded-lg text-sm text-[#9ED36A] flex justify-between"><span>{success}</span><button onClick={() => setSuccess('')} className="text-green-400">&times;</button></div>}

        {showAdd && (
          <div className="bg-[#162E3D] rounded-lg border border-white/[0.08] p-5 mb-6">
            <h2 className="font-semibold text-[#F7F9FB] mb-4">Add Vehicle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <select className={inputClass} value={addForm.vehicleType} onChange={e => setAddForm({...addForm, vehicleType: e.target.value, make: '', model: '', maxPayloadKg: '', cargoVolumeM3: ''})}>
                {vehicleTypes.map(t => <option key={t}>{t}</option>)}
              </select>
              <select className={inputClass} value={addForm.make} onChange={e => setAddForm({...addForm, make: e.target.value, model: '', maxPayloadKg: '', cargoVolumeM3: ''})}>
                <option value="">Select make...</option>
                {availableMakes.map(m => <option key={m}>{m}</option>)}
              </select>
              <select className={inputClass} value={addForm.model} onChange={e => handleModelSelect(e.target.value)} disabled={!addForm.make}>
                <option value="">Select model...</option>
                {availableModels.map(m => <option key={m}>{m}</option>)}
              </select>
              <input className={inputClass} placeholder="Reg plate" value={addForm.registrationPlate} onChange={e => setAddForm({...addForm, registrationPlate: e.target.value})} />
              <input className={inputClass} placeholder="Payload (kg)" type="number" value={addForm.maxPayloadKg} onChange={e => setAddForm({...addForm, maxPayloadKg: e.target.value})} />
              <input className={inputClass} placeholder="Volume (m³)" type="number" step="0.1" value={addForm.cargoVolumeM3} onChange={e => setAddForm({...addForm, cargoVolumeM3: e.target.value})} />
            </div>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-[#1d1916] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Vehicle'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-28 bg-[#162E3D] rounded-lg border border-white/[0.08] animate-pulse" />)}</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16 bg-[#162E3D] rounded-lg border border-white/[0.08]">
            <p className="text-[#6B7C86] mb-4">No vehicles added yet</p>
            <button onClick={() => setShowAdd(true)} className="text-[#FF6A2A] font-medium hover:underline">Add your first vehicle</button>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map(v => (
              <div key={v.id} className="bg-[#162E3D] rounded-lg border border-white/[0.08] p-5">
                {editingId === v.id ? (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      <input className={inputClass} value={editForm.make || ''} onChange={e => setEditForm({...editForm, make: e.target.value})} placeholder="Make" />
                      <input className={inputClass} value={editForm.model || ''} onChange={e => setEditForm({...editForm, model: e.target.value})} placeholder="Model" />
                      <input className={inputClass} value={editForm.registrationPlate || ''} onChange={e => setEditForm({...editForm, registrationPlate: e.target.value})} placeholder="Reg plate" />
                      <input className={inputClass} type="number" value={editForm.maxPayloadKg || ''} onChange={e => setEditForm({...editForm, maxPayloadKg: parseFloat(e.target.value) || undefined})} placeholder="Payload kg" />
                      <input className={inputClass} type="number" step="0.1" value={editForm.cargoVolumeM3 || ''} onChange={e => setEditForm({...editForm, cargoVolumeM3: parseFloat(e.target.value) || undefined})} placeholder="Volume m³" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(v.id)} disabled={saving} className="px-3 py-1.5 bg-[#1d1916] text-white rounded text-xs font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-white/[0.08] rounded text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F7F9FB]">{v.make} {v.model}</span>
                        {v.year && <span className="text-xs text-[#6B7C86]">({v.year})</span>}
                        <span className="px-2 py-0.5 bg-[#102535] rounded text-xs text-[#6B7C86]">{v.vehicleType}</span>
                        {v.verified && <span className="px-2 py-0.5 bg-[#9ED36A]/15 text-[#9ED36A] rounded text-xs">Verified</span>}
                        {!v.active && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">Inactive</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#6B7C86] mt-2">
                        {v.registrationPlate && <span>Reg: {v.registrationPlate}</span>}
                        {v.maxPayloadKg && <span>{v.maxPayloadKg} kg</span>}
                        {v.cargoVolumeM3 && <span>{v.cargoVolumeM3} m&sup3;</span>}
                        {v.cargoLengthCm && <span>{v.cargoLengthCm}×{v.cargoWidthCm}×{v.cargoHeightCm} cm</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {v.hasRefrigeration && <span className="px-2 py-0.5 bg-[#1E6F8F]/15 text-[#268CB5] rounded text-[10px]">Refrigerated</span>}
                        {v.hasTailLift && <span className="px-2 py-0.5 bg-[#1E6F8F]/15 text-[#268CB5] rounded text-[10px]">Tail Lift</span>}
                        {v.hasGPS && <span className="px-2 py-0.5 bg-[#1E6F8F]/15 text-[#268CB5] rounded text-[10px]">GPS</span>}
                        {v.goodsInTransitInsurance && <span className="px-2 py-0.5 bg-[#9ED36A]/10 text-[#9ED36A] rounded text-[10px]">GIT Insured{v.goodsInTransitMax ? ` (${v.goodsInTransitMax})` : ''}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(v.id); setEditForm(v) }} className="px-3 py-1.5 border border-white/[0.08] rounded text-xs font-medium text-[#F7F9FB] hover:bg-[#162E3D]">Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="px-3 py-1.5 border border-red-200 rounded text-xs font-medium text-red-500 hover:bg-red-500/10">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
