'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface LineItem {
  description: string
  quantity: number | null
  unitPrice: number | null
  amount: number | null
}

interface BillDraft {
  supplierName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  currency: string
  subtotal: string
  taxAmount: string
  total: string
  category: string
  notes: string
  lineItems: LineItem[]
  fileUrl: string | null
  fileKey: string | null
  extractedRaw: string | null
  confidence?: string
}

interface Bill {
  id: string
  supplierName: string
  invoiceNumber: string | null
  invoiceDate: string | null
  dueDate: string | null
  currency: string
  subtotal: number | null
  taxAmount: number | null
  total: number
  category: string | null
  notes: string | null
  status: string
  fileUrl: string | null
  lineItems: string | null
  createdAt: string
}

const CATEGORIES = ['provisions', 'fuel', 'berthing', 'maintenance', 'transport', 'other']
const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF']

const fmtMoney = (n: number, ccy: string) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: ccy }).format(n)

const inputCls = 'w-full px-3 py-2 rounded border border-black/15 bg-[var(--c-surface)] text-sm text-[var(--c-ink)] focus:outline-none focus:border-[var(--c-accent)]'
const labelCls = 'block text-xs font-medium uppercase tracking-wider text-[var(--c-text-2)] mb-1'

export default function BillsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<BillDraft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchBills = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/bills', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setBills(data.bills || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchBills() }, [fetchBills])

  // ─── Upload & extract ─────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!token) return
    setError(null)
    setExtracting(true)
    setDraft(null)
    setEditingId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/bills/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Extraction failed')
        return
      }
      const ex = data.extracted
      setDraft({
        supplierName: ex.supplierName || '',
        invoiceNumber: ex.invoiceNumber || '',
        invoiceDate: ex.invoiceDate || '',
        dueDate: ex.dueDate || '',
        currency: ex.currency && /^[A-Z]{3}$/.test(ex.currency) ? ex.currency : 'EUR',
        subtotal: ex.subtotal != null ? String(ex.subtotal) : '',
        taxAmount: ex.taxAmount != null ? String(ex.taxAmount) : '',
        total: ex.total != null ? String(ex.total) : '',
        category: ex.category || '',
        notes: ex.notes || '',
        lineItems: Array.isArray(ex.lineItems) ? ex.lineItems : [],
        fileUrl: data.fileUrl || null,
        fileKey: data.fileKey || null,
        extractedRaw: JSON.stringify(ex),
        confidence: ex.confidence,
      })
    } catch {
      setError('Upload failed — please try again.')
    } finally {
      setExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [token])

  // ─── Save (create or update) ──────────────────────────────────────────────

  const saveDraft = useCallback(async () => {
    if (!token || !draft) return
    if (!draft.supplierName.trim()) { setError('Supplier name is required'); return }
    if (!draft.total || !isFinite(Number(draft.total))) { setError('Total must be a number'); return }
    setSaving(true)
    setError(null)
    const payload = {
      supplierName: draft.supplierName.trim(),
      invoiceNumber: draft.invoiceNumber || null,
      invoiceDate: draft.invoiceDate || null,
      dueDate: draft.dueDate || null,
      currency: draft.currency,
      subtotal: draft.subtotal === '' ? null : Number(draft.subtotal),
      taxAmount: draft.taxAmount === '' ? null : Number(draft.taxAmount),
      total: Number(draft.total),
      category: draft.category || null,
      notes: draft.notes || null,
      lineItems: draft.lineItems,
      fileUrl: draft.fileUrl,
      fileKey: draft.fileKey,
      extractedRaw: draft.extractedRaw,
    }
    try {
      const res = await fetch(editingId ? `/api/bills/${editingId}` : '/api/bills', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setDraft(null)
      setEditingId(null)
      fetchBills()
    } catch {
      setError('Save failed — please try again.')
    } finally {
      setSaving(false)
    }
  }, [token, draft, editingId, fetchBills])

  const editBill = useCallback((bill: Bill) => {
    setError(null)
    setEditingId(bill.id)
    setDraft({
      supplierName: bill.supplierName,
      invoiceNumber: bill.invoiceNumber || '',
      invoiceDate: bill.invoiceDate ? bill.invoiceDate.slice(0, 10) : '',
      dueDate: bill.dueDate ? bill.dueDate.slice(0, 10) : '',
      currency: bill.currency,
      subtotal: bill.subtotal != null ? String(bill.subtotal) : '',
      taxAmount: bill.taxAmount != null ? String(bill.taxAmount) : '',
      total: String(bill.total),
      category: bill.category || '',
      notes: bill.notes || '',
      lineItems: bill.lineItems ? JSON.parse(bill.lineItems) : [],
      fileUrl: bill.fileUrl,
      fileKey: null,
      extractedRaw: null,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const deleteBill = useCallback(async (id: string) => {
    if (!token || !confirm('Delete this bill?')) return
    const res = await fetch(`/api/bills/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) fetchBills()
  }, [token, fetchBills])

  const togglePaid = useCallback(async (bill: Bill) => {
    if (!token) return
    const res = await fetch(`/api/bills/${bill.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: bill.status === 'paid' ? 'confirmed' : 'paid' }),
    })
    if (res.ok) fetchBills()
  }, [token, fetchBills])

  const setField = (field: keyof BillDraft, value: string) =>
    setDraft(d => (d ? { ...d, [field]: value } : d))

  const setItem = (idx: number, field: keyof LineItem, value: string) =>
    setDraft(d => {
      if (!d) return d
      const items = [...d.lineItems]
      items[idx] = { ...items[idx], [field]: field === 'description' ? value : (value === '' ? null : Number(value)) }
      return { ...d, lineItems: items }
    })

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading) return <div className="min-h-screen bg-[var(--c-canvas)]" />
  if (!user) return (
    <div className="min-h-screen bg-[var(--c-canvas)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--c-text-2)] mb-4">Please sign in to manage bills.</p>
        <Link href="/login" className="btn-primary">Sign in</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--c-ink)] mb-1">Bills</h1>
        <p className="text-sm text-[var(--c-text-2)] mb-6">
          Upload a supplier bill (PDF or photo) — we&apos;ll read it and pre-fill the details for you to check, correct and save.
        </p>

        {/* Upload zone */}
        {!draft && (
          <div
            className="bg-[var(--c-surface)] rounded-lg border-2 border-dashed border-black/15 p-10 text-center mb-8 cursor-pointer hover:border-[var(--c-accent)] transition-colors"
            onClick={() => !extracting && fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f && !extracting) handleFile(f)
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {extracting ? (
              <div>
                <div className="inline-block w-8 h-8 border-2 border-[var(--c-accent)] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-[var(--c-text-2)]">Reading your bill…</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-[var(--c-text-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="text-sm font-medium text-[var(--c-ink)]">Drop a bill here or click to upload</p>
                <p className="text-xs text-[var(--c-text-2)] mt-1">PDF, JPEG, PNG or WebP — max 10MB</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded bg-[var(--c-error)]/10 text-[var(--c-error)] text-sm">{error}</div>
        )}

        {/* Review / edit form */}
        {draft && (
          <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--c-ink)]">
                {editingId ? 'Edit bill' : 'Check the details'}
              </h2>
              {!editingId && draft.confidence && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  draft.confidence === 'high' ? 'bg-[var(--c-success)]/15 text-[var(--c-success)]'
                  : draft.confidence === 'medium' ? 'bg-[var(--c-accent)]/15 text-[var(--c-accent)]'
                  : 'bg-[var(--c-error)]/10 text-[var(--c-error)]'
                }`}>
                  {draft.confidence} confidence read
                </span>
              )}
            </div>
            {!editingId && (
              <p className="text-xs text-[var(--c-text-2)] mb-4">
                Everything below was read automatically — please correct any misreads before saving.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Supplier *</label>
                <input className={inputCls} value={draft.supplierName} onChange={e => setField('supplierName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Invoice number</label>
                <input className={inputCls} value={draft.invoiceNumber} onChange={e => setField('invoiceNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Invoice date</label>
                <input type="date" className={inputCls} value={draft.invoiceDate} onChange={e => setField('invoiceDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Due date</label>
                <input type="date" className={inputCls} value={draft.dueDate} onChange={e => setField('dueDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={draft.category} onChange={e => setField('category', e.target.value)}>
                  <option value="">—</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select className={inputCls} value={draft.currency} onChange={e => setField('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Subtotal (excl. tax)</label>
                <input type="number" step="0.01" className={inputCls} value={draft.subtotal} onChange={e => setField('subtotal', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Tax / VAT</label>
                <input type="number" step="0.01" className={inputCls} value={draft.taxAmount} onChange={e => setField('taxAmount', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Total *</label>
                <input type="number" step="0.01" className={inputCls} value={draft.total} onChange={e => setField('total', e.target.value)} />
              </div>
            </div>

            {/* Line items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' !mb-0'}>Line items</label>
                <button
                  type="button"
                  className="text-xs text-[var(--c-accent)] hover:underline"
                  onClick={() => setDraft(d => d ? { ...d, lineItems: [...d.lineItems, { description: '', quantity: null, unitPrice: null, amount: null }] } : d)}
                >
                  + Add line
                </button>
              </div>
              {draft.lineItems.length === 0 ? (
                <p className="text-xs text-[var(--c-text-2)]">No line items detected.</p>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_28px] gap-2 text-[10px] uppercase tracking-wider text-[var(--c-text-2)]">
                    <span>Description</span><span>Qty</span><span>Unit price</span><span>Amount</span><span />
                  </div>
                  {draft.lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_70px_90px_90px_28px] gap-2">
                      <input className={inputCls + ' col-span-2 sm:col-span-1'} placeholder="Description" value={li.description} onChange={e => setItem(i, 'description', e.target.value)} />
                      <input type="number" step="any" className={inputCls} placeholder="Qty" value={li.quantity ?? ''} onChange={e => setItem(i, 'quantity', e.target.value)} />
                      <input type="number" step="0.01" className={inputCls} placeholder="Unit" value={li.unitPrice ?? ''} onChange={e => setItem(i, 'unitPrice', e.target.value)} />
                      <input type="number" step="0.01" className={inputCls} placeholder="Amount" value={li.amount ?? ''} onChange={e => setItem(i, 'amount', e.target.value)} />
                      <button
                        type="button"
                        aria-label="Remove line"
                        className="text-[var(--c-text-2)] hover:text-[var(--c-error)] text-lg leading-none"
                        onClick={() => setDraft(d => d ? { ...d, lineItems: d.lineItems.filter((_, j) => j !== i) } : d)}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls} rows={2} value={draft.notes} onChange={e => setField('notes', e.target.value)} />
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-primary" disabled={saving} onClick={saveDraft}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Confirm & save bill'}
              </button>
              <button
                className="px-4 py-2 text-sm text-[var(--c-text-2)] hover:text-[var(--c-ink)]"
                onClick={() => { setDraft(null); setEditingId(null); setError(null) }}
              >
                Cancel
              </button>
              {draft.fileUrl && (
                <a href={draft.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-[var(--c-accent)] hover:underline">
                  View original file
                </a>
              )}
            </div>
          </div>
        )}

        {/* Saved bills */}
        <h2 className="text-lg font-semibold text-[var(--c-ink)] mb-3">Saved bills</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--c-surface)] rounded-lg border border-black/10 animate-pulse" />)}</div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 bg-[var(--c-surface)] rounded-lg border border-black/10">
            <p className="text-sm text-[var(--c-text-2)]">No bills yet — upload one above to get started.</p>
          </div>
        ) : (
          <div className="bg-[var(--c-surface)] rounded-lg border border-black/10 divide-y divide-black/5">
            {bills.map(bill => (
              <div key={bill.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--c-ink)]">{bill.supplierName}</span>
                    {bill.invoiceNumber && <span className="text-xs text-[var(--c-text-2)]">#{bill.invoiceNumber}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                      bill.status === 'paid' ? 'bg-[var(--c-success)]/15 text-[var(--c-success)]' : 'bg-[var(--c-info)]/15 text-[var(--c-info)]'
                    }`}>{bill.status}</span>
                  </div>
                  <div className="text-xs text-[var(--c-text-2)] mt-0.5">
                    {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString() : 'No date'}
                    {bill.category ? ` · ${bill.category}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[var(--c-ink)]">{fmtMoney(bill.total, bill.currency)}</div>
                  {bill.taxAmount != null && <div className="text-[10px] text-[var(--c-text-2)]">incl. {fmtMoney(bill.taxAmount, bill.currency)} tax</div>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {bill.fileUrl && (
                    <a href={bill.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--c-accent)] hover:underline">File</a>
                  )}
                  <button className="text-[var(--c-info)] hover:underline" onClick={() => togglePaid(bill)}>
                    {bill.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                  </button>
                  <button className="text-[var(--c-accent)] hover:underline" onClick={() => editBill(bill)}>Edit</button>
                  <button className="text-[var(--c-error)] hover:underline" onClick={() => deleteBill(bill.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
