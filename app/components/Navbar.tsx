'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchCounts = useCallback(async () => {
    if (!token) return
    try {
      const [notifRes, msgRes] = await Promise.all([
        fetch('/api/notifications?limit=1', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (notifRes.ok) {
        const data = await notifRes.json()
        setUnreadNotifs(data.unreadCount || 0)
      }
      if (msgRes.ok) {
        const data = await msgRes.json()
        const total = (data.conversations || []).reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0)
        setUnreadMessages(total)
      }
    } catch {}
  }, [token])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">
                YachtHop
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/marketplace"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Marketplace
            </Link>

            <Link
              href="/tracking"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Track
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === 'CARRIER' && (
                  <Link
                    href="/listings/create"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    List Space
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-2">
                  {/* Messages */}
                  <Link href="/messages" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Messages">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link href="/dashboard" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Notifications">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </Link>

                  {/* Profile */}
                  <Link href="/profile" className="flex items-center gap-2 ml-1">
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-navy-700">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-navy-900 leading-none">{user.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user.role.replace('_', ' ')}</p>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link href="/marketplace" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              Marketplace
            </Link>
            <Link href="/tracking" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              Track Shipment
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/messages" className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Messages
                  {unreadMessages > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadMessages}</span>}
                </Link>
                <Link href="/profile" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                {user.role === 'CARRIER' && (
                  <Link href="/listings/create" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    List Space
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-navy-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="block px-3 py-2 text-sm font-medium text-white bg-navy-800 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
