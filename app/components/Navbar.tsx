'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!token || !active) return
      try {
        const [notifRes, msgRes] = await Promise.all([
          fetch('/api/notifications?limit=1', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!active) return
        if (notifRes.ok) {
          const data = await notifRes.json()
          setUnreadNotifs(data.unreadCount || 0)
        }
        if (msgRes.ok) {
          const data = await msgRes.json()
          const total = (data.conversations || []).reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0)
          setUnreadMessages(total)
        }
      } catch { /* network error — silent */ }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [token])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const close = () => setMobileOpen(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center shadow-sm">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">YachtHop</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/marketplace" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                Marketplace
              </Link>
              <Link href="/tracking" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                Track
              </Link>

              {user ? (
                <>
                  <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                    Dashboard
                  </Link>
                  {user.role === 'CARRIER' && (
                    <Link href="/listings/create" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                      List Space
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                      Admin
                    </Link>
                  )}

                  <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-1.5">
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
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary text-sm !py-2 !px-4 !min-h-0">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -mr-1 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Menu"
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
      </nav>

      {/* Mobile slide-out panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="mobile-menu-overlay absolute inset-0" onClick={close} />

          {/* Panel */}
          <div className="absolute top-0 right-0 w-[280px] h-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
              <span className="text-sm font-bold text-navy-900">Menu</span>
              <button onClick={close} className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-600 active:bg-slate-100 transition-colors" aria-label="Close menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              <Link href="/marketplace" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Marketplace
              </Link>
              <Link href="/tracking" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Track Shipment
              </Link>

              {user ? (
                <>
                  <div className="!mt-4 pt-3 border-t border-slate-100">
                    <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Account</p>
                  </div>
                  <Link href="/dashboard" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link href="/messages" onClick={close} className="flex items-center justify-between px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Messages
                    </span>
                    {unreadMessages > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                    )}
                  </Link>
                  <Link href="/profile" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  {user.role === 'CARRIER' && (
                    <Link href="/listings/create" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      List Space
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="!mt-3 pt-3 border-t border-slate-100" />
                  <Link href="/login" onClick={close} className="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4">
              {user ? (
                <div>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-navy-700">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); close() }}
                    className="w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/register" onClick={close} className="btn-primary w-full text-center text-[15px] !py-3">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
