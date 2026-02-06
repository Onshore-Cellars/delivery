'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  users: { total: number; carriers: number; customers: number }
  listings: { total: number; active: number }
  bookings: { total: number; pending: number; confirmed: number }
  revenue: { total: number }
}

interface AdminUser {
  id: string; email: string; name: string; role: string; company?: string; createdAt: string
  _count: { listings: number; bookings: number }
}

interface RecentBooking {
  id: string; totalPrice: number; status: string; createdAt: string
  listing: { originAddress: string; destinationAddress: string; carrier: { name: string } }
  shipper: { name: string; email: string }
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'stats' | 'users' | 'bookings'>('stats')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { router.push('/login'); return }
    let user
    try {
      user = JSON.parse(userData)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
      return
    }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return }
    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setRecentBookings(data.recentBookings || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
      }
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">VanShare</Link>
              <span className="ml-3 text-sm text-gray-500">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/marketplace" className="text-gray-700 hover:text-gray-900">Marketplace</Link>
              <button onClick={handleLogout} className="text-sm text-blue-600 hover:text-blue-800">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Carriers: {stats.users.carriers}</p>
                <p>Customers: {stats.users.customers}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Listings</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.listings.total}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Active: {stats.listings.active}</p>
                <p>Inactive: {stats.listings.total - stats.listings.active}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bookings</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.bookings.total}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Pending: {stats.bookings.pending}</p>
                <p>Confirmed: {stats.bookings.confirmed}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">EUR {stats.revenue.total.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button onClick={() => setActiveView('stats')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeView === 'stats' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            Recent Bookings
          </button>
          <button onClick={() => setActiveView('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeView === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            All Users ({users.length})
          </button>
        </div>

        {activeView === 'stats' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            </div>
            {recentBookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No bookings yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{b.listing.originAddress} &rarr; {b.listing.destinationAddress}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{b.shipper.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{b.listing.carrier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">EUR {b.totalPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-gray-100">{b.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeView === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{u.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{u.role}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.company || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u._count.listings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u._count.bookings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
