'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface User {
  id: string; email: string; name: string; role: string; phone?: string; company?: string; createdAt: string
  _count: { listings: number; bookings: number; reviewsGiven: number; reviewsReceived: number }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', company: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setProfileForm({ name: data.user.name || '', phone: data.user.phone || '', company: data.user.company || '' })
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(''); setError(''); setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Profile updated successfully')
      // Update localStorage user data
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          localStorage.setItem('user', JSON.stringify({ ...u, ...data.user }))
        } catch { /* ignore */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(''); setError(''); setSaving(true)
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match'); setSaving(false); return
    }
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h2>
        <p className="text-gray-600 mb-8">Manage your account settings</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-gray-900">{user._count.listings}</p>
            <p className="text-sm text-gray-500">Listings</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-gray-900">{user._count.bookings}</p>
            <p className="text-sm text-gray-500">Bookings</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-gray-900">{user._count.reviewsGiven}</p>
            <p className="text-sm text-gray-500">Reviews Given</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-gray-900">{user._count.reviewsReceived}</p>
            <p className="text-sm text-gray-500">Reviews Received</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => { setActiveTab('profile'); setMessage(''); setError('') }}
              className={`${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Edit Profile
            </button>
            <button onClick={() => { setActiveTab('password'); setMessage(''); setError('') }}
              className={`${activeTab === 'password' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Change Password
            </button>
          </nav>
        </div>

        {message && <div className="mb-4 rounded-md bg-green-50 p-4"><p className="text-sm text-green-800">{message}</p></div>}
        {error && <div className="mb-4 rounded-md bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" disabled value={user.email}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input type="text" disabled value={user.role}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" required value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input type="text" value={profileForm.company}
                  onChange={e => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your Company" />
              </div>
              <div className="flex items-center space-x-4">
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <span className="text-sm text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input type="password" required value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" required minLength={6} value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type="password" required minLength={6} value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
