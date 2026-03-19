'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      } catch { /* network error */ }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [token])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const close = () => setMobileMenuOpen(false)
  const isActive = (href: string) => pathname === href

  // Bottom tab items for mobile
  const bottomTabs = user ? [
    { href: '/marketplace', label: 'Explore', icon: 'search' },
    { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { href: '/messages', label: 'Messages', icon: 'chat', badge: unreadMessages },
    { href: '/profile', label: 'Profile', icon: 'user' },
  ] : [
    { href: '/marketplace', label: 'Explore', icon: 'search' },
    { href: '/tracking', label: 'Track', icon: 'location' },
    { href: '/login', label: 'Sign In', icon: 'login' },
  ]

  const TabIcon = ({ icon, className = '' }: { icon: string; className?: string }) => {
    const cls = `w-5 h-5 ${className}`
    switch (icon) {
      case 'search': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      case 'grid': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      case 'chat': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      case 'user': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      case 'location': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      case 'login': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
      default: return null
    }
  }

  return (
    <>
      {/* ---- TOP NAVBAR (Desktop: full nav, Mobile: logo + actions) ---- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center">
                <span className="text-white text-sm font-bold">O</span>
              </div>
              <span className="text-lg font-bold text-[#0f172a] tracking-tight">Onshore</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/marketplace" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${isActive('/marketplace') ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50'}`}>
                Marketplace
              </Link>
              <Link href="/tracking" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${isActive('/tracking') ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50'}`}>
                Track
              </Link>

              {user ? (
                <>
                  <Link href="/dashboard" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${isActive('/dashboard') ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50'}`}>
                    Dashboard
                  </Link>
                  {user.role === 'CARRIER' && (
                    <Link href="/listings/create" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${isActive('/listings/create') ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50'}`}>
                      List Space
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${isActive('/admin') ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-50'}`}>
                      Admin
                    </Link>
                  )}

                  <div className="w-px h-6 bg-slate-200 mx-2" />

                  {/* Messages */}
                  <Link href="/messages" className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors" title="Messages">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link href="/dashboard" className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors" title="Notifications">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifs > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </Link>

                  {/* Profile */}
                  <Link href="/profile" className="flex items-center gap-2.5 ml-1 pl-2 hover:no-underline">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white">
                      <span className="text-xs font-semibold text-[#0f172a]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-[#0f172a] leading-tight">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.role.replace('_', ' ')}</p>
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    className="ml-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="w-px h-6 bg-slate-200 mx-2" />
                  <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-[#0f172a] hover:bg-slate-50 transition-colors hover:no-underline">
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-[#2563eb] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1d4ed8] hover:no-underline transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: right side actions */}
            <div className="flex md:hidden items-center gap-2">
              {user && unreadMessages > 0 && (
                <Link href="/messages" className="relative p-2 rounded-xl hover:bg-slate-50">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ---- MOBILE FULL-SCREEN MENU ---- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="mobile-menu-overlay absolute inset-0" onClick={close} />
          <div className="absolute top-0 right-0 w-full max-w-[320px] h-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-slate-100">
              <span className="text-base font-bold text-[#0f172a]">Menu</span>
              <button onClick={close} className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-[#0f172a] hover:bg-slate-50 transition-colors" aria-label="Close menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link href="/marketplace" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/marketplace') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                <TabIcon icon="search" className={isActive('/marketplace') ? 'text-[#2563eb]' : 'text-slate-400'} />
                Marketplace
              </Link>
              <Link href="/tracking" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/tracking') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                <TabIcon icon="location" className={isActive('/tracking') ? 'text-[#2563eb]' : 'text-slate-400'} />
                Track Shipment
              </Link>

              {user ? (
                <>
                  <div className="pt-4 pb-2 px-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Account</p>
                  </div>
                  <Link href="/dashboard" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/dashboard') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                    <TabIcon icon="grid" className={isActive('/dashboard') ? 'text-[#2563eb]' : 'text-slate-400'} />
                    Dashboard
                  </Link>
                  <Link href="/messages" onClick={close} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/messages') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                    <span className="flex items-center gap-3.5">
                      <TabIcon icon="chat" className={isActive('/messages') ? 'text-[#2563eb]' : 'text-slate-400'} />
                      Messages
                    </span>
                    {unreadMessages > 0 && (
                      <span className="min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/profile') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                    <TabIcon icon="user" className={isActive('/profile') ? 'text-[#2563eb]' : 'text-slate-400'} />
                    Profile
                  </Link>
                  {user.role === 'CARRIER' && (
                    <Link href="/listings/create" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/listings/create') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                      <svg className={`w-5 h-5 ${isActive('/listings/create') ? 'text-[#2563eb]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                      </svg>
                      List Space
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors hover:no-underline ${isActive('/admin') ? 'bg-blue-50 text-[#2563eb]' : 'text-[#0f172a] hover:bg-slate-50'}`}>
                      <svg className={`w-5 h-5 ${isActive('/admin') ? 'text-[#2563eb]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="pt-3" />
                  <Link href="/login" onClick={close} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15px] font-medium text-[#0f172a] hover:bg-slate-50 transition-colors hover:no-underline">
                    <TabIcon icon="login" className="text-slate-400" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 safe-bottom">
              {user ? (
                <div>
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); close() }}
                    className="w-full px-4 py-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/register" onClick={close} className="btn-primary w-full text-center !text-[15px]">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- MOBILE BOTTOM TAB BAR ---- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200/80 safe-bottom">
        <div className="flex items-center justify-around px-2 h-16">
          {bottomTabs.map(tab => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors hover:no-underline min-w-[64px] ${
                  active ? 'text-[#2563eb]' : 'text-slate-400'
                }`}
              >
                <div className="relative">
                  <TabIcon icon={tab.icon} className={active ? 'text-[#2563eb]' : 'text-slate-400'} />
                  {'badge' in tab && tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-[#2563eb]' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
