'use client'

import { useState, useEffect, useCallback } from 'react'

interface Address {
  id: string
  label: string
  type: string
  address: string
  city?: string
  country?: string
  postcode?: string
  contactName?: string
  contactPhone?: string
  notes?: string
  marinaName?: string
  berthNumber?: string
  yachtName?: string
  isDefault: boolean
  usageCount: number
}

interface SavedAddressesProps {
  token: string
  onSelect?: (address: Address) => void
  type?: 'pickup' | 'delivery' | 'all'
  selectable?: boolean
}

export default function SavedAddresses({ token, onSelect, type = 'all', selectable = false }: SavedAddressesProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: '', type: type === 'all' ? 'other' : type, address: '', city: '', country: '', postcode: '',
    contactName: '', contactPhone: '', notes: '', marinaName: '', berthNumber: '', yachtName: '', isDefault: false,
  })

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch(`/api/addresses?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [token, type])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  const saveAddress = async () => {
    if (!form.label || !form.address) return
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ label: '', type: type === 'all' ? 'other' : type, address: '', city: '', country: '', postcode: '',
          contactName: '', contactPhone: '', notes: '', marinaName: '', berthNumber: '', yachtName: '', isDefault: false })
        fetchAddresses()
      }
    } catch { /* ignore */ }
  }

  const deleteAddress = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) return <div className="text-center text-xs text-slate-400 py-4">Loading addresses...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Saved Addresses</h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs font-semibold text-[#C6904D] hover:underline">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#faf9f7] rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Label (e.g. Home, Marina)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="col-span-2 px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="col-span-2 px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Contact name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Contact phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Marina name" value={form.marinaName} onChange={e => setForm({ ...form, marinaName: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
            <input placeholder="Berth number" value={form.berthNumber} onChange={e => setForm({ ...form, berthNumber: e.target.value })} className="px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none" />
          </div>
          <textarea placeholder="Notes (e.g. gate code, access instructions)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded border border-[#e8e4de] text-sm focus:border-[#C6904D] outline-none min-h-[50px] resize-none" />
          <label className="flex items-center gap-2 text-xs text-[#4a4a4a]">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
            Set as default
          </label>
          <button onClick={saveAddress} className="btn-primary w-full text-sm py-2">Save Address</button>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="text-xs text-slate-400 text-center py-6">No saved addresses yet</p>
      ) : (
        <div className="space-y-2">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`p-3 rounded-lg border ${selectable ? 'cursor-pointer hover:border-[#C6904D]' : ''} ${addr.isDefault ? 'border-[#C6904D] bg-[#C6904D]/5' : 'border-[#e8e4de]'} transition-colors`}
              onClick={() => selectable && onSelect?.(addr)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1a1a1a]">{addr.label}</span>
                  {addr.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C6904D]/10 text-[#C6904D] font-semibold">Default</span>}
                </div>
                {!selectable && (
                  <button onClick={() => deleteAddress(addr.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#4a4a4a] mt-1">{addr.address}</p>
              {(addr.city || addr.country) && <p className="text-xs text-slate-400">{[addr.city, addr.country].filter(Boolean).join(', ')}</p>}
              {addr.marinaName && <p className="text-xs text-slate-400">Marina: {addr.marinaName}{addr.berthNumber ? ` — Berth ${addr.berthNumber}` : ''}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
