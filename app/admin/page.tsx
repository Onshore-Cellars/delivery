'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  users: { total: number; carriers: number; suppliers: number; yachtOwners: number; crew?: number }
  listings: { total: number; active: number; twoWay?: number }
  bookings: { total: number; pending: number; confirmed: number; inTransit?: number; delivered?: number; cancelled?: number; withMMSI?: number; returnLegs?: number }
  revenue: { total: number; platformFees?: number }
  documents?: { pending: number }
  vehicles?: { total: number }
}

interface RecentBooking {
  id: string
  totalPrice: number
  platformFee: number
  status: string
  paymentStatus: string
  createdAt: string
  shipper: { name: string; company?: string }
  listing: { title: string; originPort: string; destinationPort: string }
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  company?: string
  phone?: string
  verified: boolean
  createdAt: string
  _count: { listings: number; bookings: number }
}

interface AdminListing {
  id: string
  title: string
  status: string
  featured: boolean
  originPort: string
  destinationPort: string
  departureDate: string
  totalCapacityKg: number
  availableKg: number
  pricePerKg?: number
  flatRate?: number
  createdAt: string
  carrier: { name: string; company?: string }
  _count: { bookings: number }
}

interface AdminDocument {
  id: string
  type: string
  name: string
  status: string
  reviewNotes?: string
  createdAt: string
  user: { id: string; name: string; email: string; company?: string; role: string }
}

interface ActivityItem {
  id: string
  type: 'booking' | 'registration' | 'review'
  title: string
  description: string
  timestamp: string
  meta?: string
}

type TabKey = 'overview' | 'users' | 'bookings' | 'listings' | 'documents' | 'notifications' | 'activity'

// ─── Constants ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  QUOTE_REQUESTED: 'bg-purple-50 text-purple-700 border-purple-200',
  QUOTED: 'bg-violet-50 text-violet-700 border-violet-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PICKED_UP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMS_HOLD: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  DISPUTED: 'bg-rose-50 text-rose-700 border-rose-200',
}

const listingStatusColors: Record<string, string> = {
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FULL: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
}

const TAB_CONFIG: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'bookings', label: 'Bookings', icon: 'bookings' },
  { key: 'listings', label: 'Listings', icon: 'listings' },
  { key: 'documents', label: 'Documents', icon: 'documents' },
  { key: 'notifications', label: 'Broadcast', icon: 'notifications' },
  { key: 'activity', label: 'Activity', icon: 'activity' },
]

function TabIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || 'w-4 h-4'
  switch (name) {
    case 'overview':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
    case 'users':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
    case 'bookings':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
    case 'listings':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
    case 'documents':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    case 'notifications':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
    case 'activity':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    default:
      return null
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [stats, setStats] = useState<Stats | null>(null)
  const [allBookings, setAllBookings] = useState<RecentBooking[]>([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [allListings, setAllListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [allDocuments, setAllDocuments] = useState<AdminDocument[]>([])
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastRole, setBroadcastRole] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const formatCurrency = (amount: number) => `\u20AC${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [statsRes, usersRes, listingsRes, docsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/listings?all=true&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/documents', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setAllBookings(data.recentBookings || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setAllUsers(data.users || [])
      }
      if (listingsRes.ok) {
        const data = await listingsRes.json()
        setAllListings(data.listings || [])
      }
      if (docsRes.ok) {
        const data = await docsRes.json()
        setAllDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard')
      return
    }
    if (token) fetchData()
  }, [authLoading, user, token, router, fetchData])

  // ─── User Actions ─────────────────────────────────────────────────────────

  const handleUserAction = async (userId: string, action: 'verify' | 'suspend') => {
    if (!token) return
    setActionLoading(`${userId}-${action}`)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(prev => prev.map(u => u.id === userId ? data.user : u))
        showToast(data.message)
      } else {
        const data = await res.json()
        showToast(data.error || 'Action failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Booking Actions ──────────────────────────────────────────────────────

  const handleBookingStatus = async (bookingId: string, status: string) => {
    if (!token) return
    setActionLoading(`booking-${bookingId}`)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
        showToast(`Booking status updated to ${status}`)
      } else {
        showToast('Failed to update booking', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefund = async (bookingId: string) => {
    if (!token || !confirm('Process refund for this booking? This cannot be undone.')) return
    setActionLoading(`refund-${bookingId}`)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED', paymentStatus: 'REFUNDED' }),
      })
      if (res.ok) {
        setAllBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'CANCELLED', paymentStatus: 'REFUNDED' } : b
        ))
        showToast('Refund processed successfully')
      } else {
        showToast('Failed to process refund', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Listing Actions ──────────────────────────────────────────────────────

  const handleToggleFeatured = async (listingId: string, currentFeatured: boolean) => {
    if (!token) return
    setActionLoading(`listing-${listingId}`)
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      })
      if (res.ok) {
        setAllListings(prev => prev.map(l =>
          l.id === listingId ? { ...l, featured: !currentFeatured } : l
        ))
        showToast(currentFeatured ? 'Listing unfeatured' : 'Listing featured')
      } else {
        showToast('Failed to update listing', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Document Actions ─────────────────────────────────────────────────────

  const handleDocumentAction = async (documentId: string, action: 'verify' | 'reject', reviewNotes?: string) => {
    if (!token) return
    setActionLoading(`doc-${documentId}`)
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId, action, reviewNotes }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllDocuments(prev => prev.map(d => d.id === documentId ? data.document : d))
        showToast(data.message)
      } else {
        showToast('Failed to update document', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Broadcast Notification ──────────────────────────────────────────────

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !broadcastTitle || !broadcastMessage) return
    setBroadcastSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          targetRole: broadcastRole || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        showToast(data.message)
        setBroadcastTitle('')
        setBroadcastMessage('')
      } else {
        showToast('Failed to send notification', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setBroadcastSending(false)
    }
  }

  // ─── CSV Export ────────────────────────────────────────────────────────────

  const exportCSV = (type: 'users' | 'bookings' | 'listings') => {
    let csv = ''
    let filename = ''

    if (type === 'users') {
      csv = 'Name,Email,Role,Company,Verified,Listings,Bookings,Joined\n'
      csv += filteredUsers.map(u =>
        `"${u.name}","${u.email}","${u.role}","${u.company || ''}","${u.verified}","${u._count.listings}","${u._count.bookings}","${formatDate(u.createdAt)}"`
      ).join('\n')
      filename = 'users-export.csv'
    } else if (type === 'bookings') {
      csv = 'ID,Status,Payment,Shipper,Route,Price,Date\n'
      csv += filteredBookings.map(b =>
        `"${b.id}","${b.status}","${b.paymentStatus || 'N/A'}","${b.shipper.name}","${b.listing.originPort} > ${b.listing.destinationPort}","${b.totalPrice}","${formatDate(b.createdAt)}"`
      ).join('\n')
      filename = 'bookings-export.csv'
    } else {
      csv = 'Title,Status,Featured,Origin,Destination,Carrier,Bookings,Created\n'
      csv += filteredListings.map(l =>
        `"${l.title}","${l.status}","${l.featured}","${l.originPort}","${l.destinationPort}","${l.carrier?.name || ''}","${l._count?.bookings || 0}","${formatDate(l.createdAt)}"`
      ).join('\n')
      filename = 'listings-export.csv'
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${type} exported successfully`)
  }

  // ─── Search & Filter ──────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase()

  const filteredUsers = useMemo(() =>
    allUsers.filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) || (u.company || '').toLowerCase().includes(q)
    ), [allUsers, q])

  const filteredBookings = useMemo(() =>
    allBookings.filter(b =>
      !q || b.shipper.name.toLowerCase().includes(q) || b.listing.title.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q) || b.listing.originPort.toLowerCase().includes(q) ||
      b.listing.destinationPort.toLowerCase().includes(q)
    ), [allBookings, q])

  const filteredListings = useMemo(() =>
    allListings.filter(l =>
      !q || l.title?.toLowerCase().includes(q) || l.originPort?.toLowerCase().includes(q) ||
      l.destinationPort?.toLowerCase().includes(q) || l.status?.toLowerCase().includes(q) ||
      (l.carrier?.name || '').toLowerCase().includes(q)
    ), [allListings, q])

  // ─── Activity Feed ────────────────────────────────────────────────────────

  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []
    allBookings.forEach(b => {
      items.push({
        id: `b-${b.id}`,
        type: 'booking',
        title: `Booking: ${b.listing.title}`,
        description: `${b.shipper.name} booked ${b.listing.originPort} \u2192 ${b.listing.destinationPort} \u2014 ${formatCurrency(b.totalPrice)}`,
        timestamp: b.createdAt,
        meta: b.status,
      })
    })
    allUsers.forEach(u => {
      items.push({
        id: `u-${u.id}`,
        type: 'registration',
        title: `New ${u.role.replace('_', ' ').toLowerCase()}: ${u.name}`,
        description: `${u.email}${u.company ? ` \u2014 ${u.company}` : ''}`,
        timestamp: u.createdAt,
      })
    })
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return items.slice(0, 30)
  }, [allBookings, allUsers])

  // ─── Revenue Analytics ────────────────────────────────────────────────────

  const revenueByMonth = useMemo(() => {
    const months: Record<string, number> = {}
    allBookings.forEach(b => {
      if (b.status === 'CANCELLED') return
      const d = new Date(b.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] || 0) + b.totalPrice
    })
    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
    const max = Math.max(...sorted.map(([, v]) => v), 1)
    return sorted.map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      total,
      pct: (total / max) * 100,
    }))
  }, [allBookings])

  // ─── Stats Derivations ────────────────────────────────────────────────────

  const newUsersThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return allUsers.filter(u => new Date(u.createdAt) >= weekAgo).length
  }, [allUsers])

  const bookingsByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    allBookings.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1
    })
    return counts
  }, [allBookings])

  const usersByRole = useMemo(() => {
    const counts: Record<string, number> = {}
    allUsers.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1
    })
    return counts
  }, [allUsers])

  // ─── Guard ────────────────────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="loading-shimmer w-64 h-8 rounded-lg" />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="page-container wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-semibold text-[#C6904D] uppercase tracking-[0.15em] mb-1">Administration</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Platform management and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users, bookings, listings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full sm:w-72 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 mb-8">
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit min-w-full sm:min-w-0">
          {TAB_CONFIG.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                tab === t.key
                  ? 'bg-[#1d1d1f] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#1d1d1f] hover:bg-slate-50'
              }`}
            >
              <TabIcon name={t.icon} className="w-4 h-4" />
              {t.label}
            </button>
          ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer h-32 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
            {tab === 'overview' && stats && (
              <div className="space-y-8">
                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-bold">&euro;</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#1d1d1f]">{formatCurrency(stats.revenue.total)}</div>
                    <div className="mt-2 text-xs text-slate-500">Platform lifetime revenue</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Listings</div>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">#</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#1d1d1f]">{stats.listings.active}</div>
                    <div className="mt-2 text-xs text-slate-500">{stats.listings.total} total listings</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Bookings</div>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-sm font-bold">!</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#1d1d1f]">{stats.bookings.pending}</div>
                    <div className="mt-2 text-xs text-slate-500">{stats.bookings.confirmed} confirmed &middot; {stats.bookings.total} total</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Users (This Week)</div>
                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 text-sm font-bold">+</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#1d1d1f]">{newUsersThisWeek}</div>
                    <div className="mt-2 text-xs text-slate-500">{stats.users.total} total users</div>
                  </div>
                </div>

                {/* Platform Health */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Two-Way Listings', value: stats.listings.twoWay || 0, color: 'text-[#C6904D]' },
                    { label: 'MMSI Bookings', value: stats.bookings.withMMSI || 0, color: 'text-blue-600' },
                    { label: 'Return Leg Bookings', value: stats.bookings.returnLegs || 0, color: 'text-violet-600' },
                    { label: 'In Transit', value: stats.bookings.inTransit || 0, color: 'text-cyan-600' },
                    { label: 'Pending Docs', value: stats.documents?.pending || 0, color: 'text-amber-600' },
                    { label: 'Vehicles', value: stats.vehicles?.total || 0, color: 'text-slate-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-center">
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Row: Revenue Chart + Breakdown Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Bar Chart */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h2 className="font-semibold text-[#1d1d1f] mb-4">Revenue by Month</h2>
                    {revenueByMonth.length === 0 ? (
                      <div className="text-center text-slate-400 text-sm py-12">No revenue data yet</div>
                    ) : (
                      <div className="flex items-end gap-3 h-48">
                        {revenueByMonth.map((m, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="text-xs font-medium text-[#1d1d1f]">{formatCurrency(m.total)}</div>
                            <div className="w-full relative flex items-end" style={{ height: '140px' }}>
                              <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(m.pct, 4)}%`,
                                  background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a8e 100%)',
                                }}
                              />
                            </div>
                            <div className="text-xs text-slate-500">{m.month}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Breakdowns */}
                  <div className="space-y-4">
                    {/* Users by Role */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-3">Users by Role</h3>
                      <div className="space-y-2">
                        {Object.entries(usersByRole).map(([role, count]) => (
                          <div key={role} className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">{role.replace('_', ' ')}</span>
                            <span className="text-xs font-semibold text-[#1d1d1f] bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bookings by Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-3">Bookings by Status</h3>
                      <div className="space-y-2">
                        {Object.entries(bookingsByStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold text-[#1d1d1f]">{count}</span>
                          </div>
                        ))}
                        {Object.keys(bookingsByStatus).length === 0 && (
                          <div className="text-xs text-slate-400">No bookings yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings (on Overview) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-[#1d1d1f]">Recent Bookings</h2>
                    <button
                      onClick={() => setTab('bookings')}
                      className="text-xs text-[#1d1d1f] hover:text-[#1d1d1f] font-medium"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {allBookings.slice(0, 5).map(b => (
                      <div key={b.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium text-[#1d1d1f]">{b.listing.title}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {b.shipper.name} &middot; {b.listing.originPort} &rarr; {b.listing.destinationPort}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#1d1d1f]">{formatCurrency(b.totalPrice)}</div>
                          <div className="text-xs text-slate-400">{formatDate(b.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    {allBookings.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">No bookings yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ USERS TAB ═══════════════════ */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1d1d1f]">All Users ({filteredUsers.length})</h2>
                  <button
                    onClick={() => exportCSV('users')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-6 py-3 font-medium text-slate-500">Name</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Role</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Company</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Listings</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Bookings</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Joined</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-[#1d1d1f]">{u.name}</td>
                            <td className="px-6 py-3 text-slate-600">{u.email}</td>
                            <td className="px-6 py-3">
                              <span className="badge bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7]">
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">{u.company || '-'}</td>
                            <td className="px-6 py-3">
                              {u.verified ? (
                                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                              ) : (
                                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Unverified</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-slate-600 text-center">{u._count.listings}</td>
                            <td className="px-6 py-3 text-slate-600 text-center">{u._count.bookings}</td>
                            <td className="px-6 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                            <td className="px-6 py-3">
                              {u.role !== 'ADMIN' && (
                                <div className="flex gap-1">
                                  {!u.verified ? (
                                    <button
                                      onClick={() => handleUserAction(u.id, 'verify')}
                                      disabled={actionLoading === `${u.id}-verify`}
                                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `${u.id}-verify` ? '...' : 'Verify'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUserAction(u.id, 'suspend')}
                                      disabled={actionLoading === `${u.id}-suspend`}
                                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `${u.id}-suspend` ? '...' : 'Suspend'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-slate-400 text-sm">
                              {searchQuery ? 'No users match your search' : 'No users found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ BOOKINGS TAB ═══════════════════ */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1d1d1f]">All Bookings ({filteredBookings.length})</h2>
                  <button
                    onClick={() => exportCSV('bookings')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {filteredBookings.map(b => (
                      <div key={b.id} className="px-6 py-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace(/_/g, ' ')}</span>
                              {b.paymentStatus && (
                                <span className={`badge border ${paymentStatusColors[b.paymentStatus] || ''}`}>
                                  Pay: {b.paymentStatus}
                                </span>
                              )}
                              <span className="font-medium text-[#1d1d1f]">{b.listing.title}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              Shipper: {b.shipper.name}{b.shipper.company && ` (${b.shipper.company})`} &middot;
                              {b.listing.originPort} &rarr; {b.listing.destinationPort}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              ID: {b.id.slice(0, 12)}... &middot; {formatDateTime(b.createdAt)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold text-[#1d1d1f]">{formatCurrency(b.totalPrice)}</div>
                            {/* Actions */}
                            <div className="flex gap-1 mt-2 justify-end flex-wrap">
                              {b.status === 'PENDING' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'CONFIRMED')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                              )}
                              {b.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'PICKED_UP')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 disabled:opacity-50"
                                >
                                  Mark Picked Up
                                </button>
                              )}
                              {(b.status === 'PICKED_UP' || b.status === 'CONFIRMED') && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'IN_TRANSIT')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  In Transit
                                </button>
                              )}
                              {b.status === 'IN_TRANSIT' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'DELIVERED')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 disabled:opacity-50"
                                >
                                  Delivered
                                </button>
                              )}
                              {b.status !== 'CANCELLED' && b.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'CANCELLED')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                              {b.paymentStatus !== 'REFUNDED' && b.status !== 'PENDING' && (
                                <button
                                  onClick={() => handleRefund(b.id)}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 disabled:opacity-50"
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredBookings.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        {searchQuery ? 'No bookings match your search' : 'No bookings yet'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ LISTINGS TAB ═══════════════════ */}
            {tab === 'listings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1d1d1f]">All Listings ({filteredListings.length})</h2>
                  <button
                    onClick={() => exportCSV('listings')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-6 py-3 font-medium text-slate-500">Title</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Route</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Carrier</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Departure</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Capacity</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Bookings</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Featured</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredListings.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-[#1d1d1f] max-w-[200px] truncate">{l.title}</td>
                            <td className="px-6 py-3 text-slate-600 text-xs">
                              {l.originPort} &rarr; {l.destinationPort}
                            </td>
                            <td className="px-6 py-3 text-slate-600">{l.carrier?.name || '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`badge border ${listingStatusColors[l.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-400 text-xs">{l.departureDate ? formatDate(l.departureDate) : '-'}</td>
                            <td className="px-6 py-3 text-slate-600 text-xs">
                              {l.availableKg?.toLocaleString() || '?'} / {l.totalCapacityKg?.toLocaleString() || '?'} kg
                            </td>
                            <td className="px-6 py-3 text-slate-600 text-center">{l._count?.bookings || 0}</td>
                            <td className="px-6 py-3">
                              {l.featured ? (
                                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Featured</span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => handleToggleFeatured(l.id, l.featured)}
                                disabled={actionLoading === `listing-${l.id}`}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                                  l.featured
                                    ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {actionLoading === `listing-${l.id}` ? '...' : l.featured ? 'Unfeature' : 'Feature'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredListings.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-slate-400 text-sm">
                              {searchQuery ? 'No listings match your search' : 'No listings found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ DOCUMENTS TAB ═══════════════════ */}
            {tab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1d1d1f]">Document Verification ({allDocuments.length})</h2>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {allDocuments.map(doc => (
                      <div key={doc.id} className="px-6 py-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge border ${
                                doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                doc.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                doc.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{doc.status}</span>
                              <span className="badge bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7]">
                                {doc.type.replace(/_/g, ' ')}
                              </span>
                              <span className="font-medium text-[#1d1d1f]">{doc.name}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {doc.user.name} ({doc.user.email})
                              {doc.user.company && ` \u2014 ${doc.user.company}`}
                              {' \u2014 '}{doc.user.role.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Uploaded: {formatDateTime(doc.createdAt)}
                              {doc.reviewNotes && <span className="text-red-500 ml-2">Note: {doc.reviewNotes}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {doc.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleDocumentAction(doc.id, 'verify')}
                                  disabled={actionLoading === `doc-${doc.id}`}
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  {actionLoading === `doc-${doc.id}` ? '...' : 'Verify'}
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Rejection reason (optional):')
                                    handleDocumentAction(doc.id, 'reject', reason || undefined)
                                  }}
                                  disabled={actionLoading === `doc-${doc.id}`}
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {allDocuments.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">No documents uploaded yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
            {tab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="font-semibold text-[#1d1d1f]">Broadcast Notification</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={e => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. System Maintenance Notice"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Message *</label>
                      <textarea
                        required
                        rows={3}
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Your message to users..."
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Target Audience</label>
                      <select
                        value={broadcastRole}
                        onChange={e => setBroadcastRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#C6904D]"
                      >
                        <option value="">All Users</option>
                        <option value="CARRIER">Carriers Only</option>
                        <option value="SUPPLIER">Suppliers Only</option>
                        <option value="YACHT_OWNER">Yacht Owners Only</option>
                        <option value="CREW">Crew Only</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={broadcastSending || !broadcastTitle || !broadcastMessage}
                      className="px-6 py-2.5 bg-[#1d1d1f] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
                    >
                      {broadcastSending ? 'Sending...' : 'Send Notification'}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-semibold text-[#1d1d1f] mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => { setBroadcastTitle('Scheduled Maintenance'); setBroadcastMessage('We will be performing scheduled maintenance. The platform may be briefly unavailable. Thank you for your patience.') }}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-[#1d1d1f]">Maintenance Notice</div>
                      <div className="text-xs text-slate-400 mt-0.5">Notify all users of planned downtime</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('New Feature: Two-Way Routes'); setBroadcastMessage('You can now list space for both outbound and return journeys! List your spare capacity on the way back and earn more from every trip.'); setBroadcastRole('CARRIER') }}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-[#1d1d1f]">Two-Way Routes Update</div>
                      <div className="text-xs text-slate-400 mt-0.5">Tell carriers about return leg listings</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('Verify Your Documents'); setBroadcastMessage('Please ensure your insurance, driving licence, and port access permits are uploaded and up to date. Unverified accounts may have limited access.'); setBroadcastRole('CARRIER') }}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-[#1d1d1f]">Document Reminder</div>
                      <div className="text-xs text-slate-400 mt-0.5">Remind carriers to upload documents</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('Welcome to Onshore Deliver'); setBroadcastMessage('Thanks for joining! Browse available routes, book deliveries, and track your shipments in real-time. Need help? Visit our support page.') }}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-[#1d1d1f]">Welcome Message</div>
                      <div className="text-xs text-slate-400 mt-0.5">Send a welcome to all users</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ ACTIVITY TAB ═══════════════════ */}
            {tab === 'activity' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-[#1d1d1f]">Recent Activity</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {activityFeed.map(item => (
                      <div key={item.id} className="px-6 py-4 hover:bg-slate-50 flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          item.type === 'booking'
                            ? 'bg-blue-50 text-blue-600'
                            : item.type === 'registration'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.type === 'booking' ? 'B' : item.type === 'registration' ? 'U' : 'R'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#1d1d1f]">{item.title}</span>
                            {item.meta && (
                              <span className={`badge border text-xs ${statusColors[item.meta] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {item.meta.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                        </div>
                        <div className="text-xs text-slate-400 shrink-0">{formatDateTime(item.timestamp)}</div>
                      </div>
                    ))}
                    {activityFeed.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">No activity yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
