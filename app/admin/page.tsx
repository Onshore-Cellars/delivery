'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  users: {
    total: number
    carriers: number
    shippers: number
    yachtClients: number
  }
  listings: {
    total: number
    active: number
  }
  bookings: {
    total: number
    pending: number
    confirmed: number
  }
  revenue: {
    total: number
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchStats(token)
  }, [router])

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Yachting Logistics - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/marketplace" className="text-gray-700 hover:text-gray-900">
                Marketplace
              </Link>
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
                <p>Shippers: {stats.users.shippers}</p>
                <p>Yacht Clients: {stats.users.yachtClients}</p>
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
              <p className="text-3xl font-bold text-gray-900">
                €{stats.revenue.total.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Management</h3>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">User Management</h4>
              <p className="text-sm text-gray-600 mb-3">
                View and manage all users on the platform
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                View All Users
              </button>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Listings Management</h4>
              <p className="text-sm text-gray-600 mb-3">
                Monitor and moderate van listings
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                View All Listings
              </button>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Transaction History</h4>
              <p className="text-sm text-gray-600 mb-3">
                View all bookings and transactions
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                View Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
