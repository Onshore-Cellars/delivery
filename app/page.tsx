'use client'

import Link from 'next/link'
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
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
                <span className={`text-sm font-bold transition-colors duration-300 ${scrolled ? 'text-blue-600' : 'text-white'}`}>O</span>
              </div>
              <span className={`text-lg font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                Onshore
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/tracking', label: 'Tracking' },
                { href: '/about', label: 'About' },
                { href: '/help', label: 'Support' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${
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
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:no-underline transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:no-underline ${
                      scrolled
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:no-underline transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2.5 -mr-2 rounded-xl transition-colors ${
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
            <div className="flex items-center justify-between h-14 px-5 border-b border-slate-100">
              <span className="text-base font-bold text-slate-900">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="p-3 space-y-0.5">
              {[
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/tracking', label: 'Tracking' },
                { href: '/about', label: 'About' },
                { href: '/help', label: 'Support' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3.5 rounded-xl text-[15px] font-medium text-slate-700 hover:bg-slate-50 hover:no-underline transition-colors"
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
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />

        <div className="relative max-w-[1120px] mx-auto px-6 sm:px-8 pt-32 sm:pt-44 pb-20 sm:pb-28">
          {/* Eyebrow */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.07] border border-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Now serving 50+ ports</span>
          </div>

          <h1 className="animate-fade-up text-[1.75rem] sm:text-[2.75rem] md:text-[3.5rem] leading-[1.1] font-bold text-white tracking-[-0.02em] max-w-2xl">
            Delivery logistics for the{' '}
            <span className="gradient-text">Mediterranean.</span>
          </h1>

          <p className="animate-fade-up mt-5 text-[15px] sm:text-lg text-slate-400 max-w-lg leading-relaxed" style={{ animationDelay: '80ms' }}>
            Share van space, book deliveries, and get supplies dockside. The marketplace that connects carriers with yacht owners and provisioners.
          </p>

          <div className="animate-fade-up mt-8 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '160ms' }}>
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
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <h2 className="text-[1.5rem] sm:text-[2.25rem] font-bold text-slate-900 tracking-tight leading-tight">
              What do you need?
            </h2>
            <p className="mt-2 text-[15px] sm:text-lg text-slate-500">
              Whether you&apos;re shipping or filling spare capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/marketplace" className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 hover:no-underline hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">I need a delivery</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Find carriers heading to your port. Ship provisions, equipment, wine, or supplies to any marina.
              </p>
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                Browse routes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 hover:no-underline hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">I have van space</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Already heading to a port? List your spare capacity and earn on routes you&apos;re running.
              </p>
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                List space
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <h2 className="text-[1.5rem] sm:text-[2.25rem] font-bold text-slate-900 tracking-tight">
              How it works
            </h2>
            <p className="mt-2 text-[15px] sm:text-lg text-slate-500">
              Book cargo space in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Find a route', desc: 'Search by port, date, and cargo type. See real-time availability across the Med.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { num: '2', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { num: '3', title: 'Delivered dockside', desc: 'Track in real-time. Your goods arrive direct to the marina berth.', icon: 'M5 13l4 4L19 7' },
            ].map(step => (
              <div key={step.num} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{step.num}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="bg-white">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-[1.5rem] sm:text-[2.25rem] font-bold text-slate-900 tracking-tight">
                Popular routes
              </h2>
              <p className="mt-2 text-[15px] sm:text-lg text-slate-500">Top Mediterranean destinations.</p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-2xl border-2 border-slate-200 p-4 sm:p-5 hover:no-underline hover:border-blue-300 hover:shadow-lg transition-all"
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
                <div className="mt-3 text-xs text-blue-600 font-semibold group-hover:underline">View space</div>
              </Link>
            ))}
          </div>

          <Link href="/marketplace" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-blue-600 text-sm font-semibold">
            View all routes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* ─── FOR WHO ─── */}
      <section className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold mb-5 uppercase tracking-wide">
                Carriers
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For carriers & drivers</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-3 mb-8">
                {['List space in under 2 minutes', 'Set your own prices', 'Get paid directly via Stripe', 'Manage everything from your phone'].map(item => (
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

            <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold mb-5 uppercase tracking-wide">
                Shippers
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">For owners & suppliers</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Need provisions or supplies delivered? We connect you with carriers on route.
              </p>
              <ul className="space-y-3 mb-8">
                {['Search routes by port & date', 'Book exactly the space you need', 'Track deliveries in real-time', 'Secure payment with protection'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=YACHT_OWNER" className="btn-primary !text-sm !py-3 !px-6">
                Start shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-[1.5rem] sm:text-[2.25rem] lg:text-[2.75rem] font-bold text-white tracking-tight leading-tight">
            Ready to simplify your delivery logistics?
          </h2>
          <p className="mt-4 text-[15px] sm:text-lg text-slate-400 max-w-md mx-auto">
            Join carriers and suppliers across the Mediterranean.
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
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="text-sm font-bold text-slate-900">Onshore Deliver</span>
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
