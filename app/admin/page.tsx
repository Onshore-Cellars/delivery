'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import AdminCRM from '../components/AdminCRM'

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
  trackingCode?: string
  cargoDescription?: string
  weightKg?: number
  volumeM3?: number
  pickupAddress?: string
  deliveryAddress?: string
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
  suspended?: boolean
  canCarry?: boolean
  canShip?: boolean
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

interface AIInsights {
  highlights: string[]
  anomalies: string[]
  recommendations: string[]
}

type TabKey = 'overview' | 'users' | 'bookings' | 'listings' | 'documents' | 'notifications' | 'activity' | 'crm' | 'settings'

// ─── Constants ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  QUOTE_REQUESTED: 'bg-purple-50 text-purple-700 border-purple-200',
  QUOTED: 'bg-violet-50 text-violet-700 border-violet-200',
  PENDING: 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PICKED_UP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CUSTOMS_HOLD: 'bg-orange-50 text-orange-700 border-orange-200',
  DELIVERED: 'bg-[#102535] text-[#9AADB8] border-white/[0.08]',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-200',
  DISPUTED: 'bg-rose-50 text-rose-700 border-rose-200',
}

const listingStatusColors: Record<string, string> = {
  DRAFT: 'bg-[#102535] text-[#9AADB8] border-white/[0.08]',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FULL: 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-[#102535] text-[#9AADB8] border-white/[0.08]',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-200',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
  FAILED: 'bg-red-500/10 text-red-400 border-red-200',
}

const TAB_CONFIG: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'bookings', label: 'Bookings', icon: 'bookings' },
  { key: 'listings', label: 'Listings', icon: 'listings' },
  { key: 'documents', label: 'Documents', icon: 'documents' },
  { key: 'notifications', label: 'Broadcast', icon: 'notifications' },
  { key: 'activity', label: 'Activity', icon: 'activity' },
  { key: 'crm', label: 'CRM', icon: 'crm' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
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
    case 'crm':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
    case 'settings':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editUserForm, setEditUserForm] = useState<Record<string, unknown>>({})
  const [editListing, setEditListing] = useState<AdminListing | null>(null)
  const [editListingForm, setEditListingForm] = useState<Record<string, unknown>>({})
  const [editBooking, setEditBooking] = useState<RecentBooking | null>(null)
  const [editBookingForm, setEditBookingForm] = useState<Record<string, unknown>>({})
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)

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

  const fetchAIInsights = async () => {
    if (!token) return
    setAiInsightsLoading(true)
    try {
      const res = await fetch('/api/ai/admin-insights', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch AI insights')
      const data = await res.json()
      setAiInsights(data)
    } catch {
      showToast('Failed to generate AI insights', 'error')
    } finally {
      setAiInsightsLoading(false)
    }
  }

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [statsRes, usersRes, listingsRes, docsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/listings?all=true&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/documents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setAllBookings(data.bookings || [])
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

  // ─── Edit User ──────────────────────────────────────────────────────────

  const handleEditUser = async () => {
    if (!token || !editUser) return
    setActionLoading(`edit-${editUser.id}`)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: editUser.id, updates: editUserForm }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(prev => prev.map(u => u.id === editUser.id ? { ...data.user, _count: data.user._count } : u))
        showToast('User updated successfully')
        setEditUser(null)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update user', 'error')
      }
    } catch { showToast('Network error', 'error') }
    finally { setActionLoading(null) }
  }

  // ─── Edit Listing ──────────────────────────────────────────────────────────

  const handleEditListing = async () => {
    if (!token || !editListing) return
    setActionLoading(`edit-listing-${editListing.id}`)
    try {
      const res = await fetch(`/api/listings/${editListing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editListingForm),
      })
      if (res.ok) {
        const data = await res.json()
        setAllListings(prev => prev.map(l => l.id === editListing.id ? { ...l, ...data.listing || data } : l))
        showToast('Listing updated successfully')
        setEditListing(null)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update listing', 'error')
      }
    } catch { showToast('Network error', 'error') }
    finally { setActionLoading(null) }
  }

  // ─── Edit Booking ──────────────────────────────────────────────────────────

  const handleEditBooking = async () => {
    if (!token || !editBooking) return
    setActionLoading(`edit-booking-${editBooking.id}`)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: editBooking.id, updates: editBookingForm }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllBookings(prev => prev.map(b => b.id === editBooking.id ? { ...b, ...data.booking || data } : b))
        showToast('Booking updated successfully')
        setEditBooking(null)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update booking', 'error')
      }
    } catch { showToast('Network error', 'error') }
    finally { setActionLoading(null) }
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
            <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1">Administration</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F7F9FB] tracking-[-0.02em]">Admin Panel</h1>
            <p className="text-sm text-[#6B7C86] mt-1">Platform management and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users, bookings, listings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full sm:w-72 rounded-xl border border-white/[0.08] bg-[#162E3D] text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 mb-8">
          <div className="flex gap-1 bg-[#162E3D] rounded-xl p-1 shadow-sm border border-white/[0.06] w-fit min-w-full sm:min-w-0">
          {TAB_CONFIG.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                tab === t.key
                  ? 'bg-[#1d1d1f] text-white shadow-sm'
                  : 'text-[#6B7C86] hover:text-[#F7F9FB] hover:bg-[#162E3D]'
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
                {/* AI Insights */}
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F7F9FB]">AI Insights</h3>
                      <p className="text-xs text-[#6B7C86] mt-0.5">AI-powered analysis of platform data</p>
                    </div>
                    <button
                      onClick={fetchAIInsights}
                      disabled={aiInsightsLoading}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-[#0071e3] text-white hover:bg-[#0077ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {aiInsightsLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Generating…
                        </>
                      ) : (
                        'Generate AI Insights'
                      )}
                    </button>
                  </div>

                  {aiInsights && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <h4 className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Highlights</h4>
                        <ul className="space-y-2">
                          {aiInsights.highlights.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#9AADB8]">
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <h4 className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Anomalies</h4>
                        <ul className="space-y-2">
                          {aiInsights.anomalies.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#9AADB8]">
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-[#FF6A2A]/100 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <h4 className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                          {aiInsights.recommendations.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#9AADB8]">
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-[#0071e3] shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider">Total Revenue</div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-bold">&euro;</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#F7F9FB]">{formatCurrency(stats.revenue.total)}</div>
                    <div className="mt-2 text-xs text-[#6B7C86]">Platform lifetime revenue</div>
                  </div>
                  <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider">Active Listings</div>
                      <div className="w-8 h-8 rounded-lg bg-[#102535] flex items-center justify-center text-[#9AADB8] text-sm font-bold">#</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#F7F9FB]">{stats.listings.active}</div>
                    <div className="mt-2 text-xs text-[#6B7C86]">{stats.listings.total} total listings</div>
                  </div>
                  <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider">Pending Bookings</div>
                      <div className="w-8 h-8 rounded-lg bg-[#FF6A2A]/10 flex items-center justify-center text-[#FF6A2A] text-sm font-bold">!</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#F7F9FB]">{stats.bookings.pending}</div>
                    <div className="mt-2 text-xs text-[#6B7C86]">{stats.bookings.confirmed} confirmed &middot; {stats.bookings.total} total</div>
                  </div>
                  <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#6B7C86] uppercase tracking-wider">New Users (This Week)</div>
                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 text-sm font-bold">+</div>
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[#F7F9FB]">{newUsersThisWeek}</div>
                    <div className="mt-2 text-xs text-[#6B7C86]">{stats.users.total} total users</div>
                  </div>
                </div>

                {/* Platform Health */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Two-Way Listings', value: stats.listings.twoWay || 0, color: 'text-[#FF6A2A]' },
                    { label: 'MMSI Bookings', value: stats.bookings.withMMSI || 0, color: 'text-[#9AADB8]' },
                    { label: 'Return Leg Bookings', value: stats.bookings.returnLegs || 0, color: 'text-violet-600' },
                    { label: 'In Transit', value: stats.bookings.inTransit || 0, color: 'text-cyan-600' },
                    { label: 'Pending Docs', value: stats.documents?.pending || 0, color: 'text-[#FF6A2A]' },
                    { label: 'Vehicles', value: stats.vehicles?.total || 0, color: 'text-[#9AADB8]' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-4 text-center">
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] text-[#6B7C86] font-medium uppercase tracking-wider mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Row: Revenue Chart + Breakdown Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Bar Chart */}
                  <div className="lg:col-span-2 bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-6">
                    <h2 className="font-semibold text-[#F7F9FB] mb-4">Revenue by Month</h2>
                    {revenueByMonth.length === 0 ? (
                      <div className="text-center text-[#6B7C86] text-sm py-12">No revenue data yet</div>
                    ) : (
                      <div className="flex items-end gap-3 h-48">
                        {revenueByMonth.map((m, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="text-xs font-medium text-[#F7F9FB]">{formatCurrency(m.total)}</div>
                            <div className="w-full relative flex items-end" style={{ height: '140px' }}>
                              <div
                                className="w-full rounded-t-lg transition-all duration-500"
                                style={{
                                  height: `${Math.max(m.pct, 4)}%`,
                                  background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a8e 100%)',
                                }}
                              />
                            </div>
                            <div className="text-xs text-[#6B7C86]">{m.month}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Breakdowns */}
                  <div className="space-y-4">
                    {/* Users by Role */}
                    <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                      <h3 className="text-sm font-semibold text-[#F7F9FB] mb-3">Users by Role</h3>
                      <div className="space-y-2">
                        {Object.entries(usersByRole).map(([role, count]) => (
                          <div key={role} className="flex items-center justify-between">
                            <span className="text-xs text-[#9AADB8]">{role.replace('_', ' ')}</span>
                            <span className="text-xs font-semibold text-[#F7F9FB] bg-[#102535] px-2 py-0.5 rounded-full">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bookings by Status */}
                    <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-5">
                      <h3 className="text-sm font-semibold text-[#F7F9FB] mb-3">Bookings by Status</h3>
                      <div className="space-y-2">
                        {Object.entries(bookingsByStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[status] || 'bg-[#102535] text-[#9AADB8] border-white/[0.08]'}`}>
                              {status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold text-[#F7F9FB]">{count}</span>
                          </div>
                        ))}
                        {Object.keys(bookingsByStatus).length === 0 && (
                          <div className="text-xs text-[#6B7C86]">No bookings yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings (on Overview) */}
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h2 className="font-semibold text-[#F7F9FB]">Recent Bookings</h2>
                    <button
                      onClick={() => setTab('bookings')}
                      className="text-xs text-[#F7F9FB] hover:text-[#F7F9FB] font-medium"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {allBookings.slice(0, 5).map(b => (
                      <div key={b.id} className="px-6 py-3 flex items-center justify-between hover:bg-[#162E3D]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium text-[#F7F9FB]">{b.listing.title}</span>
                          </div>
                          <div className="text-xs text-[#6B7C86] mt-0.5">
                            {b.shipper.name} &middot; {b.listing.originPort} &rarr; {b.listing.destinationPort}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#F7F9FB]">{formatCurrency(b.totalPrice)}</div>
                          <div className="text-xs text-[#6B7C86]">{formatDate(b.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    {allBookings.length === 0 && (
                      <div className="p-8 text-center text-[#6B7C86] text-sm">No bookings yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ USERS TAB ═══════════════════ */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#F7F9FB]">All Users ({filteredUsers.length})</h2>
                  <button
                    onClick={() => exportCSV('users')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#102535] text-left">
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Name</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Email</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Role</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Company</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Status</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Listings</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Bookings</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Joined</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-[#162E3D]">
                            <td className="px-6 py-3 font-medium text-[#F7F9FB]">{u.name}</td>
                            <td className="px-6 py-3 text-[#9AADB8]">{u.email}</td>
                            <td className="px-6 py-3">
                              <span className="badge bg-[#102535] text-[#F7F9FB] border border-white/[0.08]">
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-[#9AADB8]">{u.company || '-'}</td>
                            <td className="px-6 py-3">
                              {u.verified ? (
                                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                              ) : (
                                <span className="badge bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#FF6A2A]/20">Unverified</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-[#9AADB8] text-center">{u._count.listings}</td>
                            <td className="px-6 py-3 text-[#9AADB8] text-center">{u._count.bookings}</td>
                            <td className="px-6 py-3 text-[#6B7C86]">{formatDate(u.createdAt)}</td>
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
                                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-400 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `${u.id}-suspend` ? '...' : 'Suspend'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditUser(u)
                                      setEditUserForm({ name: u.name, email: u.email, phone: u.phone || '', company: u.company || '', role: u.role, verified: u.verified, suspended: u.suspended || false, canCarry: u.canCarry || false, canShip: u.canShip || false })
                                    }}
                                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-[#6B7C86] text-sm">
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
                  <h2 className="font-semibold text-[#F7F9FB]">All Bookings ({filteredBookings.length})</h2>
                  <button
                    onClick={() => exportCSV('bookings')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {filteredBookings.map(b => (
                      <div key={b.id} className="px-6 py-4 hover:bg-[#162E3D]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace(/_/g, ' ')}</span>
                              {b.paymentStatus && (
                                <span className={`badge border ${paymentStatusColors[b.paymentStatus] || ''}`}>
                                  Pay: {b.paymentStatus}
                                </span>
                              )}
                              <span className="font-medium text-[#F7F9FB]">{b.listing.title}</span>
                            </div>
                            <div className="text-xs text-[#6B7C86]">
                              Shipper: {b.shipper.name}{b.shipper.company && ` (${b.shipper.company})`} &middot;
                              {b.listing.originPort} &rarr; {b.listing.destinationPort}
                            </div>
                            <div className="text-xs text-[#6B7C86] mt-0.5">
                              ID: {b.id.slice(0, 12)}... &middot; {formatDateTime(b.createdAt)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold text-[#F7F9FB]">{formatCurrency(b.totalPrice)}</div>
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
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
                                >
                                  In Transit
                                </button>
                              )}
                              {b.status === 'IN_TRANSIT' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'DELIVERED')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-[#102535] text-[#9AADB8] border border-white/[0.08] hover:bg-slate-200 disabled:opacity-50"
                                >
                                  Delivered
                                </button>
                              )}
                              {b.status !== 'CANCELLED' && b.status !== 'DELIVERED' && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, 'CANCELLED')}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-400 border border-red-200 hover:bg-red-100 disabled:opacity-50"
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
                              <button
                                onClick={() => {
                                  setEditBooking(b)
                                  setEditBookingForm({ status: b.status, paymentStatus: b.paymentStatus, totalPrice: b.totalPrice, cargoDescription: b.cargoDescription || '', weightKg: b.weightKg || '', volumeM3: b.volumeM3 || '', pickupAddress: b.pickupAddress || '', deliveryAddress: b.deliveryAddress || '', deliveryNotes: '', adminNotes: '' })
                                }}
                                className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredBookings.length === 0 && (
                      <div className="p-8 text-center text-[#6B7C86] text-sm">
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
                  <h2 className="font-semibold text-[#F7F9FB]">All Listings ({filteredListings.length})</h2>
                  <button
                    onClick={() => exportCSV('listings')}
                    className="px-4 py-2 bg-[#1d1d1f] text-white text-xs font-medium rounded-lg hover:bg-[#1d1d1f] transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#102535] text-left">
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Title</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Route</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Carrier</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Status</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Departure</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Capacity</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Bookings</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Featured</th>
                          <th className="px-6 py-3 font-medium text-[#6B7C86]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredListings.map(l => (
                          <tr key={l.id} className="hover:bg-[#162E3D]">
                            <td className="px-6 py-3 font-medium text-[#F7F9FB] max-w-[200px] truncate">{l.title}</td>
                            <td className="px-6 py-3 text-[#9AADB8] text-xs">
                              {l.originPort} &rarr; {l.destinationPort}
                            </td>
                            <td className="px-6 py-3 text-[#9AADB8]">{l.carrier?.name || '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`badge border ${listingStatusColors[l.status] || 'bg-[#102535] text-[#9AADB8] border-white/[0.08]'}`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-[#6B7C86] text-xs">{l.departureDate ? formatDate(l.departureDate) : '-'}</td>
                            <td className="px-6 py-3 text-[#9AADB8] text-xs">
                              {l.availableKg?.toLocaleString() || '?'} / {l.totalCapacityKg?.toLocaleString() || '?'} kg
                            </td>
                            <td className="px-6 py-3 text-[#9AADB8] text-center">{l._count?.bookings || 0}</td>
                            <td className="px-6 py-3">
                              {l.featured ? (
                                <span className="badge bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#FF6A2A]/20">Featured</span>
                              ) : (
                                <span className="text-xs text-[#6B7C86]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleToggleFeatured(l.id, l.featured)}
                                  disabled={actionLoading === `listing-${l.id}`}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                                    l.featured
                                      ? 'bg-[#102535] text-[#9AADB8] border-white/[0.08] hover:bg-[#162E3D]'
                                      : 'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20 hover:bg-[#FF6A2A]/15'
                                  }`}
                                >
                                  {actionLoading === `listing-${l.id}` ? '...' : l.featured ? 'Unfeature' : 'Feature'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditListing(l)
                                    setEditListingForm({ title: l.title, status: l.status, featured: l.featured, originPort: l.originPort, destinationPort: l.destinationPort, departureDate: l.departureDate ? l.departureDate.slice(0, 10) : '', totalCapacityKg: l.totalCapacityKg || '', availableKg: l.availableKg || '', pricePerKg: l.pricePerKg || '', pricePerM3: '', flatRate: l.flatRate || '', currency: 'EUR', biddingEnabled: false })
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredListings.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-[#6B7C86] text-sm">
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
                  <h2 className="font-semibold text-[#F7F9FB]">Document Verification ({allDocuments.length})</h2>
                </div>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {allDocuments.map(doc => (
                      <div key={doc.id} className="px-6 py-4 hover:bg-[#162E3D]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`badge border ${
                                doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-200' :
                                doc.status === 'EXPIRED' ? 'bg-[#102535] text-[#9AADB8] border-white/[0.08]' :
                                'bg-[#FF6A2A]/10 text-[#FF6A2A] border-[#FF6A2A]/20'
                              }`}>{doc.status}</span>
                              <span className="badge bg-[#102535] text-[#F7F9FB] border border-white/[0.08]">
                                {doc.type.replace(/_/g, ' ')}
                              </span>
                              <span className="font-medium text-[#F7F9FB]">{doc.name}</span>
                            </div>
                            <div className="text-xs text-[#6B7C86]">
                              {doc.user.name} ({doc.user.email})
                              {doc.user.company && ` \u2014 ${doc.user.company}`}
                              {' \u2014 '}{doc.user.role.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-[#6B7C86] mt-0.5">
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
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 border border-red-200 hover:bg-red-100 disabled:opacity-50"
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
                      <div className="p-8 text-center text-[#6B7C86] text-sm">No documents uploaded yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
            {tab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="font-semibold text-[#F7F9FB]">Broadcast Notification</h2>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-6">
                  <form onSubmit={handleBroadcast} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={e => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. System Maintenance Notice"
                        className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Message *</label>
                      <textarea
                        required
                        rows={3}
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Your message to users..."
                        className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Target Audience</label>
                      <select
                        value={broadcastRole}
                        onChange={e => setBroadcastRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F]"
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

                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] p-6">
                  <h3 className="font-semibold text-[#F7F9FB] mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => { setBroadcastTitle('Scheduled Maintenance'); setBroadcastMessage('We will be performing scheduled maintenance. The platform may be briefly unavailable. Thank you for your patience.') }}
                      className="text-left p-3 rounded-lg border border-white/[0.08] hover:bg-[#162E3D] transition-colors"
                    >
                      <div className="text-sm font-medium text-[#F7F9FB]">Maintenance Notice</div>
                      <div className="text-xs text-[#6B7C86] mt-0.5">Notify all users of planned downtime</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('New Feature: Two-Way Routes'); setBroadcastMessage('You can now list space for both outbound and return journeys! List your spare capacity on the way back and earn more from every trip.'); setBroadcastRole('CARRIER') }}
                      className="text-left p-3 rounded-lg border border-white/[0.08] hover:bg-[#162E3D] transition-colors"
                    >
                      <div className="text-sm font-medium text-[#F7F9FB]">Two-Way Routes Update</div>
                      <div className="text-xs text-[#6B7C86] mt-0.5">Tell carriers about return leg listings</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('Verify Your Documents'); setBroadcastMessage('Please ensure your insurance, driving licence, and port access permits are uploaded and up to date. Unverified accounts may have limited access.'); setBroadcastRole('CARRIER') }}
                      className="text-left p-3 rounded-lg border border-white/[0.08] hover:bg-[#162E3D] transition-colors"
                    >
                      <div className="text-sm font-medium text-[#F7F9FB]">Document Reminder</div>
                      <div className="text-xs text-[#6B7C86] mt-0.5">Remind carriers to upload documents</div>
                    </button>
                    <button
                      onClick={() => { setBroadcastTitle('Welcome to Onshore Deliver'); setBroadcastMessage('Thanks for joining! Browse available routes, book deliveries, and track your shipments in real-time. Need help? Visit our support page.') }}
                      className="text-left p-3 rounded-lg border border-white/[0.08] hover:bg-[#162E3D] transition-colors"
                    >
                      <div className="text-sm font-medium text-[#F7F9FB]">Welcome Message</div>
                      <div className="text-xs text-[#6B7C86] mt-0.5">Send a welcome to all users</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ ACTIVITY TAB ═══════════════════ */}
            {tab === 'activity' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-[#F7F9FB]">Recent Activity</h2>
                <div className="bg-[#162E3D] rounded-xl shadow-sm border border-white/[0.06] overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {activityFeed.map(item => (
                      <div key={item.id} className="px-6 py-4 hover:bg-[#162E3D] flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          item.type === 'booking'
                            ? 'bg-indigo-50 text-indigo-600'
                            : item.type === 'registration'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-[#FF6A2A]/10 text-[#FF6A2A]'
                        }`}>
                          {item.type === 'booking' ? 'B' : item.type === 'registration' ? 'U' : 'R'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#F7F9FB]">{item.title}</span>
                            {item.meta && (
                              <span className={`badge border text-xs ${statusColors[item.meta] || 'bg-[#102535] text-[#9AADB8] border-white/[0.08]'}`}>
                                {item.meta.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#6B7C86] mt-0.5">{item.description}</div>
                        </div>
                        <div className="text-xs text-[#6B7C86] shrink-0">{formatDateTime(item.timestamp)}</div>
                      </div>
                    ))}
                    {activityFeed.length === 0 && (
                      <div className="p-8 text-center text-[#6B7C86] text-sm">No activity yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── CRM TAB ─── */}
        {tab === 'crm' && token && (
          <AdminCRM token={token} />
        )}

        {/* ─── SETTINGS TAB ─── */}
        {tab === 'settings' && (
          <div className="space-y-6">
            {/* Platform Settings */}
            <div className="bg-[#162E3D] rounded-2xl border border-white/[0.08] shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#F7F9FB] mb-1">Platform Settings</h3>
              <p className="text-xs text-[#6B7C86] mb-6">Manage platform configuration and email templates.</p>

              <div className="space-y-6">
                {/* Company Info */}
                <div>
                  <h4 className="text-sm font-semibold text-[#F7F9FB] mb-3">Company Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6B7C86] mb-1">Company Name</label>
                      <input type="text" defaultValue="Onshore Deliver" className="w-full px-3 py-2 rounded-lg border border-white/[0.08] text-sm" readOnly />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7C86] mb-1">Support Email</label>
                      <input type="text" defaultValue="info@onshoredelivery.com" className="w-full px-3 py-2 rounded-lg border border-white/[0.08] text-sm" readOnly />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7C86] mb-1">Platform Fee (%)</label>
                      <input type="text" defaultValue="10%" className="w-full px-3 py-2 rounded-lg border border-white/[0.08] text-sm" readOnly />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6B7C86] mb-1">Default Currency</label>
                      <input type="text" defaultValue="EUR" className="w-full px-3 py-2 rounded-lg border border-white/[0.08] text-sm" readOnly />
                    </div>
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="border-t border-white/[0.06] pt-6">
                  <h4 className="text-sm font-semibold text-[#F7F9FB] mb-3">Cancellation Policy</h4>
                  <div className="bg-[#102535] rounded-xl p-4 text-sm text-[#9AADB8] space-y-1.5">
                    <div className="flex justify-between"><span>More than 7 days before departure</span><span className="font-semibold text-[#9ED36A]">No fee</span></div>
                    <div className="flex justify-between"><span>3-7 days before departure</span><span className="font-semibold text-[#FF6A2A]">10% fee</span></div>
                    <div className="flex justify-between"><span>1-3 days before departure</span><span className="font-semibold text-orange-700">25% fee</span></div>
                    <div className="flex justify-between"><span>Less than 24 hours</span><span className="font-semibold text-red-400">50% fee</span></div>
                  </div>
                </div>

                {/* Email Templates */}
                <div className="border-t border-white/[0.06] pt-6">
                  <h4 className="text-sm font-semibold text-[#F7F9FB] mb-3">Email Templates</h4>
                  <p className="text-xs text-[#6B7C86] mb-4">These templates are sent automatically for platform events.</p>
                  <div className="space-y-2">
                    {[
                      { name: 'Welcome Email', trigger: 'On user registration', status: 'Active' },
                      { name: 'Email Verification', trigger: 'On registration (non-admin)', status: 'Active' },
                      { name: 'Password Reset', trigger: 'On forgot password request', status: 'Active' },
                      { name: 'Booking Confirmation', trigger: 'On new booking creation', status: 'Active' },
                      { name: 'Status Update', trigger: 'On booking status change', status: 'Active' },
                      { name: 'New Message', trigger: 'On new message received', status: 'Active' },
                      { name: 'Bid Received', trigger: 'On bid placed on listing', status: 'Active' },
                      { name: 'Quote Request', trigger: 'On quote request received', status: 'Active' },
                      { name: 'Quote Response', trigger: 'On quote responded to', status: 'Active' },
                      { name: 'Delivery Confirmation', trigger: 'On booking delivered', status: 'Active' },
                      { name: 'Payment Receipt', trigger: 'On payment processed', status: 'Active' },
                      { name: 'Carrier Payout', trigger: 'On payout sent to carrier', status: 'Active' },
                      { name: 'Document Status', trigger: 'On document verified/rejected', status: 'Active' },
                    ].map(t => (
                      <div key={t.name} className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#102535] hover:bg-[#162E3D] transition-colors">
                        <div>
                          <span className="text-sm font-medium text-[#F7F9FB]">{t.name}</span>
                          <span className="text-xs text-[#6B7C86] ml-2">{t.trigger}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#9ED36A]/10 text-[#9ED36A] border border-[#9ED36A]/20">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Types */}
                <div className="border-t border-white/[0.06] pt-6">
                  <h4 className="text-sm font-semibold text-[#F7F9FB] mb-3">Notification Events</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Booking Created', 'Booking Confirmed', 'Status Update', 'Booking Cancelled',
                      'Bid Received', 'Bid Accepted', 'Bid Rejected',
                      'Quote Requested', 'Quote Received',
                      'Message Received', 'Payment Received', 'Payment Failed',
                      'Review Received', 'Listing Expiring',
                      'Document Verified', 'Document Rejected',
                      'Route Started', 'ETA Update', 'Driver Arrived', 'Return Route Available',
                    ].map(n => (
                      <div key={n} className="px-3 py-2 rounded-lg bg-[#102535] text-xs font-medium text-[#9AADB8]">{n}</div>
                    ))}
                  </div>
                </div>

                {/* Admin Accounts */}
                <div className="border-t border-white/[0.06] pt-6">
                  <h4 className="text-sm font-semibold text-[#F7F9FB] mb-3">Admin Access</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#102535]">
                      <div>
                        <span className="text-sm font-medium text-[#F7F9FB]">edward@onshorecellars.com</span>
                        <span className="text-xs text-[#6B7C86] ml-2">Primary Admin</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#C6904D]/20">ADMIN</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#102535]">
                      <div>
                        <span className="text-sm font-medium text-[#F7F9FB]">info@onshoredelivery.com</span>
                        <span className="text-xs text-[#6B7C86] ml-2">Support Admin</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6A2A]/10 text-[#FF6A2A] border border-[#C6904D]/20">ADMIN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════ EDIT USER MODAL ═══════════════════ */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative bg-[#162E3D] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#F7F9FB]">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="p-1 rounded-lg hover:bg-[#162E3D]">
                <svg className="w-5 h-5 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Name</label>
                <input type="text" value={editUserForm.name as string || ''} onChange={e => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Email</label>
                <input type="email" value={editUserForm.email as string || ''} onChange={e => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Phone</label>
                <input type="text" value={editUserForm.phone as string || ''} onChange={e => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Company</label>
                <input type="text" value={editUserForm.company as string || ''} onChange={e => setEditUserForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Role</label>
                <select value={editUserForm.role as string || ''} onChange={e => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10">
                  <option value="CARRIER">Carrier</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="YACHT_OWNER">Yacht Owner</option>
                  <option value="CREW">Crew</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Verified</label>
                <button type="button" onClick={() => setEditUserForm(prev => ({ ...prev, verified: !prev.verified }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editUserForm.verified ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editUserForm.verified ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Suspended</label>
                <button type="button" onClick={() => setEditUserForm(prev => ({ ...prev, suspended: !prev.suspended }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editUserForm.suspended ? 'bg-red-500/100' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editUserForm.suspended ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Can Carry</label>
                <button type="button" onClick={() => setEditUserForm(prev => ({ ...prev, canCarry: !prev.canCarry }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editUserForm.canCarry ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editUserForm.canCarry ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Can Ship</label>
                <button type="button" onClick={() => setEditUserForm(prev => ({ ...prev, canShip: !prev.canShip }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editUserForm.canShip ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editUserForm.canShip ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
              <button onClick={() => setEditUser(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-[#9AADB8] hover:bg-[#162E3D]">Cancel</button>
              <button onClick={handleEditUser} disabled={!!actionLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EDIT LISTING MODAL ═══════════════════ */}
      {editListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditListing(null)} />
          <div className="relative bg-[#162E3D] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#F7F9FB]">Edit Listing</h3>
              <button onClick={() => setEditListing(null)} className="p-1 rounded-lg hover:bg-[#162E3D]">
                <svg className="w-5 h-5 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Title</label>
                <input type="text" value={editListingForm.title as string || ''} onChange={e => setEditListingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Status</label>
                <select value={editListingForm.status as string || ''} onChange={e => setEditListingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10">
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="FULL">Full</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Featured</label>
                <button type="button" onClick={() => setEditListingForm(prev => ({ ...prev, featured: !prev.featured }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editListingForm.featured ? 'bg-[#FF6A2A]/100' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editListingForm.featured ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Origin Port</label>
                <input type="text" value={editListingForm.originPort as string || ''} onChange={e => setEditListingForm(prev => ({ ...prev, originPort: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Destination Port</label>
                <input type="text" value={editListingForm.destinationPort as string || ''} onChange={e => setEditListingForm(prev => ({ ...prev, destinationPort: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Departure Date</label>
                <input type="date" value={editListingForm.departureDate as string || ''} onChange={e => setEditListingForm(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Total Capacity (kg)</label>
                  <input type="number" value={editListingForm.totalCapacityKg as number || ''} onChange={e => setEditListingForm(prev => ({ ...prev, totalCapacityKg: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Available (kg)</label>
                  <input type="number" value={editListingForm.availableKg as number || ''} onChange={e => setEditListingForm(prev => ({ ...prev, availableKg: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Price/kg</label>
                  <input type="number" step="0.01" value={editListingForm.pricePerKg as number || ''} onChange={e => setEditListingForm(prev => ({ ...prev, pricePerKg: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Price/m3</label>
                  <input type="number" step="0.01" value={editListingForm.pricePerM3 as number || ''} onChange={e => setEditListingForm(prev => ({ ...prev, pricePerM3: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Flat Rate</label>
                  <input type="number" step="0.01" value={editListingForm.flatRate as number || ''} onChange={e => setEditListingForm(prev => ({ ...prev, flatRate: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Currency</label>
                <select value={editListingForm.currency as string || 'EUR'} onChange={e => setEditListingForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F7F9FB]">Bidding Enabled</label>
                <button type="button" onClick={() => setEditListingForm(prev => ({ ...prev, biddingEnabled: !prev.biddingEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editListingForm.biddingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#162E3D] rounded-full shadow transition-transform ${editListingForm.biddingEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
              <button onClick={() => setEditListing(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-[#9AADB8] hover:bg-[#162E3D]">Cancel</button>
              <button onClick={handleEditListing} disabled={!!actionLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EDIT BOOKING MODAL ═══════════════════ */}
      {editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditBooking(null)} />
          <div className="relative bg-[#162E3D] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#F7F9FB]">Edit Booking</h3>
              <button onClick={() => setEditBooking(null)} className="p-1 rounded-lg hover:bg-[#162E3D]">
                <svg className="w-5 h-5 text-[#6B7C86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Status</label>
                <select value={editBookingForm.status as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10">
                  <option value="QUOTE_REQUESTED">Quote Requested</option>
                  <option value="QUOTED">Quoted</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="CUSTOMS_HOLD">Customs Hold</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Payment Status</label>
                <select value={editBookingForm.paymentStatus as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10">
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Total Price</label>
                <input type="number" step="0.01" value={editBookingForm.totalPrice as number || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, totalPrice: e.target.value ? Number(e.target.value) : '' }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Cargo Description</label>
                <textarea rows={2} value={editBookingForm.cargoDescription as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, cargoDescription: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Weight (kg)</label>
                  <input type="number" step="0.01" value={editBookingForm.weightKg as number || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, weightKg: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Volume (m3)</label>
                  <input type="number" step="0.01" value={editBookingForm.volumeM3 as number || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, volumeM3: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Pickup Address</label>
                <input type="text" value={editBookingForm.pickupAddress as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Delivery Address</label>
                <input type="text" value={editBookingForm.deliveryAddress as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Delivery Notes</label>
                <textarea rows={2} value={editBookingForm.deliveryNotes as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Admin Notes</label>
                <textarea rows={2} value={editBookingForm.adminNotes as string || ''} onChange={e => setEditBookingForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] text-sm outline-none focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
              <button onClick={() => setEditBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-[#9AADB8] hover:bg-[#162E3D]">Cancel</button>
              <button onClick={handleEditBooking} disabled={!!actionLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
