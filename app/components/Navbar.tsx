'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'

// Pure presentational icon — defined at module scope so it isn't recreated on
// every render (React would otherwise remount it and reset its subtree).
function TabIcon({ icon, className = '' }: { icon: string; className?: string }) {
  const cls = `w-5 h-5 ${className}`
  switch (icon) {
    case 'search': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    case 'grid': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    case 'chat': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    case 'user': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    case 'location': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    case 'login': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
    case 'clipboard': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    case 'users': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    case 'bell': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    case 'plus': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>
    case 'truck': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
    case 'van': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 4h4m5 4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2zm-3 0v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2" /></svg>
    case 'coins': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    case 'warn': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
    case 'chart': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    case 'shield': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    case 'repeat': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    case 'star': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    case 'help': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    case 'cog': return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    default: return null
  }
}

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

  // Zoho-style grouped menu for the slide-in drawer: collapsible sections,
  // one open at a time, with the section containing the current page expanded.
  type MenuItem = { href: string; label: string; icon: string; badge?: number }
  type MenuGroup = { key: string; label: string; items: MenuItem[] }
  const menuGroups: MenuGroup[] = [
    {
      key: 'explore', label: 'Explore', items: [
        { href: '/marketplace', label: 'Marketplace', icon: 'search' },
        { href: '/get-quotes', label: 'Get Quotes', icon: 'clipboard' },
        { href: '/tracking', label: 'Track Shipment', icon: 'location' },
        { href: '/community', label: 'Community', icon: 'users' },
      ],
    },
    ...(user ? [
      {
        key: 'shipping', label: 'Shipping', items: [
          { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
          { href: '/quotes', label: 'My Quotes', icon: 'clipboard' },
          { href: '/recurring', label: 'Recurring', icon: 'repeat' },
          { href: '/disputes', label: 'Disputes', icon: 'warn' },
          { href: '/insurance', label: 'Insurance', icon: 'shield' },
          { href: '/bills', label: 'Bills', icon: 'clipboard' },
        ],
      },
      ...(user.canCarry ? [{
        key: 'carrier', label: 'Carrier', items: [
          { href: '/driver', label: 'Driver Mode', icon: 'truck' },
          { href: '/listings/create', label: 'List Space', icon: 'plus' },
          { href: '/vehicles', label: 'My Vehicles', icon: 'van' },
          { href: '/earnings', label: 'Earnings', icon: 'coins' },
        ],
      }] : []),
      {
        key: 'account', label: 'Account', items: [
          { href: '/profile', label: 'Profile', icon: 'user' },
          { href: '/messages', label: 'Messages', icon: 'chat', badge: unreadMessages },
          { href: '/notifications', label: 'Notifications', icon: 'bell', badge: unreadNotifs },
          { href: '/analytics', label: 'Analytics', icon: 'chart' },
          { href: '/reviews', label: 'Reviews', icon: 'star' },
          { href: '/help', label: 'Help & Support', icon: 'help' },
        ],
      },
      ...(user.role === 'ADMIN' ? [{
        key: 'admin', label: 'Admin', items: [
          { href: '/admin', label: 'Admin Console', icon: 'cog' },
        ],
      }] : []),
    ] : []),
  ]

  const [openGroup, setOpenGroup] = useState<string | null>(null)
  // When the drawer opens, expand the section containing the current page.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const current = menuGroups.find(g => g.items.some(i => i.href === pathname))
    setOpenGroup(current?.key || menuGroups[0]?.key || null)
    // menuGroups is rebuilt each render from user/pathname — deps below cover it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileMenuOpen, pathname])

  const isTransparentMode = transparent && !scrolled
  const navLinkCls = (href: string) => `px-4 py-2 rounded text-xs font-medium uppercase tracking-wider transition-colors hover:no-underline ${
    isActive(href)
      ? isTransparentMode ? 'bg-[var(--c-surface)]/20 text-white font-semibold' : 'bg-[var(--c-surface)]/10 text-[var(--c-ink)]'
      : isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[var(--c-surface)]/10' : 'text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06]'
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

  return (
    <>
      {/* ---- TOP NAVBAR (Desktop: full nav, Mobile: logo + actions) ---- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent && !scrolled
          ? 'bg-transparent'
          : 'bg-[var(--c-canvas)]/95 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_1px_18px_rgba(18,48,44,0.06)]'
      }`}>
        <div className="site-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo — The Waypoint mark + Onshore wordmark */}
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline" aria-label="Onshore home">
              <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
                <line x1="16" y1="62" x2="84" y2="62" stroke={isTransparentMode ? '#F5F2EC' : '#0C5C54'} strokeWidth="7" strokeLinecap="round" />
                <circle cx="50" cy="41" r="9" fill="#A8813C" />
              </svg>
              <span className={`text-[19px] font-semibold tracking-[-0.01em] ${isTransparentMode ? 'text-white' : 'text-[var(--c-ink)]'}`}>Onshore</span>
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
                      <Link href="/driver" className={`px-4 py-2 rounded text-xs font-medium uppercase tracking-wider transition-colors hover:no-underline ${isActive('/driver') ? isTransparentMode ? 'bg-[var(--c-success)]/20 text-[var(--c-success)]' : 'bg-[var(--c-success)]/15 text-[var(--c-success)]' : isTransparentMode ? 'text-[var(--c-success)]/80 hover:text-[var(--c-success)] hover:bg-[var(--c-surface)]/10' : 'text-[var(--c-success)]/80 hover:text-[var(--c-success)] hover:bg-[var(--c-surface)]/[0.06]'}`}>
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
                        moreMenuOpen || ['/analytics','/insurance','/disputes','/earnings','/vehicles','/quotes','/reviews','/bills'].includes(pathname)
                          ? isTransparentMode ? 'bg-[var(--c-surface)]/20 text-white font-semibold' : 'bg-[var(--c-surface)]/10 text-[var(--c-ink)]'
                          : isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[var(--c-surface)]/10' : 'text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06]'
                      }`}
                      aria-label="More pages"
                    >
                      More
                      <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {moreMenuOpen && (
                      <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--c-surface)] rounded-lg shadow-lg border border-black/[0.08] py-2 z-50">
                        <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-3)]">Shipping</p>
                        <Link href="/quotes" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">My Quotes</Link>
                        <Link href="/recurring" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Recurring</Link>
                        <Link href="/disputes" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Disputes</Link>
                        <Link href="/insurance" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Insurance</Link>
                        <Link href="/bills" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Bills</Link>
                        {user.canCarry && (
                          <>
                            <p className="px-4 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-3)] border-t border-black/[0.06] mt-1.5">Carrier</p>
                            <Link href="/earnings" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Earnings</Link>
                            <Link href="/vehicles" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">My Vehicles</Link>
                          </>
                        )}
                        <p className="px-4 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--c-text-3)] border-t border-black/[0.06] mt-1.5">Insights</p>
                        <Link href="/analytics" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Analytics</Link>
                        <Link href="/reviews" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Reviews</Link>
                        <Link href="/help" className="block px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] hover:no-underline">Help & Support</Link>
                      </div>
                    )}
                  </div>

                  <div className={`w-px h-6 mx-2 ${isTransparentMode ? 'bg-[var(--c-surface)]/20' : 'bg-[var(--c-surface)]/10'}`} />

                  {/* Notifications */}
                  <Link href="/notifications" className={`relative p-2 rounded transition-colors ${isTransparentMode ? 'hover:bg-[var(--c-surface)]/10' : 'hover:bg-[var(--c-surface)]/[0.06]'}`} title="Notifications" aria-label="Notifications">
                    <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[var(--c-text-2)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifs > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--c-error)] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                      </span>
                    )}
                  </Link>

                  {/* Messages */}
                  <Link href="/messages" className={`relative p-2 rounded transition-colors ${isTransparentMode ? 'hover:bg-[var(--c-surface)]/10' : 'hover:bg-[var(--c-surface)]/[0.06]'}`} title="Messages" aria-label="Messages">
                    <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[var(--c-text-2)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessages > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--c-error)] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Profile avatar — shows uploaded image or initials */}
                  <Link href="/profile" className="relative p-0.5 hover:no-underline" title={user.name} aria-label={`Profile: ${user.name}`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--c-brand)]/30 flex items-center justify-center ring-2 ring-white/10">
                        <span className="text-xs font-semibold text-[var(--c-info)]">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>

                  <button
                    onClick={logout}
                    className="px-3 py-2 text-xs font-medium text-[var(--c-text-3)] hover:text-[var(--c-error)] hover:bg-[var(--c-error)]/10 rounded transition-colors"
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
                  <div className={`w-px h-6 mx-2 ${isTransparentMode ? 'bg-[var(--c-surface)]/20' : 'bg-[var(--c-surface)]/10'}`} />
                  <Link href="/login" className={`px-4 py-2 rounded text-sm font-medium transition-colors hover:no-underline ${isTransparentMode ? 'text-white hover:text-white/80 hover:bg-[var(--c-surface)]/10' : 'text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06]'}`}>
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-[var(--c-accent)] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded hover:bg-[var(--c-accent-hover)] hover:no-underline transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: right side actions */}
            <div className="flex md:hidden items-center gap-2">
              {user && unreadMessages > 0 && (
                <Link href="/messages" className={`relative p-2 rounded ${isTransparentMode ? 'hover:bg-[var(--c-surface)]/10' : 'hover:bg-[var(--c-surface)]/[0.06]'}`} aria-label="Messages">
                  <svg className={`w-5 h-5 ${isTransparentMode ? 'text-white' : 'text-[var(--c-text-2)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-[var(--c-error)] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded transition-colors ${isTransparentMode ? 'text-white hover:bg-[var(--c-surface)]/10' : 'text-[var(--c-text-2)] hover:bg-[var(--c-surface)]/[0.06]'}`}
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
          <div className="absolute top-0 right-0 w-full max-w-[320px] h-full bg-[var(--c-canvas-2)] shadow-2xl animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-black/[0.06]">
              <span className="text-base font-bold text-[var(--c-ink)]">Menu</span>
              <button onClick={close} className="p-2 -mr-2 rounded text-[var(--c-text-3)] hover:text-[var(--c-ink)] hover:bg-[var(--c-canvas-2)] transition-colors" aria-label="Close menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links — Zoho-style collapsible groups */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {menuGroups.map(group => {
                const open = openGroup === group.key
                const hasActive = group.items.some(i => isActive(i.href))
                const groupBadge = group.items.reduce((s, i) => s + (i.badge || 0), 0)
                return (
                  <div key={group.key}>
                    <button
                      onClick={() => setOpenGroup(open ? null : group.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded text-[13px] font-semibold uppercase tracking-widest transition-colors ${
                        hasActive ? 'text-[var(--c-info)]' : 'text-[var(--c-text-3)] hover:text-[var(--c-ink)]'
                      }`}
                      aria-expanded={open}
                    >
                      <span className="flex items-center gap-2">
                        {group.label}
                        {!open && groupBadge > 0 && (
                          <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--c-error)] text-white text-[10px] font-bold flex items-center justify-center px-1 normal-case tracking-normal">
                            {groupBadge > 9 ? '9+' : groupBadge}
                          </span>
                        )}
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {open && (
                      <div className="pb-2 space-y-0.5">
                        {group.items.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className={`flex items-center justify-between px-4 py-3 rounded text-[15px] font-medium transition-colors hover:no-underline ${
                              isActive(item.href) ? 'bg-[var(--c-brand)]/15 text-[var(--c-info)]' : 'text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06]'
                            }`}
                          >
                            <span className="flex items-center gap-3.5">
                              <TabIcon icon={item.icon} className={isActive(item.href) ? 'text-[var(--c-info)]' : 'text-[var(--c-text-3)]'} />
                              {item.label}
                            </span>
                            {(item.badge || 0) > 0 && (
                              <span className="min-w-[22px] h-[22px] rounded-full bg-[var(--c-error)] text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                                {item.badge! > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {!user && (
                <>
                  <div className="pt-3" />
                  <Link href="/login" onClick={close} className="flex items-center gap-3.5 px-4 py-3.5 rounded text-[15px] font-medium text-[var(--c-ink)] hover:bg-[var(--c-surface)]/[0.06] transition-colors hover:no-underline">
                    <TabIcon icon="login" className="text-[var(--c-text-3)]" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-black/[0.06] p-4 safe-bottom">
              {user ? (
                <div>
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-[var(--c-surface)]/[0.06] rounded">
                    <div className="w-10 h-10 rounded-full bg-[var(--c-brand)]/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-[var(--c-ink)]">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--c-ink)] truncate">{user.name}</p>
                      <p className="text-xs text-[var(--c-text-3)] truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); close() }}
                    className="w-full px-4 py-3 text-sm font-semibold text-[var(--c-error)] rounded hover:bg-[var(--c-error)]/10 transition-colors text-left"
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
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--c-canvas)]/90 backdrop-blur-xl border-t border-black/[0.06] safe-bottom">
        <div className="flex items-center justify-around px-2 h-16">
          {bottomTabs.map(tab => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded transition-colors hover:no-underline min-w-[64px] ${
                  active ? 'text-[var(--c-info)]' : 'text-[var(--c-text-3)]'
                }`}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <TabIcon icon={tab.icon} className={active ? 'text-[var(--c-info)]' : 'text-[var(--c-text-3)]'} />
                  {'badge' in tab && tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[14px] h-[14px] rounded-full bg-[var(--c-error)] text-white text-[8px] font-bold flex items-center justify-center leading-none">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${active ? 'text-[var(--c-info)]' : 'text-[var(--c-text-3)]'}`}>
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
