'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

interface Stats {
  users: { total: number; carriers: number; suppliers: number; yachtOwners: number }
  listings: { total: number; active: number }
  bookings: { total: number; pending: number; confirmed: number }
  revenue: { total: number }
}

interface RecentBooking {
  id: string
  totalPrice: number
  status: string
  createdAt: string
  shipper: { name: string; company?: string }
  listing: { title: string; originPort: string; destinationPort: string }
}

interface RecentUser {
  id: string
  name: string
  email: string
  role: string
  company?: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  PICKED_UP: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'users' | 'bookings'>('overview')

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentBookings(data.recentBookings || [])
        setRecentUsers(data.recentUsers || [])
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

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatCurrency = (amount: number) => `\u20AC${amount.toFixed(2)}`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Admin Panel</h1>
            <p className="text-slate-500 mt-1">Platform management and analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
          {['overview', 'users', 'bookings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-500 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="loading-shimmer h-32 rounded-xl" />)}
          </div>
        ) : (
          <>
            {tab === 'overview' && stats && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
                    <div className="mt-2 text-3xl font-extrabold text-navy-900">{stats.users.total}</div>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span>{stats.users.carriers} carriers</span>
                      <span>{stats.users.suppliers} suppliers</span>
                      <span>{stats.users.yachtOwners} owners</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Listings</div>
                    <div className="mt-2 text-3xl font-extrabold text-navy-900">{stats.listings.total}</div>
                    <div className="mt-2 text-xs text-slate-500">{stats.listings.active} active</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bookings</div>
                    <div className="mt-2 text-3xl font-extrabold text-navy-900">{stats.bookings.total}</div>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span>{stats.bookings.pending} pending</span>
                      <span>{stats.bookings.confirmed} confirmed</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue</div>
                    <div className="mt-2 text-3xl font-extrabold text-navy-900">{formatCurrency(stats.revenue.total)}</div>
                    <div className="mt-2 text-xs text-slate-500">Total platform revenue</div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-navy-900">Recent Bookings</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {recentBookings.map(b => (
                      <div key={b.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace('_', ' ')}</span>
                            <span className="text-sm font-medium text-navy-900">{b.listing.title}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {b.shipper.name} &middot; {b.listing.originPort} &rarr; {b.listing.destinationPort}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-navy-900">{formatCurrency(b.totalPrice)}</div>
                          <div className="text-xs text-slate-400">{formatDate(b.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    {recentBookings.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">No bookings yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-navy-900">All Users</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-6 py-3 font-medium text-slate-500">Name</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Role</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Company</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-navy-900">{u.name}</td>
                          <td className="px-6 py-3 text-slate-600">{u.email}</td>
                          <td className="px-6 py-3">
                            <span className="badge bg-navy-50 text-navy-700 border border-navy-200">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600">{u.company || '-'}</td>
                          <td className="px-6 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-navy-900">All Bookings</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {recentBookings.map(b => (
                    <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge border ${statusColors[b.status] || ''}`}>{b.status.replace('_', ' ')}</span>
                          <span className="font-medium text-navy-900">{b.listing.title}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Shipper: {b.shipper.name}{b.shipper.company && ` (${b.shipper.company})`} &middot;
                          {b.listing.originPort} &rarr; {b.listing.destinationPort}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-navy-900">{formatCurrency(b.totalPrice)}</div>
                        <div className="text-xs text-slate-400">{formatDate(b.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  {recentBookings.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">No bookings yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
