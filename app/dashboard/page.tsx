'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user] = useState<User | null>(() => {
    // Initialize user from localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings'>('overview')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token || !user) {
      router.push('/login')
    }
  }, [router, user])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (!user) {
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
              <h1 className="text-xl font-bold text-gray-900">Yachting Logistics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-gray-700 hover:text-gray-900">
                Marketplace
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                  Admin
                </Link>
              )}
              <span className="text-gray-500">|</span>
              <span className="text-gray-700">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h2>
          <p className="text-gray-600 mt-2">
            Account Type: <span className="font-semibold">{user.role.replace('_', ' ')}</span>
            {user.company && (
              <> | Company: <span className="font-semibold">{user.company}</span></>
            )}
          </p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            {user.role === 'CARRIER' && (
              <button
                onClick={() => setActiveTab('listings')}
                className={`${
                  activeTab === 'listings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Listings
              </button>
            )}
            {(user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Bookings
              </button>
            )}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/marketplace"
                  className="block w-full px-4 py-2 text-center border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Browse Marketplace
                </Link>
                {user.role === 'CARRIER' && (
                  <button className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create New Listing
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Info</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {user.role.replace('_', ' ')}
                  </dd>
                </div>
                {user.company && (
                  <div>
                    <dt className="text-sm text-gray-500">Company</dt>
                    <dd className="text-sm font-medium text-gray-900">{user.company}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {user.role === 'CARRIER' && (
                  <>
                    <li>✓ Account created successfully</li>
                    <li>→ Create your first van listing</li>
                    <li>→ Manage bookings</li>
                  </>
                )}
                {(user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
                  <>
                    <li>✓ Account created successfully</li>
                    <li>→ Browse available routes</li>
                    <li>→ Book space for your deliveries</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'listings' && user.role === 'CARRIER' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Listings</h3>
            <p className="text-gray-600">
              You haven&apos;t created any listings yet. Create your first listing to start offering van space.
            </p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create New Listing
            </button>
          </div>
        )}

        {activeTab === 'bookings' && (user.role === 'SHIPPER' || user.role === 'YACHT_CLIENT') && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h3>
            <p className="text-gray-600">
              You haven&apos;t made any bookings yet. Browse the marketplace to find available van space.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
