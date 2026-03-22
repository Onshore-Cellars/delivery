'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  linkUrl?: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/notifications${filter === 'unread' ? '?unread=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ markAllRead: true }),
      })
      fetchNotifications()
    } catch { /* ignore */ }
  }

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  const typeIcon: Record<string, string> = {
    BOOKING_CREATED: 'New booking',
    BOOKING_CONFIRMED: 'Confirmed',
    BOOKING_STATUS_UPDATE: 'Status update',
    BOOKING_CANCELLED: 'Cancelled',
    PAYMENT_RECEIVED: 'Payment',
    PAYMENT_FAILED: 'Payment failed',
    BID_RECEIVED: 'New bid',
    BID_ACCEPTED: 'Bid accepted',
    QUOTE_REQUESTED: 'Quote request',
    QUOTE_RECEIVED: 'Quote received',
    MESSAGE_RECEIVED: 'Message',
    REVIEW_RECEIVED: 'Review',
    DOCUMENT_VERIFIED: 'Document verified',
    DOCUMENT_REJECTED: 'Document rejected',
    SYSTEM: 'System',
  }

  if (authLoading) return <div className="min-h-screen bg-[#faf9f7]" />
  if (!user) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <p className="text-slate-500">Please <Link href="/login" className="text-[#C6904D]">sign in</Link></p>
    </div>
  )

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div id="main-content" className="min-h-screen bg-[#faf9f7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'var(--font-display)' }}>Notifications</h1>
            {unreadCount > 0 && <p className="text-xs text-slate-400 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 border border-[#e8e4de] rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-white transition-colors">
              Mark all read
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e8e4de] text-[#1a1a1a] hover:bg-[#faf9f7]'}`}>
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-lg border border-[#e8e4de] animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-[#e8e4de]">
            <p className="text-slate-500">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => { if (!n.read) markRead(n.id) }}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${n.read ? 'bg-white border-[#e8e4de]' : 'bg-amber-50/50 border-[#C6904D]/20'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#C6904D] flex-shrink-0" />}
                      <span className="text-xs text-slate-400 font-medium">{typeIcon[n.type] || n.type}</span>
                    </div>
                    <div className="text-sm font-medium text-[#1a1a1a]">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
                    {n.linkUrl && (
                      <Link href={n.linkUrl} className="text-xs text-[#C6904D] font-medium hover:underline whitespace-nowrap"
                        onClick={e => e.stopPropagation()}>View</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
