'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DOMPurify from 'dompurify'

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

type CrmView = 'contacts' | 'campaigns' | 'compose' | 'social' | 'queue' | 'ai' | 'inbox'

// WhatsApp link helper
function getWhatsAppUrl(phone: string, message?: string): string {
  const clean = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
  const base = `https://wa.me/${clean}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: AiAction[]
}

interface AiAction {
  type: string
  label: string
  data: Record<string, unknown>
}

interface SocialPost {
  id: string
  platform: string
  type: string
  content: string
  mediaUrl: string | null
  hashtags: string | null
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  externalUrl: string | null
  impressions: number
  likes: number
  comments: number
  shares: number
  clicks: number
  error: string | null
  createdAt: string
}

interface AiQueueAction {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  payload: string
  result: string | null
  aiModel: string | null
  confidence: number | null
  createdBy: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  executedAt: string | null
  error: string | null
  createdAt: string
}

interface CrmEmailItem {
  id: string
  messageId: string
  folder: string
  from: string
  fromName: string | null
  to: string
  cc: string | null
  subject: string
  textBody: string | null
  htmlBody: string | null
  snippet: string | null
  date: string
  isRead: boolean
  isStarred: boolean
  isArchived: boolean
  hasAttachments: boolean
  attachments: string | null
  inReplyTo: string | null
  contactId: string | null
  contact: { id: string; name: string; category: string; priority: string } | null
  createdAt: string
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

  // Social posts state
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialStats, setSocialStats] = useState<{ total: number; engagement: { impressions: number; likes: number; comments: number; shares: number } } | null>(null)
  const [socialPlatformFilter, setSocialPlatformFilter] = useState('')
  const [socialStatusFilter, setSocialStatusFilter] = useState('')

  // AI action queue state
  const [aiActions, setAiActions] = useState<AiQueueAction[]>([])
  const [aiQueueLoading, setAiQueueLoading] = useState(false)
  const [aiQueueStats, setAiQueueStats] = useState<Record<string, number>>({})
  const [aiQueueStatusFilter, setAiQueueStatusFilter] = useState('pending')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [editingPayload, setEditingPayload] = useState<string | null>(null)
  const [editPayloadText, setEditPayloadText] = useState('')

  // AI chat state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiChatLoading, setAiChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Inbox state
  const [inboxEmails, setInboxEmails] = useState<CrmEmailItem[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [inboxSyncing, setInboxSyncing] = useState(false)
  const [inboxStats, setInboxStats] = useState<{ unread: number; starred: number; total: number }>({ unread: 0, starred: 0, total: 0 })
  const [inboxPage, setInboxPage] = useState(1)
  const [inboxTotalPages, setInboxTotalPages] = useState(1)
  const [inboxSearch, setInboxSearch] = useState('')
  const [inboxSearchInput, setInboxSearchInput] = useState('')
  const [inboxFolder, setInboxFolder] = useState('INBOX')
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'starred'>('all')
  const [selectedEmail, setSelectedEmail] = useState<CrmEmailItem | null>(null)
  const [showComposeEmail, setShowComposeEmail] = useState(false)
  const [replyTo, setReplyTo] = useState<CrmEmailItem | null>(null)
  const [composeEmailTo, setComposeEmailTo] = useState('')
  const [composeEmailSubject, setComposeEmailSubject] = useState('')
  const [composeEmailBody, setComposeEmailBody] = useState('')
  const [composeEmailSending, setComposeEmailSending] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Auto-scroll AI chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, aiChatLoading])

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
    fetchCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    if (view === 'campaigns') fetchCampaigns()
  }, [view, fetchCampaigns])

  // ─── Social Posts Fetching ────────────────────────────────────────────────

  const fetchSocialPosts = useCallback(async () => {
    setSocialLoading(true)
    try {
      const params = new URLSearchParams()
      if (socialPlatformFilter) params.set('platform', socialPlatformFilter)
      if (socialStatusFilter) params.set('status', socialStatusFilter)

      const res = await fetch(`/api/admin/crm/social?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSocialPosts(data.posts)
      setSocialStats(data.stats)
    } catch {
      showToast('Failed to load social posts', 'error')
    } finally {
      setSocialLoading(false)
    }
  }, [token, socialPlatformFilter, socialStatusFilter])

  useEffect(() => {
    if (view === 'social') fetchSocialPosts()
  }, [view, fetchSocialPosts])

  // ─── AI Queue Fetching ────────────────────────────────────────────────────

  const fetchAiActions = useCallback(async () => {
    setAiQueueLoading(true)
    try {
      const params = new URLSearchParams({ status: aiQueueStatusFilter })
      const res = await fetch(`/api/admin/ai-actions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAiActions(data.actions)
      setAiQueueStats(data.stats)
    } catch {
      showToast('Failed to load AI actions', 'error')
    } finally {
      setAiQueueLoading(false)
    }
  }, [token, aiQueueStatusFilter])

  useEffect(() => {
    if (view === 'queue') fetchAiActions()
  }, [view, fetchAiActions])

  // Fetch pending count on mount for the badge
  const fetchAiQueuePendingCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-actions?status=pending&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setAiQueueStats(data.stats)
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    fetchAiQueuePendingCount()
  }, [fetchAiQueuePendingCount])

  // ─── Inbox Fetching ───────────────────────────────────────────────────────

  const fetchInboxEmails = useCallback(async () => {
    setInboxLoading(true)
    try {
      const params = new URLSearchParams({ folder: inboxFolder, page: String(inboxPage), limit: '30' })
      if (inboxSearch) params.set('search', inboxSearch)
      if (inboxFilter === 'unread') params.set('unread', 'true')
      if (inboxFilter === 'starred') params.set('starred', 'true')

      const res = await fetch(`/api/admin/crm/emails?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setInboxEmails(data.emails)
      setInboxStats(data.stats)
      setInboxTotalPages(data.pagination.pages)
    } catch {
      showToast('Failed to load emails', 'error')
    } finally {
      setInboxLoading(false)
    }
  }, [token, inboxFolder, inboxPage, inboxSearch, inboxFilter])

  useEffect(() => {
    if (view === 'inbox') fetchInboxEmails()
  }, [view, fetchInboxEmails])

  // Fetch inbox unread count on mount for badge
  const fetchInboxUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crm/emails?folder=INBOX&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setInboxStats(data.stats)
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    fetchInboxUnreadCount()
  }, [fetchInboxUnreadCount])

  // Inbox search debounce
  useEffect(() => {
    const timer = setTimeout(() => { setInboxSearch(inboxSearchInput); setInboxPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [inboxSearchInput])

  const syncInbox = async () => {
    setInboxSyncing(true)
    try {
      const res = await fetch('/api/admin/crm/emails/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ folder: inboxFolder, limit: 100 }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Sync failed')
      }
      const data = await res.json()
      showToast(`Synced ${data.result.synced} new email(s)`)
      fetchInboxEmails()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sync failed', 'error')
    } finally {
      setInboxSyncing(false)
    }
  }

  const updateEmailFlags = async (ids: string[], updates: Record<string, boolean>) => {
    try {
      const res = await fetch('/api/admin/crm/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids, updates }),
      })
      if (!res.ok) throw new Error('Failed')
      fetchInboxEmails()
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  const sendComposeEmail = async () => {
    if (!composeEmailTo || !composeEmailSubject || !composeEmailBody) {
      showToast('Fill in to, subject and body', 'error')
      return
    }
    setComposeEmailSending(true)
    try {
      const res = await fetch('/api/admin/crm/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: composeEmailTo,
          subject: composeEmailSubject,
          textBody: composeEmailBody,
          replyToMessageId: replyTo?.messageId || null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast('Email sent')
      setShowComposeEmail(false)
      setReplyTo(null)
      setComposeEmailTo('')
      setComposeEmailSubject('')
      setComposeEmailBody('')
      fetchInboxEmails()
    } catch {
      showToast('Failed to send email', 'error')
    } finally {
      setComposeEmailSending(false)
    }
  }

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

  const exportContactsCSV = async () => {
    try {
      showToast('Exporting all contacts...')
      // Fetch ALL contacts (not just current page)
      const params = new URLSearchParams({ export: 'all' })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (priorityFilter) params.set('priority', priorityFilter)

      const res = await fetch(`/api/admin/crm?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const allContacts: CrmContact[] = data.contacts

      if (allContacts.length === 0) {
        showToast('No contacts to export', 'error')
        return
      }

      const headers = ['Name', 'Category', 'Email', 'Email 2', 'Phone', 'Phone 2', 'Country', 'Location', 'Website', 'Instagram', 'Priority', 'Tags', 'Notes']
      const rows = allContacts.map(c => [
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
      showToast(`Exported ${allContacts.length} contacts`)
    } catch {
      showToast('Failed to export contacts', 'error')
    }
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

  // ─── AI Queue Actions ─────────────────────────────────────────────────────

  const handleAiAction = async (id: string, reviewAction: 'approve' | 'reject') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/ai-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: reviewAction }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast(reviewAction === 'approve' ? 'Action approved and executed' : 'Action rejected')
      fetchAiActions()
    } catch {
      showToast(`Failed to ${reviewAction} action`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAiEditSave = async (id: string) => {
    try {
      const parsed = JSON.parse(editPayloadText)
      const res = await fetch('/api/admin/ai-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'edit', editedPayload: parsed }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast('Action updated')
      setEditingPayload(null)
      fetchAiActions()
    } catch {
      showToast('Invalid JSON or update failed', 'error')
    }
  }

  const generateAiContent = async (generateType: string, params?: Record<string, unknown>) => {
    setAiGenerating(true)
    try {
      const res = await fetch('/api/admin/ai-actions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ generateType, params }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      showToast(`Generated ${data.count || 1} action(s) — review in AI Queue`)
      setAiQueueStatusFilter('pending')
      // Refresh queue stats for badge count
      fetchAiQueuePendingCount()
      if (view === 'queue') fetchAiActions()
    } catch {
      showToast('AI generation failed', 'error')
    } finally {
      setAiGenerating(false)
    }
  }

  // ─── AI Chat ──────────────────────────────────────────────────────────────

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiChatLoading) return
    const userMsg = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setAiChatLoading(true)
    try {
      const res = await fetch('/api/admin/crm/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMsg,
          selectedContactIds: Array.from(selected),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        actions: data.actions,
      }])
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setAiChatLoading(false)
    }
  }

  const executeAiChatAction = async (action: AiAction) => {
    // Take AI chat action and put it in the queue for approval
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/ai-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: action.type,
          title: action.label,
          description: `From AI assistant chat`,
          payload: action.data,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      showToast('Added to action queue for review')
    } catch {
      showToast('Failed to queue action', 'error')
    } finally {
      setActionLoading(false)
    }
  }

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
      high: 'bg-[#B23A2E]/10 text-[var(--c-error)] border-[#B23A2E]/30',
      medium: 'bg-[var(--c-accent)]/10 text-[var(--c-accent)] border-[var(--c-accent)]/20',
      low: 'bg-[var(--c-surface)] text-[var(--c-text-3)] border-black/10',
    }
    return colors[p] || colors.medium
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-[var(--c-surface)] text-[var(--c-text-2)] border-black/10',
      sending: 'bg-[var(--c-brand)]/15 text-[var(--c-info)] border-[var(--c-brand)]/30',
      sent: 'bg-[var(--c-success)]/10 text-[var(--c-success)] border-[#256B4A]/40/30',
      failed: 'bg-[#B23A2E]/10 text-[var(--c-error)] border-[#B23A2E]/30',
    }
    return colors[s] || colors.draft
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-[var(--c-success)] text-white' : 'bg-[#B23A2E] text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[var(--c-ink)]">{totalContacts.toLocaleString()}</div>
          <div className="text-xs text-[var(--c-text-2)] mt-0.5">Total Contacts</div>
        </div>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[var(--c-ink)]">{withEmail.toLocaleString()}</div>
          <div className="text-xs text-[var(--c-text-2)] mt-0.5">With Email</div>
        </div>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[var(--c-ink)]">{categories.length}</div>
          <div className="text-xs text-[var(--c-text-2)] mt-0.5">Categories</div>
        </div>
        <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[140px]">
          <div className="text-2xl font-bold text-[var(--c-ink)]">{campaigns.length}</div>
          <div className="text-xs text-[var(--c-text-2)] mt-0.5">Campaigns</div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'contacts', label: 'Contacts' },
          { key: 'campaigns', label: 'Campaigns' },
          { key: 'compose', label: 'Compose' },
          { key: 'social', label: 'Social' },
          { key: 'queue', label: `AI Queue${(aiQueueStats.pending || 0) > 0 ? ` (${aiQueueStats.pending})` : ''}` },
          { key: 'inbox', label: `Inbox${inboxStats.unread > 0 ? ` (${inboxStats.unread})` : ''}` },
          { key: 'ai', label: 'AI Chat' },
        ] as { key: CrmView; label: string }[]).map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.key
                ? 'bg-[#1d1d1f] text-white'
                : 'text-[var(--c-text-3)] hover:text-[var(--c-ink)] hover:bg-[var(--c-surface)] border border-black/10'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ CONTACTS VIEW ═══════════════════ */}
      {view === 'contacts' && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#D3D8D1] space-y-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.value} ({c.count})</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)]"
              >
                + Add Contact
              </button>
              <button
                onClick={exportContactsCSV}
                className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
                title="Export CSV"
              >
                ↓ CSV
              </button>
            </div>

            {/* Bulk Actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 bg-[var(--c-brand)]/15 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-[var(--c-info)]">{selected.size} selected</span>
                <button onClick={() => bulkUpdatePriority('high')} className="px-3 py-1 rounded text-xs font-medium bg-[#B23A2E]/10 text-[var(--c-error)] hover:bg-[#B23A2E]">Set High</button>
                <button onClick={() => bulkUpdatePriority('medium')} className="px-3 py-1 rounded text-xs font-medium bg-[var(--c-accent)]/15 text-[var(--c-accent)] hover:bg-[var(--c-accent)]/20">Set Medium</button>
                <button onClick={() => bulkUpdatePriority('low')} className="px-3 py-1 rounded text-xs font-medium bg-[var(--c-canvas-2)] text-[var(--c-text-2)] hover:bg-[var(--c-surface)]">Set Low</button>
                <button onClick={() => deleteContacts(Array.from(selected))} className="px-3 py-1 rounded text-xs font-medium bg-[#B23A2E] text-white hover:bg-[#B23A2E] ml-auto">Delete</button>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-[var(--c-text-2)] text-sm">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-[var(--c-text-2)] text-sm">No contacts found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D3D8D1] bg-[var(--c-surface)]/50">
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0} onChange={toggleAll} className="rounded border-black/15" />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Country</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--c-text-3)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} className="border-b border-black/10 hover:bg-[var(--c-surface)]/50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-black/15" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--c-ink)]">{c.name}</div>
                        {c.website && <div className="text-xs text-[var(--c-text-2)] truncate max-w-[200px]">{c.website}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--c-brand)]/15 text-[var(--c-info)] border border-[var(--c-brand)]/30">{c.category}</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--c-text-2)] text-xs">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-[var(--c-text-2)] text-xs">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-[var(--c-text-2)] text-xs">{c.country || '—'}</td>
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
                              className="px-2 py-1 rounded text-xs font-medium text-[var(--c-success)] hover:bg-[var(--c-success)]/10"
                              title="WhatsApp"
                            >
                              <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                          )}
                          {c.email && (
                            <button
                              onClick={() => { setEmailModal(c); setEmailSubject(''); setEmailBody('') }}
                              className="px-2 py-1 rounded text-xs font-medium text-[var(--c-info)] hover:bg-[#1F5E86]/10"
                              title="Send Email"
                            >
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                            </button>
                          )}
                          <button onClick={() => setEditContact(c)} className="px-2 py-1 rounded text-xs font-medium text-[var(--c-info)] hover:bg-[var(--c-brand)]/15">Edit</button>
                          <button onClick={() => deleteContacts([c.id])} className="px-2 py-1 rounded text-xs font-medium text-[var(--c-error)] hover:bg-[#B23A2E]/10">Del</button>
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
            <div className="p-4 border-t border-[#D3D8D1] flex items-center justify-between">
              <span className="text-xs text-[var(--c-text-2)]">{total.toLocaleString()} contacts</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 hover:bg-[var(--c-surface)] disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 text-xs text-[var(--c-text-3)]">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 hover:bg-[var(--c-surface)] disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ CAMPAIGNS VIEW ═══════════════════ */}
      {view === 'campaigns' && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#D3D8D1] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[var(--c-ink)]">Email Campaigns</h3>
            <button onClick={() => setView('compose')} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)]">
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-[var(--c-text-2)] text-sm">No campaigns yet. Create one to start emailing your contacts.</div>
          ) : (
            <div className="divide-y divide-black/10">
              {campaigns.map(c => (
                <div key={c.id} className="px-4 py-3 hover:bg-[var(--c-surface)]/50 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--c-ink)] text-sm">{c.name}</div>
                    <div className="text-xs text-[var(--c-text-2)] mt-0.5">
                      {c.subject} &middot; {c._count.recipients} recipients
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.sentCount > 0 && (
                      <span className="text-xs text-[var(--c-text-3)]">{c.sentCount} sent{c.failedCount > 0 ? `, ${c.failedCount} failed` : ''}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(c.status)}`}>{c.status}</span>
                    <span className="text-xs text-[var(--c-text-2)]">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete campaign "${c.name}"?`)) return
                        try {
                          const res = await fetch('/api/admin/crm/campaigns', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ ids: [c.id] }),
                          })
                          if (!res.ok) throw new Error('Failed')
                          showToast('Campaign deleted')
                          fetchCampaigns()
                        } catch {
                          showToast('Failed to delete campaign', 'error')
                        }
                      }}
                      className="px-2 py-1 rounded text-xs font-medium text-[var(--c-error)] hover:bg-[#B23A2E]/10"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ COMPOSE VIEW ═══════════════════ */}
      {view === 'compose' && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6 space-y-5">
          <h3 className="text-lg font-bold text-[var(--c-ink)]">Compose Campaign</h3>
          <p className="text-xs text-[var(--c-text-2)] -mt-3">
            Use <code className="bg-[var(--c-canvas-2)] px-1 rounded">{'{{name}}'}</code> to personalise with the contact&apos;s name.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Campaign Name</label>
              <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. New Route Announcement" className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Subject Line</label>
              <input type="text" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)}
                placeholder="e.g. New Mediterranean Delivery Routes" className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Target Category (optional)</label>
              <select value={campaignCategory} onChange={e => setCampaignCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]">
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.value} ({c.count})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Target Priority (optional)</label>
              <select value={campaignPriority} onChange={e => setCampaignPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Email Body (HTML)</label>
            <textarea
              value={campaignHtml}
              onChange={e => setCampaignHtml(e.target.value)}
              rows={12}
              placeholder={`<h2>Hello {{name}},</h2>\n<p>We're excited to announce new delivery routes across the Mediterranean...</p>`}
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 font-mono resize-y"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setView('campaigns')} className="px-5 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]">
              Cancel
            </button>
            <button
              onClick={async () => {
                setActionLoading(true)
                try {
                  const res = await fetch('/api/admin/ai-actions/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      generateType: 'campaign',
                      params: {
                        goal: campaignName || 'engage existing contacts',
                        targetCategory: campaignCategory || undefined,
                      },
                    }),
                  })
                  if (!res.ok) throw new Error('Failed')
                  const data = await res.json()
                  const preview = data.preview
                  if (preview) {
                    if (preview.name && !campaignName) setCampaignName(preview.name)
                    if (preview.subject) setCampaignSubject(preview.subject)
                    if (preview.htmlBody) setCampaignHtml(preview.htmlBody)
                    showToast('AI draft loaded — review and edit before sending')
                  }
                } catch {
                  showToast('AI draft generation failed', 'error')
                } finally {
                  setActionLoading(false)
                }
              }}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl border border-[#1F5E86] text-[var(--c-info)] text-sm font-medium hover:bg-[#1F5E86]/10 disabled:opacity-50"
            >
              {actionLoading ? 'Generating...' : '✦ AI Draft'}
            </button>
            <button onClick={() => sendCampaign(true)} disabled={actionLoading} className="px-5 py-2.5 rounded-xl border border-[var(--c-accent)] text-[var(--c-accent)] text-sm font-medium hover:bg-[var(--c-accent)]/5 disabled:opacity-50">
              Save Draft
            </button>
            <button onClick={() => sendCampaign(false)} disabled={actionLoading} className="px-5 py-2.5 rounded-xl bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">
              {actionLoading ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ QUICK EMAIL MODAL ═══════════════════ */}

      {/* ═══════════════════ SOCIAL POSTS VIEW ═══════════════════ */}
      {view === 'social' && (
        <div className="space-y-4">
          {/* Social Stats */}
          {socialStats && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
                <div className="text-2xl font-bold text-[var(--c-ink)]">{socialStats.total}</div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5">Total Posts</div>
              </div>
              <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
                <div className="text-2xl font-bold text-[var(--c-ink)]">{socialStats.engagement.impressions.toLocaleString()}</div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5">Impressions</div>
              </div>
              <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
                <div className="text-2xl font-bold text-[var(--c-ink)]">{socialStats.engagement.likes.toLocaleString()}</div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5">Likes</div>
              </div>
              <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
                <div className="text-2xl font-bold text-[var(--c-ink)]">{socialStats.engagement.shares.toLocaleString()}</div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5">Shares</div>
              </div>
            </div>
          )}

          <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-[#D3D8D1] flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={socialPlatformFilter}
                  onChange={e => setSocialPlatformFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
                >
                  <option value="">All Platforms</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
                <select
                  value={socialStatusFilter}
                  onChange={e => setSocialStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => generateAiContent('social_post', { platform: 'linkedin' })}
                  disabled={aiGenerating}
                  className="px-4 py-2 rounded-lg bg-[var(--c-info)] text-white text-sm font-medium hover:bg-[var(--c-info)] disabled:opacity-50"
                >
                  {aiGenerating ? 'Generating...' : '✦ AI Generate Post'}
                </button>
                <button
                  onClick={() => generateAiContent('social_batch', { count: 5 })}
                  disabled={aiGenerating}
                  className="px-4 py-2 rounded-lg bg-[var(--c-info)] text-white text-sm font-medium hover:bg-[var(--c-info)] disabled:opacity-50"
                >
                  {aiGenerating ? 'Generating...' : '✦ AI Generate Week'}
                </button>
              </div>
            </div>

            {/* Posts List */}
            {socialLoading ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">Loading...</div>
            ) : socialPosts.length === 0 ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">
                No social posts yet. Use AI to generate your first batch.
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {socialPosts.map(post => (
                  <div key={post.id} className="p-4 hover:bg-[var(--c-surface)]/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            post.platform === 'linkedin' ? 'bg-[var(--c-brand)]/15 text-[var(--c-info)] border-[var(--c-brand)]/30' : 'bg-[#B23A2E]/20 text-[var(--c-error)] border-[#B23A2E]/40/30'
                          }`}>
                            {post.platform}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            post.status === 'published' ? 'bg-[var(--c-success)]/10 text-[var(--c-success)] border-[#256B4A]/40/30' :
                            post.status === 'scheduled' ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)] border-[var(--c-accent)]/20' :
                            post.status === 'failed' ? 'bg-[#B23A2E]/10 text-[var(--c-error)] border-[#B23A2E]/30' :
                            'bg-[var(--c-surface)] text-[var(--c-text-2)] border-black/10'
                          }`}>
                            {post.status}
                          </span>
                          {post.scheduledAt && (
                            <span className="text-xs text-[var(--c-text-2)]">
                              Scheduled: {new Date(post.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--c-ink)] whitespace-pre-wrap line-clamp-3">{post.content}</p>
                        {post.hashtags && (
                          <p className="text-xs text-[var(--c-info)] mt-1">{post.hashtags}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-[var(--c-text-2)] space-y-1 flex-shrink-0">
                        {post.status === 'published' && (
                          <>
                            <div>{post.impressions.toLocaleString()} views</div>
                            <div>{post.likes} likes · {post.comments} comments</div>
                          </>
                        )}
                        <div>{new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this post?')) return
                            try {
                              const res = await fetch('/api/admin/crm/social', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ ids: [post.id] }),
                              })
                              if (!res.ok) throw new Error('Failed')
                              showToast('Post deleted')
                              fetchSocialPosts()
                            } catch {
                              showToast('Failed to delete post', 'error')
                            }
                          }}
                          className="text-[var(--c-error)] hover:text-[var(--c-error)] font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ AI ACTION QUEUE VIEW ═══════════════════ */}
      {view === 'queue' && (
        <div className="space-y-4">
          {/* Queue Stats */}
          <div className="flex flex-wrap gap-4">
            {['pending', 'executed', 'rejected'].map(s => (
              <div key={s} className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
                <div className="text-2xl font-bold text-[var(--c-ink)]">{aiQueueStats[s] || 0}</div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5 capitalize">{s}</div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-[#D3D8D1] flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={aiQueueStatusFilter}
                  onChange={e => setAiQueueStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
                >
                  <option value="pending">Pending</option>
                  <option value="executed">Executed</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => generateAiContent('social_post', { platform: 'linkedin' })}
                  disabled={aiGenerating}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)] disabled:opacity-50"
                >
                  ✦ Social Post
                </button>
                <button
                  onClick={() => generateAiContent('campaign', { goal: 'engage existing contacts' })}
                  disabled={aiGenerating}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)] disabled:opacity-50"
                >
                  ✦ Campaign
                </button>
                <button
                  onClick={() => generateAiContent('followups')}
                  disabled={aiGenerating}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)] disabled:opacity-50"
                >
                  ✦ Follow-ups
                </button>
                <button
                  onClick={() => generateAiContent('analyze')}
                  disabled={aiGenerating}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)] disabled:opacity-50"
                >
                  ✦ Analyze CRM
                </button>
                <button
                  onClick={() => generateAiContent('social_batch', { count: 7 })}
                  disabled={aiGenerating}
                  className="px-3 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
                >
                  {aiGenerating ? 'Generating...' : '✦ Generate Week'}
                </button>
              </div>
            </div>

            {/* Actions List */}
            {aiQueueLoading ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">Loading...</div>
            ) : aiActions.length === 0 ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">
                No {aiQueueStatusFilter === 'all' ? '' : aiQueueStatusFilter} actions. Use the buttons above to generate AI content.
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {aiActions.map(action => {
                  const isExpanded = expandedAction === action.id
                  const isEditing = editingPayload === action.id
                  let payload: Record<string, unknown> = {}
                  try { payload = JSON.parse(action.payload) as Record<string, unknown> } catch { /* ignore */ }

                  const payloadContent = String(payload.content || '')
                  const payloadHashtags = payload.hashtags ? String(payload.hashtags) : ''
                  const payloadPlatform = String(payload.platform || '')
                  const payloadName = String(payload.name || '')
                  const payloadSubject = String(payload.subject || '')
                  const payloadHtmlBody = String(payload.htmlBody || '')
                  const payloadBody = String(payload.body || '')
                  const payloadContactName = String(payload.contactName || payload.to || '')
                  const payloadSummary = String(payload.summary || '')
                  const payloadInsights = Array.isArray(payload.insights) ? payload.insights.map(String) : []
                  const payloadRecommendations = Array.isArray(payload.recommendations) ? payload.recommendations.map(String) : []

                  return (
                    <div key={action.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedAction(isExpanded ? null : action.id)}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              action.type.includes('social') ? 'bg-[#1F5E86]/10 text-[var(--c-info)] border-[#1F5E86]' :
                              action.type.includes('campaign') ? 'bg-[var(--c-brand)]/15 text-[var(--c-info)] border-[var(--c-brand)]/30' :
                              action.type.includes('followup') ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)] border-[var(--c-accent)]/20' :
                              action.type.includes('analyze') ? 'bg-[var(--c-success)]/10 text-[var(--c-success)] border-[#256B4A]/40' :
                              'bg-[var(--c-surface)] text-[var(--c-text-2)] border-black/10'
                            }`}>
                              {action.type.replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              action.status === 'pending' ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)] border-[var(--c-accent)]/20' :
                              action.status === 'executed' ? 'bg-[var(--c-success)]/10 text-[var(--c-success)] border-[#256B4A]/40/30' :
                              action.status === 'rejected' ? 'bg-[#B23A2E]/10 text-[var(--c-error)] border-[#B23A2E]/30' :
                              'bg-[var(--c-surface)] text-[var(--c-text-2)] border-black/10'
                            }`}>
                              {action.status}
                            </span>
                            {action.confidence && (
                              <span className="text-[10px] text-[var(--c-text-2)]">{Math.round(action.confidence * 100)}% confidence</span>
                            )}
                          </div>
                          <h4 className="font-medium text-sm text-[var(--c-ink)]">{action.title}</h4>
                          {action.description && (
                            <p className="text-xs text-[var(--c-text-3)] mt-0.5">{action.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {action.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAiAction(action.id, 'approve')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--c-success)] text-white hover:bg-[#256B4A] disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPayload(action.id)
                                  setEditPayloadText(JSON.stringify(payload, null, 2))
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleAiAction(action.id, 'reject')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#B23A2E]/10 text-[var(--c-error)] hover:bg-[#B23A2E]/10 disabled:opacity-50"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Payload Preview */}
                      {isExpanded && !isEditing && (
                        <div className="mt-3 bg-[var(--c-surface)] rounded-xl p-4 text-xs">
                          {action.type === 'draft_social' && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <span className="text-[var(--c-text-3)] font-medium">Platform:</span>
                                <span className="capitalize">{payloadPlatform}</span>
                              </div>
                              <div>
                                <span className="text-[var(--c-text-3)] font-medium block mb-1">Content:</span>
                                <p className="text-sm text-[var(--c-ink)] whitespace-pre-wrap">{payloadContent}</p>
                              </div>
                              {payloadHashtags && (
                                <p className="text-[var(--c-info)]">{payloadHashtags}</p>
                              )}
                            </div>
                          )}
                          {action.type === 'draft_campaign' && (
                            <div className="space-y-2">
                              <div><span className="text-[var(--c-text-3)] font-medium">Name:</span> {payloadName}</div>
                              <div><span className="text-[var(--c-text-3)] font-medium">Subject:</span> {payloadSubject}</div>
                              <div>
                                <span className="text-[var(--c-text-3)] font-medium block mb-1">Email Preview:</span>
                                <div className="border border-black/10 rounded-lg p-3 bg-[var(--c-surface)] text-sm max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(payloadHtmlBody) }} />
                              </div>
                            </div>
                          )}
                          {(action.type === 'suggest_followup' || action.type === 'draft_email') && (
                            <div className="space-y-2">
                              <div><span className="text-[var(--c-text-3)] font-medium">To:</span> {payloadContactName}</div>
                              <div><span className="text-[var(--c-text-3)] font-medium">Subject:</span> {payloadSubject}</div>
                              <div>
                                <span className="text-[var(--c-text-3)] font-medium block mb-1">Body:</span>
                                <div className="border border-black/10 rounded-lg p-3 bg-[var(--c-surface)] text-sm max-h-40 overflow-y-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(payloadBody) }} />
                              </div>
                            </div>
                          )}
                          {action.type === 'analyze_contacts' && (
                            <div className="space-y-2">
                              {payloadSummary && <p className="text-sm text-[var(--c-ink)]">{payloadSummary}</p>}
                              {payloadInsights.length > 0 && (
                                <div>
                                  <span className="text-[var(--c-text-3)] font-medium block mb-1">Insights:</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {payloadInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                                  </ul>
                                </div>
                              )}
                              {payloadRecommendations.length > 0 && (
                                <div>
                                  <span className="text-[var(--c-text-3)] font-medium block mb-1">Recommendations:</span>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {payloadRecommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          {!['draft_social', 'draft_campaign', 'suggest_followup', 'draft_email', 'analyze_contacts'].includes(action.type) && (
                            <pre className="whitespace-pre-wrap text-xs text-[var(--c-text-2)]">{JSON.stringify(payload, null, 2)}</pre>
                          )}
                          {action.error && (
                            <div className="mt-2 text-[var(--c-error)] bg-[#B23A2E]/10 rounded-lg px-3 py-2">Error: {action.error}</div>
                          )}
                        </div>
                      )}

                      {/* Edit Mode */}
                      {isEditing && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={editPayloadText}
                            onChange={e => setEditPayloadText(e.target.value)}
                            rows={10}
                            className="w-full px-3 py-2 rounded-xl border border-black/10 text-xs font-mono outline-none focus:border-[var(--c-accent)] resize-y"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAiEditSave(action.id)}
                              className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-xs font-medium hover:bg-[var(--c-accent-hover)]"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingPayload(null)}
                              className="px-4 py-2 rounded-lg border border-black/10 text-xs font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ INBOX VIEW ═══════════════════ */}
      {view === 'inbox' && !selectedEmail && (
        <div className="space-y-4">
          {/* Inbox Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold text-[var(--c-ink)]">{inboxStats.unread}</div>
              <div className="text-xs text-[var(--c-text-2)] mt-0.5">Unread</div>
            </div>
            <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold text-[var(--c-ink)]">{inboxStats.starred}</div>
              <div className="text-xs text-[var(--c-text-2)] mt-0.5">Starred</div>
            </div>
            <div className="bg-[var(--c-surface)] rounded-xl border border-[#D3D8D1] shadow-sm px-5 py-4 flex-1 min-w-[120px]">
              <div className="text-2xl font-bold text-[var(--c-ink)]">{inboxStats.total}</div>
              <div className="text-xs text-[var(--c-text-2)] mt-0.5">Total</div>
            </div>
          </div>

          <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-[#D3D8D1] space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={inboxSearchInput}
                    onChange={e => setInboxSearchInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                  />
                </div>
                <select
                  value={inboxFolder}
                  onChange={e => { setInboxFolder(e.target.value); setInboxPage(1) }}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]"
                >
                  <option value="INBOX">Inbox</option>
                  <option value="Sent">Sent</option>
                  <option value="all">All Mail</option>
                </select>
                <div className="flex gap-1">
                  {(['all', 'unread', 'starred'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => { setInboxFilter(f); setInboxPage(1) }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        inboxFilter === f
                          ? 'bg-[#1d1d1f] text-white'
                          : 'border border-black/10 text-[var(--c-text-3)] hover:bg-[var(--c-surface)]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  onClick={syncInbox}
                  disabled={inboxSyncing}
                  className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
                >
                  {inboxSyncing ? 'Syncing...' : '↻ Sync'}
                </button>
                <button
                  onClick={() => {
                    setShowComposeEmail(true)
                    setReplyTo(null)
                    setComposeEmailTo('')
                    setComposeEmailSubject('')
                    setComposeEmailBody('')
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)]"
                >
                  + Compose
                </button>
              </div>
            </div>

            {/* Email List */}
            {inboxLoading ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">Loading...</div>
            ) : inboxEmails.length === 0 ? (
              <div className="p-8 text-center text-[var(--c-text-2)] text-sm">
                {inboxStats.total === 0 ? 'No emails yet. Click "Sync" to fetch from your mailbox.' : 'No emails match your filters.'}
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {inboxEmails.map(email => (
                  <div
                    key={email.id}
                    className={`px-4 py-3 hover:bg-[var(--c-surface)]/50 cursor-pointer flex items-start gap-3 ${!email.isRead ? 'bg-[var(--c-brand)]/15/30' : ''}`}
                    onClick={async () => {
                      setSelectedEmail(email)
                      if (!email.isRead) {
                        updateEmailFlags([email.id], { isRead: true })
                      }
                    }}
                  >
                    {/* Star */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        updateEmailFlags([email.id], { isStarred: !email.isStarred })
                      }}
                      className={`mt-0.5 text-lg leading-none ${email.isStarred ? 'text-[var(--c-accent)] //400' : 'text-[var(--c-text-3)] hover:text-[var(--c-accent)] //300'}`}
                    >
                      ★
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-[var(--c-ink)]' : 'text-[var(--c-text-2)]'}`}>
                          {email.folder === 'Sent' ? `To: ${email.to}` : (email.fromName || email.from)}
                        </span>
                        {email.contact && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--c-brand)]/15 text-[var(--c-info)] border border-[var(--c-brand)]/30">
                            {email.contact.category}
                          </span>
                        )}
                        {email.hasAttachments && (
                          <span className="text-[var(--c-text-2)] text-xs">📎</span>
                        )}
                      </div>
                      <div className={`text-sm truncate ${!email.isRead ? 'font-medium text-[var(--c-ink)]' : 'text-[var(--c-text-2)]'}`}>
                        {email.subject}
                      </div>
                      <div className="text-xs text-[var(--c-text-2)] truncate mt-0.5">
                        {email.snippet}
                      </div>
                    </div>

                    <div className="text-xs text-[var(--c-text-2)] whitespace-nowrap flex-shrink-0">
                      {new Date(email.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      <div className="text-[10px]">{new Date(email.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {inboxTotalPages > 1 && (
              <div className="p-4 border-t border-[#D3D8D1] flex items-center justify-between">
                <span className="text-xs text-[var(--c-text-2)]">{inboxStats.total} emails</span>
                <div className="flex gap-1">
                  <button onClick={() => setInboxPage(p => Math.max(1, p - 1))} disabled={inboxPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 hover:bg-[var(--c-surface)] disabled:opacity-40">Prev</button>
                  <span className="px-3 py-1.5 text-xs text-[var(--c-text-3)]">Page {inboxPage} of {inboxTotalPages}</span>
                  <button onClick={() => setInboxPage(p => Math.min(inboxTotalPages, p + 1))} disabled={inboxPage === inboxTotalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 hover:bg-[var(--c-surface)] disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ EMAIL DETAIL VIEW ═══════════════════ */}
      {view === 'inbox' && selectedEmail && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#D3D8D1] flex items-center gap-3">
            <button
              onClick={() => setSelectedEmail(null)}
              className="px-3 py-1.5 rounded-lg border border-black/10 text-sm text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
            >
              ← Back
            </button>
            <div className="flex-1" />
            <button
              onClick={() => updateEmailFlags([selectedEmail.id], { isStarred: !selectedEmail.isStarred })}
              className={`text-lg ${selectedEmail.isStarred ? 'text-[var(--c-accent)] //400' : 'text-[var(--c-text-3)] hover:text-[var(--c-accent)] //300'}`}
            >
              ★
            </button>
            <button
              onClick={() => {
                setReplyTo(selectedEmail)
                setComposeEmailTo(selectedEmail.folder === 'Sent' ? selectedEmail.to : selectedEmail.from)
                setComposeEmailSubject(selectedEmail.subject.startsWith('Re: ') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`)
                setComposeEmailBody(`\n\n---\nOn ${new Date(selectedEmail.date).toLocaleString('en-GB')}, ${selectedEmail.fromName || selectedEmail.from} wrote:\n> ${(selectedEmail.textBody || selectedEmail.snippet || '').split('\n').join('\n> ')}`)
                setShowComposeEmail(true)
              }}
              className="px-4 py-1.5 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)]"
            >
              Reply
            </button>
            <button
              onClick={() => {
                updateEmailFlags([selectedEmail.id], { isArchived: true })
                setSelectedEmail(null)
                showToast('Email archived')
              }}
              className="px-3 py-1.5 rounded-lg border border-black/10 text-sm text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
            >
              Archive
            </button>
          </div>

          {/* Email Content */}
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--c-ink)]">{selectedEmail.subject}</h2>

            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--c-ink)]">
                  {selectedEmail.fromName || selectedEmail.from}
                  {selectedEmail.fromName && (
                    <span className="text-[var(--c-text-2)] font-normal ml-2">&lt;{selectedEmail.from}&gt;</span>
                  )}
                </div>
                <div className="text-xs text-[var(--c-text-2)] mt-0.5">
                  To: {selectedEmail.to}
                  {selectedEmail.cc && <span> · CC: {selectedEmail.cc}</span>}
                </div>
                {selectedEmail.contact && (
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--c-brand)]/15 text-[var(--c-info)] border border-[var(--c-brand)]/30">
                      CRM: {selectedEmail.contact.name} — {selectedEmail.contact.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-[var(--c-text-2)]">
                {new Date(selectedEmail.date).toLocaleString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
            </div>

            {selectedEmail.hasAttachments && selectedEmail.attachments && (
              <div className="flex flex-wrap gap-2">
                {(JSON.parse(selectedEmail.attachments) as { filename: string; contentType: string; size: number }[]).map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 bg-[var(--c-surface)] text-xs text-[var(--c-text-2)]">
                    <span>📎</span>
                    <span>{att.filename}</span>
                    <span className="text-[var(--c-text-2)]">({(att.size / 1024).toFixed(0)}KB)</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#D3D8D1] pt-4">
              {selectedEmail.htmlBody ? (
                <div
                  className="prose prose-sm max-w-none text-[var(--c-ink)]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlBody) }}
                />
              ) : (
                <pre className="text-sm text-[var(--c-ink)] whitespace-pre-wrap font-sans">
                  {selectedEmail.textBody || '(no content)'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ COMPOSE EMAIL MODAL ═══════════════════ */}
      {showComposeEmail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowComposeEmail(false)}>
          <div className="bg-[var(--c-surface)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#D3D8D1]">
              <h3 className="text-lg font-bold text-[var(--c-ink)]">{replyTo ? 'Reply' : 'New Email'}</h3>
              <p className="text-xs text-[var(--c-text-2)] mt-1">From: info@onshoredelivery.com</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">To</label>
                <input
                  type="email"
                  value={composeEmailTo}
                  onChange={e => setComposeEmailTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Subject</label>
                <input
                  type="text"
                  value={composeEmailSubject}
                  onChange={e => setComposeEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Message</label>
                <textarea
                  value={composeEmailBody}
                  onChange={e => setComposeEmailBody(e.target.value)}
                  rows={10}
                  placeholder="Write your message..."
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 resize-y"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#D3D8D1] flex gap-3">
              <button
                onClick={() => setShowComposeEmail(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
              >
                Cancel
              </button>
              <button
                onClick={sendComposeEmail}
                disabled={composeEmailSending || !composeEmailTo || !composeEmailSubject || !composeEmailBody}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
              >
                {composeEmailSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ AI CHAT VIEW ═══════════════════ */}
      {view === 'ai' && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm overflow-hidden flex flex-col" style={{ height: '600px' }}>
          <div className="p-4 border-b border-[#D3D8D1]">
            <h3 className="text-sm font-semibold text-[var(--c-ink)]">AI CRM Assistant</h3>
            <p className="text-xs text-[var(--c-text-2)] mt-0.5">
              Ask me to draft emails, plan campaigns, analyze contacts, or generate social content. All actions require your approval.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <div className="text-4xl">✦</div>
                <p className="text-sm text-[var(--c-text-3)]">How can I help with your CRM today?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'Draft an email campaign for yacht provisioning contacts',
                    'Generate a LinkedIn post about our Mediterranean routes',
                    'Which contacts should I follow up with?',
                    'Analyze my contact database',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setAiInput(suggestion)
                        // Auto-send the suggestion
                        setAiMessages(prev => [...prev, { role: 'user', content: suggestion }])
                        setAiChatLoading(true)
                        fetch('/api/admin/crm/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ message: suggestion, selectedContactIds: [] }),
                        })
                          .then(r => r.ok ? r.json() : Promise.reject())
                          .then(data => {
                            setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply, actions: data.actions }])
                          })
                          .catch(() => {
                            setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
                          })
                          .finally(() => { setAiChatLoading(false); setAiInput('') })
                      }}
                      className="px-3 py-1.5 rounded-lg border border-black/10 text-xs text-[var(--c-text-2)] hover:bg-[var(--c-surface)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[var(--c-surface)] text-[var(--c-ink)]'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.actions.map((action, j) => (
                        <button
                          key={j}
                          onClick={() => executeAiChatAction(action)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-[var(--c-accent)] text-white text-xs font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
                        >
                          {action.label} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {aiChatLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--c-surface)] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#1E3A4D] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#1E3A4D] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#1E3A4D] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#D3D8D1]">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() } }}
                placeholder="Ask the AI assistant..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
              />
              <button
                onClick={sendAiMessage}
                disabled={aiChatLoading || !aiInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ QUICK EMAIL MODAL (original) ═══════════════════ */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEmailModal(null)}>
          <div className="bg-[var(--c-surface)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#D3D8D1]">
              <h3 className="text-lg font-bold text-[var(--c-ink)]">Send Email</h3>
              <p className="text-xs text-[var(--c-text-2)] mt-1">To: {emailModal.name} &lt;{emailModal.email}&gt;</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="e.g. Following up on our conversation"
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Message</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={8}
                  placeholder={`Hi ${emailModal.name},\n\n`}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 resize-y"
                />
              </div>
              {emailModal.phone && (
                <div className="flex items-center gap-2 bg-[var(--c-success)]/10 rounded-lg px-3 py-2 text-xs text-[var(--c-success)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Also reachable on WhatsApp:
                  <a href={getWhatsAppUrl(emailModal.phone, `Hi ${emailModal.name}, `)} target="_blank" rel="noopener noreferrer" className="font-medium underline">{emailModal.phone}</a>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#D3D8D1] flex gap-3">
              <button onClick={() => setEmailModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]">
                Cancel
              </button>
              <button
                onClick={sendQuickEmail}
                disabled={emailSending || !emailSubject || !emailBody}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50"
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
      <div className="bg-[var(--c-surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#D3D8D1]">
          <h3 className="text-lg font-bold text-[var(--c-ink)]">{contact ? 'Edit Contact' : 'Add Contact'}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Category *</label>
              <input type="text" list="cat-list" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
              <datalist id="cat-list">
                {categories.map(c => <option key={c.value} value={c.value} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Email 2</label>
              <input type="email" value={form.email2} onChange={e => setForm(f => ({ ...f, email2: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Phone 2</label>
              <input type="text" value={form.phone2} onChange={e => setForm(f => ({ ...f, phone2: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Website</label>
              <input type="text" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Instagram</label>
              <input type="text" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="comma-separated tags" className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--c-text-3)] mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-[var(--c-accent)] resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-[#D3D8D1] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[var(--c-text-2)] hover:bg-[var(--c-surface)]">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.name || !form.category}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">
            {loading ? 'Saving...' : contact ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
