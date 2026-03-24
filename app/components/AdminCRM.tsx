'use client'

import { useState, useEffect, useCallback } from 'react'

interface CrmContact {
  id: string
  name: string
  category: string
  country: string | null
  location: string | null
  website: string | null
  email: string | null
  email2: string | null
  phone: string | null
  phone2: string | null
  instagram: string | null
  notes: string | null
  priority: string
  source: string
  tags: string | null
  opted_out: boolean
  lastEmailed: string | null
  createdAt: string
}

interface CrmCampaign {
  id: string
  name: string
  subject: string
  status: string
  sentCount: number
  failedCount: number
  sentAt: string | null
  createdAt: string
  _count: { recipients: number }
}

interface FilterOption {
  value: string
  count: number
}

type CrmView = 'contacts' | 'campaigns' | 'compose'

// WhatsApp link helper
function getWhatsAppUrl(phone: string, message?: string): string {
  const clean = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
  const base = `https://wa.me/${clean}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export default function AdminCRM({ token }: { token: string }) {
  const [view, setView] = useState<CrmView>('contacts')
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [withEmail, setWithEmail] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editContact, setEditContact] = useState<CrmContact | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Campaign compose state
  const [campaignName, setCampaignName] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignHtml, setCampaignHtml] = useState('')
  const [campaignCategory, setCampaignCategory] = useState('')
  const [campaignPriority, setCampaignPriority] = useState('')

  // Quick email state
  const [emailModal, setEmailModal] = useState<CrmContact | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Contact Fetching ─────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (priorityFilter) params.set('priority', priorityFilter)

      const res = await fetch(`/api/admin/crm?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setContacts(data.contacts)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.pages)
      setCategories(data.filters.categories)
      setTotalContacts(data.stats.total)
      setWithEmail(data.stats.withEmail)
    } catch {
      showToast('Failed to load contacts', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, categoryFilter, priorityFilter])

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crm/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setCampaigns(data.campaigns)
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    if (view === 'campaigns') fetchCampaigns()
  }, [view, fetchCampaigns])

  // ─── Contact CRUD ─────────────────────────────────────────────────────────

  const saveContact = async (data: Record<string, unknown>, isNew: boolean) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/crm', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      showToast(isNew ? 'Contact created' : 'Contact updated')
      setEditContact(null)
      setShowAddForm(false)
      fetchContacts()
    } catch {
      showToast('Failed to save contact', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteContacts = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} contact(s)?`)) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/crm', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast(`Deleted ${ids.length} contact(s)`)
      setSelected(new Set())
      fetchContacts()
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const bulkUpdatePriority = async (priority: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: Array.from(selected), updates: { priority } }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast(`Updated ${selected.size} contacts`)
      setSelected(new Set())
      fetchContacts()
    } catch {
      showToast('Failed to update', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // ─── Campaign ─────────────────────────────────────────────────────────────

  const sendQuickEmail = async () => {
    if (!emailModal?.email || !emailSubject || !emailBody) {
      showToast('Fill in subject and body', 'error')
      return
    }
    setEmailSending(true)
    try {
      const res = await fetch('/api/admin/crm/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: emailModal.email,
          subject: emailSubject,
          body: emailBody,
          contactName: emailModal.name,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      showToast(data.message || 'Email sent')
      setEmailModal(null)
      setEmailSubject('')
      setEmailBody('')
    } catch {
      showToast('Failed to send email', 'error')
    } finally {
      setEmailSending(false)
    }
  }

  const exportContactsCSV = () => {
    if (contacts.length === 0) return
    const headers = ['Name', 'Category', 'Email', 'Email 2', 'Phone', 'Phone 2', 'Country', 'Location', 'Website', 'Instagram', 'Priority', 'Tags', 'Notes']
    const rows = contacts.map(c => [
      c.name, c.category, c.email || '', c.email2 || '', c.phone || '', c.phone2 || '',
      c.country || '', c.location || '', c.website || '', c.instagram || '',
      c.priority, c.tags || '', c.notes?.replace(/\n/g, ' ') || '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${contacts.length} contacts`)
  }

  // ─── Campaign send ──────────────────────────────────────────────────────

  const sendCampaign = async (asDraft: boolean) => {
    if (!campaignName || !campaignSubject || !campaignHtml) {
      showToast('Fill in name, subject and body', 'error')
      return
    }
    setActionLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (campaignCategory) filters.category = campaignCategory
      if (campaignPriority) filters.priority = campaignPriority

      const res = await fetch('/api/admin/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: campaignName,
          subject: campaignSubject,
          htmlBody: campaignHtml,
          filters,
          send: !asDraft,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      showToast(asDraft ? 'Campaign saved as draft' : `Sending to ${data.recipientCount} contacts`)
      setCampaignName('')
      setCampaignSubject('')
      setCampaignHtml('')
      setCampaignCategory('')
      setCampaignPriority('')
      setView('campaigns')
      fetchCampaigns()
    } catch {
      showToast('Failed to create campaign', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // ─── Toggle Selection ─────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set())
    else setSelected(new Set(contacts.map(c => c.id)))
  }

  // ─── Search Debounce ──────────────────────────────────────────────────────

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ─── Render ───────────────────────────────────────────────────────────────

  const priorityBadge = (p: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      low: 'bg-slate-50 text-slate-500 border-slate-200',
    }
    return colors[p] || colors.medium
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-50 text-slate-600 border-slate-200',
      sending: 'bg-blue-50 text-blue-700 border-blue-200',
      sent: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[s] || colors.draft
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[#1a1a1a]">{totalContacts.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Contacts</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[#1a1a1a]">{withEmail.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">With Email</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[#1a1a1a]">{categories.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Categories</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[#1a1a1a]">{campaigns.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Campaigns</div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2">
        {(['contacts', 'campaigns', 'compose'] as CrmView[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v
                ? 'bg-[#1d1d1f] text-white'
                : 'text-slate-500 hover:text-[#1d1d1f] hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {v === 'contacts' ? 'Contacts' : v === 'campaigns' ? 'Campaigns' : 'Compose Email'}
          </button>
        ))}
      </div>

      {/* ═══════════════════ CONTACTS VIEW ═══════════════════ */}
      {view === 'contacts' && (
        <div className="bg-white rounded-2xl border border-[#e8e4de] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.value} ({c.count})</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-lg bg-[#C6904D] text-white text-sm font-medium hover:bg-[#b07e3f]"
              >
                + Add Contact
              </button>
              <button
                onClick={exportContactsCSV}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                title="Export CSV"
              >
                ↓ CSV
              </button>
            </div>

            {/* Bulk Actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
                <button onClick={() => bulkUpdatePriority('high')} className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200">Set High</button>
                <button onClick={() => bulkUpdatePriority('medium')} className="px-3 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200">Set Medium</button>
                <button onClick={() => bulkUpdatePriority('low')} className="px-3 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Set Low</button>
                <button onClick={() => deleteContacts(Array.from(selected))} className="px-3 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 ml-auto">Delete</button>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No contacts found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0} onChange={toggleAll} className="rounded border-slate-300" />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Country</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-slate-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a1a1a]">{c.name}</div>
                        {c.website && <div className="text-xs text-slate-400 truncate max-w-[200px]">{c.website}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">{c.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.country || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityBadge(c.priority)}`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {c.phone && (
                            <a
                              href={getWhatsAppUrl(c.phone, `Hi ${c.name}, `)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded text-xs font-medium text-green-600 hover:bg-green-50"
                              title="WhatsApp"
                            >
                              <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                          )}
                          {c.email && (
                            <button
                              onClick={() => { setEmailModal(c); setEmailSubject(''); setEmailBody('') }}
                              className="px-2 py-1 rounded text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                              title="Send Email"
                            >
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                            </button>
                          )}
                          <button onClick={() => setEditContact(c)} className="px-2 py-1 rounded text-xs font-medium text-blue-600 hover:bg-blue-50">Edit</button>
                          <button onClick={() => deleteContacts([c.id])} className="px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">{total.toLocaleString()} contacts</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 text-xs text-slate-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ CAMPAIGNS VIEW ═══════════════════ */}
      {view === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-[#e8e4de] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Email Campaigns</h3>
            <button onClick={() => setView('compose')} className="px-4 py-2 rounded-lg bg-[#C6904D] text-white text-sm font-medium hover:bg-[#b07e3f]">
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No campaigns yet. Create one to start emailing your contacts.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {campaigns.map(c => (
                <div key={c.id} className="px-4 py-3 hover:bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1a1a1a] text-sm">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.subject} &middot; {c._count.recipients} recipients
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.sentCount > 0 && (
                      <span className="text-xs text-slate-500">{c.sentCount} sent{c.failedCount > 0 ? `, ${c.failedCount} failed` : ''}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(c.status)}`}>{c.status}</span>
                    <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ COMPOSE VIEW ═══════════════════ */}
      {view === 'compose' && (
        <div className="bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 space-y-5">
          <h3 className="text-lg font-bold text-[#1a1a1a]">Compose Campaign</h3>
          <p className="text-xs text-slate-400 -mt-3">
            Use <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> to personalise with the contact&apos;s name.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Campaign Name</label>
              <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. New Route Announcement" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Subject Line</label>
              <input type="text" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)}
                placeholder="e.g. New Mediterranean Delivery Routes" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Category (optional)</label>
              <select value={campaignCategory} onChange={e => setCampaignCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D]">
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.value} ({c.count})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Priority (optional)</label>
              <select value={campaignPriority} onChange={e => setCampaignPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D]">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email Body (HTML)</label>
            <textarea
              value={campaignHtml}
              onChange={e => setCampaignHtml(e.target.value)}
              rows={12}
              placeholder={`<h2>Hello {{name}},</h2>\n<p>We're excited to announce new delivery routes across the Mediterranean...</p>`}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 font-mono resize-y"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setView('campaigns')} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={() => sendCampaign(true)} disabled={actionLoading} className="px-5 py-2.5 rounded-xl border border-[#C6904D] text-[#C6904D] text-sm font-medium hover:bg-[#C6904D]/5 disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => sendCampaign(false)} disabled={actionLoading} className="px-5 py-2.5 rounded-xl bg-[#C6904D] text-white text-sm font-medium hover:bg-[#b07e3f] disabled:opacity-50">
              {actionLoading ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ QUICK EMAIL MODAL ═══════════════════ */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEmailModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#1a1a1a]">Send Email</h3>
              <p className="text-xs text-slate-400 mt-1">To: {emailModal.name} &lt;{emailModal.email}&gt;</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="e.g. Following up on our conversation"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={8}
                  placeholder={`Hi ${emailModal.name},\n\n`}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 resize-y"
                />
              </div>
              {emailModal.phone && (
                <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Also reachable on WhatsApp:
                  <a href={getWhatsAppUrl(emailModal.phone, `Hi ${emailModal.name}, `)} target="_blank" rel="noopener noreferrer" className="font-medium underline">{emailModal.phone}</a>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEmailModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={sendQuickEmail}
                disabled={emailSending || !emailSubject || !emailBody}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C6904D] text-white text-sm font-medium hover:bg-[#b07e3f] disabled:opacity-50"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ ADD / EDIT MODAL ═══════════════════ */}
      {(showAddForm || editContact) && (
        <ContactForm
          contact={editContact}
          categories={categories}
          onSave={(data) => saveContact(data, !editContact)}
          onClose={() => { setEditContact(null); setShowAddForm(false) }}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

// ─── Contact Form Modal ─────────────────────────────────────────────────────

function ContactForm({
  contact,
  categories,
  onSave,
  onClose,
  loading,
}: {
  contact: CrmContact | null
  categories: FilterOption[]
  onSave: (data: Record<string, unknown>) => void
  onClose: () => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    name: contact?.name || '',
    category: contact?.category || '',
    email: contact?.email || '',
    email2: contact?.email2 || '',
    phone: contact?.phone || '',
    phone2: contact?.phone2 || '',
    country: contact?.country || '',
    location: contact?.location || '',
    website: contact?.website || '',
    instagram: contact?.instagram || '',
    notes: contact?.notes || '',
    priority: contact?.priority || 'medium',
    tags: contact?.tags || '',
  })

  const handleSubmit = () => {
    if (!form.name || !form.category) return
    const data: Record<string, unknown> = { ...form }
    if (contact) data.id = contact.id
    onSave(data)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-[#1a1a1a]">{contact ? 'Edit Contact' : 'Add Contact'}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category *</label>
              <input type="text" list="cat-list" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
              <datalist id="cat-list">
                {categories.map(c => <option key={c.value} value={c.value} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email 2</label>
              <input type="email" value={form.email2} onChange={e => setForm(f => ({ ...f, email2: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone 2</label>
              <input type="text" value={form.phone2} onChange={e => setForm(f => ({ ...f, phone2: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
              <input type="text" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Instagram</label>
              <input type="text" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="comma-separated tags" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.name || !form.category}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50">
            {loading ? 'Saving...' : contact ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
