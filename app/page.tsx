'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from './components/AuthProvider'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-white">
      {/* ─── FIXED NAV ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="site-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
              <Image src="/logo.png" alt="Onshore Deliver" width={32} height={32} className="rounded-sm" />
              <span className={`text-lg font-semibold tracking-wide transition-colors duration-300 ${scrolled ? 'text-[#1a1a1a]' : 'text-white'}`} style={{ fontFamily: 'var(--font-display)' }}>
                Onshore
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/get-quotes', label: 'Get Quotes' },
                { href: '/tracking', label: 'Tracking' },
                { href: '/about', label: 'About' },
                { href: '/help', label: 'Support' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors hover:no-underline ${
                    scrolled
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className={`w-px h-5 mx-2 ${scrolled ? 'bg-slate-200' : 'bg-white/20'}`} />

              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-[#C6904D] text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-[#b07d3f] hover:no-underline transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors hover:no-underline ${
                      scrolled
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[#C6904D] text-white text-sm font-semibold px-5 py-2.5 rounded hover:bg-[#b07d3f] hover:no-underline transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2.5 -mr-2 rounded transition-colors ${
                scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 w-full max-w-[300px] h-full bg-white shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
              <span className="text-base font-bold text-slate-900">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="p-3 space-y-0.5">
              {[
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/get-quotes', label: 'Get Quotes' },
                { href: '/tracking', label: 'Tracking' },
                { href: '/about', label: 'About' },
                { href: '/help', label: 'Support' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3.5 rounded text-[15px] font-medium text-slate-700 hover:bg-slate-50 hover:no-underline transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100 safe-bottom bg-white">
              {user ? (
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-primary w-full text-center !text-[15px]">
                  Dashboard
                </Link>
              ) : (
                <div className="space-y-2.5">
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full text-center !text-[15px]">
                    Get Started
                  </Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full text-center !text-[15px]">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2520] to-[#1a1a1a] overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C6904D]/10 rounded-full blur-[120px]" />

        <div className="relative site-container pt-36 sm:pt-48 pb-24 sm:pb-32">
          {/* Eyebrow */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.07] border border-white/10 mb-10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Now serving 50+ ports</span>
          </div>

          <h1 className="animate-fade-up text-[1.75rem] sm:text-[2.75rem] md:text-[3.5rem] leading-[1.1] font-light text-white tracking-wide max-w-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            One van, not five.{' '}
            <span className="gradient-text">Smarter deliveries.</span>
          </h1>

          <p className="animate-fade-up mt-6 text-[15px] sm:text-lg text-slate-400 max-w-lg leading-relaxed" style={{ animationDelay: '80ms' }}>
            Stop sending five vans to the same yacht. Consolidate deliveries, book return legs, and get last-minute orders to your vessel or shipyard &mdash; fast.
          </p>

          <div className="animate-fade-up mt-10 flex flex-col sm:flex-row gap-4" style={{ animationDelay: '160ms' }}>
            <Link href="/marketplace" className="btn-primary text-[15px] sm:text-base !px-7">
              Find Available Space
            </Link>
            <Link href="/listings/create" className="btn-outline text-[15px] sm:text-base">
              List Your Van Space
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fade-up mt-16 sm:mt-20 flex gap-8 sm:gap-12" style={{ animationDelay: '240ms' }}>
            {[
              { value: '200+', label: 'Active carriers' },
              { value: '98%', label: 'On-time rate' },
              { value: '4.9', label: 'Avg rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT DO YOU NEED ─── */}
      <section className="bg-white">
        <div className="site-container py-20 sm:py-28">
          <div className="mb-12 sm:mb-16">
            <h2 className="text-[1.5rem] sm:text-[2.25rem] font-light text-[#1a1a1a] tracking-wide leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              What do you need?
            </h2>
            <p className="mt-2 text-[15px] sm:text-lg text-slate-500">
              Whether you&apos;re shipping or filling spare capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/marketplace" className="group block rounded-lg border-2 border-slate-200 bg-white p-7 sm:p-9 hover:no-underline hover:border-[#C6904D]/40 hover:shadow-xl hover:shadow-[#C6904D]/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#C6904D] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">I need a delivery</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Find carriers heading to your port. Ship provisions, equipment, wine, or supplies to any marina.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#C6904D] text-sm font-semibold group-hover:gap-2.5 transition-all">
                Browse routes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-lg border-2 border-slate-200 bg-white p-7 sm:p-9 hover:no-underline hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">I have van space</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Already heading to a port? List your spare capacity and earn on routes you&apos;re running.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#C6904D] text-sm font-semibold group-hover:gap-2.5 transition-all">
                List space
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-[#faf9f7] border-y border-[#e8e4de]/60">
        <div className="site-container py-20 sm:py-28">
          <div className="mb-12 sm:mb-16">
            <h2 className="text-[1.5rem] sm:text-[2.25rem] font-light text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              How it works
            </h2>
            <p className="mt-2 text-[15px] sm:text-lg text-slate-500">
              Book cargo space in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { num: '1', title: 'Find a route', desc: 'Search by port, date, and cargo type. See real-time availability across the Med.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { num: '2', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { num: '3', title: 'Delivered dockside', desc: 'Track in real-time. Your goods arrive direct to the marina berth.', icon: 'M5 13l4 4L19 7' },
            ].map(step => (
              <div key={step.num} className="bg-white rounded-lg border border-slate-200 p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#C6904D]">{step.num}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO-WAY ROUTES ─── */}
      <section className="bg-white border-b border-slate-100">
        <div className="site-container py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#C6904D]/10 border border-[#C6904D]/20 mb-5">
                <svg className="w-4 h-4 text-[#C6904D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-xs font-semibold text-[#C6904D] tracking-wide uppercase">Two-Way Routes</span>
              </div>
              <h2 className="text-[1.5rem] sm:text-[2.25rem] font-light text-[#1a1a1a] tracking-wide leading-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Full there.{' '}
                <span className="text-[#C6904D]">Empty back?</span>{' '}
                Not anymore.
              </h2>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
                Every delivery van that drives to a marina drives back empty. That&apos;s wasted fuel, wasted time, and a missed opportunity. With two-way route listings, carriers offer space in both directions &mdash; and earn on the return.
              </p>
              <ul className="space-y-3">
                {[
                  'Carriers list outbound and return legs in one listing',
                  'Crew can send laundry, returns, or equipment back to shore',
                  'Vendors consolidate pickups from multiple yachts on the return',
                  'Halve the number of vans at the marina',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-[#C6904D] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#faf9f7] rounded-2xl border border-[#e8e4de] p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#1a1a1a]">Outbound &mdash; Antibes to Monaco</div>
                    <div className="text-xs text-slate-400 mt-0.5">Provisions, wine, engine parts &middot; 850kg loaded</div>
                    <div className="mt-2 h-2 bg-green-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#C6904D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#1a1a1a]">Return &mdash; Monaco to Antibes</div>
                    <div className="text-xs text-slate-400 mt-0.5">Crew luggage, warranty returns &middot; 200kg booked</div>
                    <div className="mt-2 h-2 bg-blue-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="text-xs text-slate-400">Space available on both legs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="bg-white">
        <div className="site-container py-20 sm:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-[1.5rem] sm:text-[2.25rem] font-light text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Popular routes
              </h2>
              <p className="mt-2 text-[15px] sm:text-lg text-slate-500">Top Mediterranean destinations.</p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-[#C6904D] text-sm font-semibold hover:underline">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-lg border-2 border-slate-200 p-4 sm:p-5 hover:no-underline hover:border-[#C6904D]/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{route.emoji}</span>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{route.region}</span>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{route.from}</div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <div className="font-bold text-slate-900 text-sm">{route.to}</div>
                </div>
                <div className="mt-3 text-xs text-[#C6904D] font-semibold group-hover:underline">View space</div>
              </Link>
            ))}
          </div>

          <Link href="/marketplace" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-[#C6904D] text-sm font-semibold">
            View all routes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* ─── FOR WHO ─── */}
      <section className="bg-[#faf9f7] border-y border-[#e8e4de]/60">
        <div className="site-container py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-lg bg-white border-2 border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-[#9a7039] rounded text-xs font-bold mb-5 uppercase tracking-wide">
                Carriers
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">For carriers & drivers</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-3 mb-8">
                {['List both outbound & return legs', 'Set your own prices per direction', 'Get paid directly via Stripe', 'No more empty return journeys'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CARRIER" className="btn-primary !text-sm !py-3 !px-6">
                Start as a carrier
              </Link>
            </div>

            <div className="rounded-lg bg-white border-2 border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-[#9a7039] rounded text-xs font-bold mb-5 uppercase tracking-wide">
                Crew &amp; Vendors
              </div>
              <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">For crew, vendors &amp; fleet managers</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Last-minute parts, provisions, or equipment? Get it to your yacht or shipyard without the hassle.
              </p>
              <ul className="space-y-3 mb-8">
                {['Book outbound & return journeys', 'MMSI tracking — deliveries follow your vessel', 'Live driver tracking with ETA & SMS alerts', 'Secure payment with protection'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CREW" className="btn-primary !text-sm !py-3 !px-6">
                Start shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2520]">
        <div className="site-container py-20 sm:py-28 text-center">
          <h2 className="text-[1.5rem] sm:text-[2.25rem] lg:text-[2.75rem] font-light text-white tracking-wide leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Stop sending empty vans.
          </h2>
          <p className="mt-4 text-[15px] sm:text-lg text-slate-400 max-w-md mx-auto">
            Join crew, vendors, fleet managers, and carriers making maritime logistics smarter.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary text-[15px] sm:text-base !px-8">
              Create Free Account
            </Link>
            <Link href="/marketplace" className="btn-outline text-[15px] sm:text-base">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-slate-200">
        <div className="site-container py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Onshore Deliver" width={28} height={28} className="rounded-sm" />
              <span className="text-sm font-semibold text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Onshore Deliver</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/about" className="text-slate-500 hover:text-slate-900 hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-900 hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-slate-500 hover:text-slate-900 hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-slate-500 hover:text-slate-900 hover:no-underline transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Onshore Deliver. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
