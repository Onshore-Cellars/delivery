'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const { user, token, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (transparent ? 20 : 8))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

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
  const isTransparentMode = transparent && !scrolled
  const navLinkCls = (href: string) => `px-4 py-2 rounded text-xs font-medium uppercase tracking-wider transition-colors hover:no-underline ${
    isActive(href)
      ? isTransparentMode ? 'bg-[#162E3D]/20 text-white font-semibold' : 'bg-[#162E3D]/10 text-[#F7F9FB]'
      : isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[#162E3D]/10' : 'text-[#9AADB8] hover:text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'
  }`

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent && !scrolled
          ? 'bg-transparent'
          : 'bg-[#0B1F2A]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_0_25px_rgba(0,0,0,0.3)]'
      }`}>
        <div className="site-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
              <Image src="/logo.png" alt="Onshore Deliver" width={36} height={36} className="rounded-sm" />
              <span className={`text-lg font-semibold tracking-wide transition-colors duration-300 ${isTransparentMode ? 'text-white' : 'text-[#F7F9FB]'}`} style={{ fontFamily: 'var(--font-display)' }}>
                ON.SHORE
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/marketplace" className={navLinkCls('/marketplace')}>
                Marketplace
              </Link>
              <Link href="/get-quotes" className={navLinkCls('/get-quotes')}>
                Get Quotes
              </Link>
              <Link href="/tracking" className={navLinkCls('/tracking')}>
                Track
              </Link>
              <Link href="/community" className={navLinkCls('/community')}>
                Community
              </Link>

              {user ? (
                <>
                  <Link href="/dashboard" className={navLinkCls('/dashboard')}>
                    Dashboard
                  </Link>
                  {user.canCarry && (
                    <>
                      <Link href="/listings/create" className={navLinkCls('/listings/create')}>
                        List Space
                      </Link>
                      <Link href="/driver" className={`px-4 py-2 rounded text-xs font-medium uppercase tracking-wider transition-colors hover:no-underline ${isActive('/driver') ? isTransparentMode ? 'bg-[#9ED36A]/100/20 text-green-300' : 'bg-[#9ED36A]/15 text-[#9ED36A]' : isTransparentMode ? 'text-green-300/80 hover:text-green-200 hover:bg-[#162E3D]/10' : 'text-[#9ED36A]/80 hover:text-[#9ED36A] hover:bg-[#162E3D]/[0.06]'}`}>
                        Driver Mode
                      </Link>
                    </>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className={navLinkCls('/admin')}>
                      Admin
                    </Link>
                  )}

                  {/* More dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      onBlur={() => setTimeout(() => setMoreMenuOpen(false), 150)}
                      className={`px-3 py-2 rounded text-xs font-medium uppercase tracking-wider transition-colors ${
                        moreMenuOpen || ['/analytics','/insurance','/disputes','/earnings','/vehicles','/quotes','/reviews'].includes(pathname)
                          ? isTransparentMode ? 'bg-[#162E3D]/20 text-white font-semibold' : 'bg-[#162E3D]/10 text-[#F7F9FB]'
                          : isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[#162E3D]/10' : 'text-[#9AADB8] hover:text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'
                      }`}
                      aria-label="More pages"
                    >
                      More
                      <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {moreMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-[#162E3D] rounded-lg shadow-lg border border-white/[0.08] py-1 z-50">
                        <Link href="/quotes" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">Quotes</Link>
                        <Link href="/analytics" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">Analytics</Link>
                        <Link href="/insurance" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">Insurance</Link>
                        <Link href="/disputes" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">Disputes</Link>
                        {user.canCarry && (
                          <>
                            <Link href="/earnings" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">Earnings</Link>
                            <Link href="/vehicles" className="block px-4 py-2.5 text-sm text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] hover:no-underline">My Vehicles</Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`w-px h-6 mx-2 ${isTransparentMode ? 'bg-[#162E3D]/20' : 'bg-[#162E3D]/10'}`} />

                  {/* Notifications */}
                  <Link href="/notifications" className={`relative p-2 rounded transition-colors ${isTransparentMode ? 'hover:bg-[#162E3D]/10' : 'hover:bg-[#162E3D]/[0.06]'}`} title="Notifications" aria-label="Notifications">
                    <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[#9AADB8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifs > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500/100 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </Link>

                  {/* Messages */}
                  <Link href="/messages" className={`relative p-2 rounded transition-colors ${isTransparentMode ? 'hover:bg-[#162E3D]/10' : 'hover:bg-[#162E3D]/[0.06]'}`} title="Messages" aria-label="Messages">
                    <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[#9AADB8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500/100 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Profile avatar — shows uploaded image or initials */}
                  <Link href="/profile" className="relative p-0.5 hover:no-underline" title={user.name} aria-label={`Profile: ${user.name}`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1E6F8F]/30 flex items-center justify-center ring-2 ring-white/10">
                        <span className="text-xs font-semibold text-[#268CB5]">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>

                  <button
                    onClick={logout}
                    className="px-3 py-2 text-xs font-medium text-[#6B7C86] hover:text-red-400 hover:bg-red-500/100/100/100/10 rounded transition-colors"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <div className={`w-px h-6 mx-2 ${isTransparentMode ? 'bg-[#162E3D]/20' : 'bg-[#162E3D]/10'}`} />
                  <Link href="/login" className={`px-4 py-2 rounded text-sm font-medium transition-colors hover:no-underline ${isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[#162E3D]/10' : 'text-[#9AADB8] hover:text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-[#FF6A2A] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded hover:bg-[#E85A1C] hover:no-underline transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: right side actions */}
            <div className="flex md:hidden items-center gap-2">
              {user && unreadMessages > 0 && (
                <Link href="/messages" className={`relative p-2 rounded ${isTransparentMode ? 'hover:bg-[#162E3D]/10' : 'hover:bg-[#162E3D]/[0.06]'}`} aria-label="Messages">
                  <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[#9AADB8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500/100 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded transition-colors ${isTransparentMode ? 'text-white hover:bg-[#162E3D]/10' : 'text-[#9AADB8] hover:bg-[#162E3D]/[0.06]'}`}
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
          <div className="absolute top-0 right-0 w-full max-w-[320px] h-full bg-[#102535] shadow-2xl animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06]">
              <span className="text-base font-bold text-[#F7F9FB]">Menu</span>
              <button onClick={close} className="p-2 -mr-2 rounded text-[#6B7C86] hover:text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] transition-colors" aria-label="Close menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link href="/marketplace" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/marketplace') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                <TabIcon icon="search" className={isActive('/marketplace') ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                Marketplace
              </Link>
              <Link href="/get-quotes" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/get-quotes') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                <svg className={`w-5 h-5 ${isActive('/get-quotes') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Get Quotes
              </Link>
              <Link href="/tracking" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/tracking') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                <TabIcon icon="location" className={isActive('/tracking') ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                Track Shipment
              </Link>
              <Link href="/community" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/community') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                <svg className={`w-5 h-5 ${isActive('/community') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Community
              </Link>

              {user ? (
                <>
                  <div className="pt-4 pb-2 px-4">
                    <p className="text-[11px] font-semibold text-[#6B7C86] uppercase tracking-widest">Account</p>
                  </div>
                  <Link href="/dashboard" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/dashboard') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <TabIcon icon="grid" className={isActive('/dashboard') ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                    Dashboard
                  </Link>
                  <Link href="/messages" onClick={close} className={`flex items-center justify-between px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/messages') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <span className="flex items-center gap-3.5">
                      <TabIcon icon="chat" className={isActive('/messages') ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                      Messages
                    </span>
                    {unreadMessages > 0 && (
                      <span className="min-w-[22px] h-[22px] rounded-full bg-red-500/100 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/profile') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <TabIcon icon="user" className={isActive('/profile') ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                    Profile
                  </Link>
                  <Link href="/quotes" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/quotes') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <svg className={`w-5 h-5 ${isActive('/quotes') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Quotes
                  </Link>
                  <Link href="/notifications" onClick={close} className={`flex items-center justify-between px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/notifications') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <span className="flex items-center gap-3.5">
                      <svg className={`w-5 h-5 ${isActive('/notifications') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      Notifications
                    </span>
                    {unreadNotifs > 0 && (
                      <span className="min-w-[22px] h-[22px] rounded-full bg-red-500/100 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </Link>
                  {user.canCarry && (
                    <>
                    <Link href="/listings/create" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/listings/create') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                      <svg className={`w-5 h-5 ${isActive('/listings/create') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                      </svg>
                      List Space
                    </Link>
                    <Link href="/vehicles" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/vehicles') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                      <svg className={`w-5 h-5 ${isActive('/vehicles') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 4h4m5 4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2zm-3 0v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2" /></svg>
                      My Vehicles
                    </Link>
                    <Link href="/earnings" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/earnings') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                      <svg className={`w-5 h-5 ${isActive('/earnings') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Earnings
                    </Link>
                    </>
                  )}
                  <Link href="/disputes" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/disputes') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <svg className={`w-5 h-5 ${isActive('/disputes') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    Disputes
                  </Link>
                  <Link href="/analytics" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/analytics') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <svg className={`w-5 h-5 ${isActive('/analytics') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Analytics
                  </Link>
                  <Link href="/insurance" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/insurance') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                    <svg className={`w-5 h-5 ${isActive('/insurance') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Insurance
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" onClick={close} className={`flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium transition-colors hover:no-underline ${isActive('/admin') ? 'bg-[#1E6F8F]/15 text-[#268CB5]' : 'text-[#F7F9FB] hover:bg-[#162E3D]/[0.06]'}`}>
                      <svg className={`w-5 h-5 ${isActive('/admin') ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <Link href="/login" onClick={close} className="flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium text-[#F7F9FB] hover:bg-[#162E3D]/[0.06] transition-colors hover:no-underline">
                    <TabIcon icon="login" className="text-[#6B7C86]" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] p-4 safe-bottom">
              {user ? (
                <div>
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-[#162E3D]/[0.06] rounded">
                    <div className="w-10 h-10 rounded-full bg-[#1E6F8F]/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#F7F9FB]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F7F9FB] truncate">{user.name}</p>
                      <p className="text-xs text-[#6B7C86] truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); close() }}
                    className="w-full px-4 py-3 text-sm font-semibold text-red-400 rounded hover:bg-red-500/100/100/10 transition-colors text-left"
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
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0B1F2A]/90 backdrop-blur-xl border-t border-white/[0.06] safe-bottom">
        <div className="flex items-center justify-around px-2 h-16">
          {bottomTabs.map(tab => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded transition-colors hover:no-underline min-w-[64px] ${
                  active ? 'text-[#268CB5]' : 'text-[#6B7C86]'
                }`}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <TabIcon icon={tab.icon} className={active ? 'text-[#268CB5]' : 'text-[#6B7C86]'} />
                  {'badge' in tab && tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] rounded-full bg-red-500/100 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${active ? 'text-[#268CB5]' : 'text-[#6B7C86]'}`}>
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
