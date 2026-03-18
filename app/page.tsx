'use client'

import Link from 'next/link'
import { useAuth } from './components/AuthProvider'
import { useState } from 'react'

export default function Home() {
  const { user } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Navbar — transparent over hero */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">YachtHop</span>
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/marketplace" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">
                Marketplace
              </Link>
              <Link href="/tracking" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">
                Track
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn-gold text-sm !py-2 !px-5 !min-h-0">Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-gold text-sm !py-2.5 !px-5 !min-h-0">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden p-2 -mr-1 rounded-lg text-white/80 hover:text-white active:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNav ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <>
            <div className="mobile-menu-overlay fixed inset-0 z-40 md:hidden" onClick={() => setMobileNav(false)} />
            <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
              <div className="px-5 py-4 space-y-1 stagger">
                <Link href="/marketplace" onClick={() => setMobileNav(false)} className="animate-fade-up block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Marketplace
                </Link>
                <Link href="/tracking" onClick={() => setMobileNav(false)} className="animate-fade-up block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Track Shipment
                </Link>
                {user ? (
                  <Link href="/dashboard" onClick={() => setMobileNav(false)} className="animate-fade-up block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileNav(false)} className="animate-fade-up block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      Sign In
                    </Link>
                    <div className="animate-fade-up pt-2">
                      <Link href="/register" onClick={() => setMobileNav(false)} className="btn-gold w-full text-center text-base !py-3">
                        Get Started
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero-gradient pattern-overlay relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gold-500/[0.05] rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 -left-24 w-[300px] h-[300px] bg-sea-500/[0.04] rounded-full blur-[80px]" />
          <div className="absolute bottom-20 right-1/4 w-[200px] h-[200px] bg-navy-400/[0.06] rounded-full blur-[60px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-36">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.07] border border-white/[0.12] backdrop-blur-md mb-6 sm:mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[11px] sm:text-xs font-semibold text-white/70 tracking-[0.15em] uppercase">
                Premium Yacht Logistics
              </span>
            </div>

            <h1 className="text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-[4rem] font-extrabold text-white tracking-[-0.02em]">
              Deliver to any yacht,{' '}
              <span className="gradient-text">anywhere.</span>
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-slate-300/90 max-w-2xl leading-relaxed font-light">
              Share van space to ports and marinas. Book capacity for provisions, 
              equipment, and luxury goods — delivered dockside.
            </p>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/marketplace" className="btn-gold text-center">
                Find Available Space
              </Link>
              <Link href="/listings/create" className="btn-outline text-center">
                List Your Van Space
              </Link>
            </div>
          </div>

          {/* Stats — glassmorphism cards */}
          <div className="mt-16 sm:mt-20 flex gap-6 sm:gap-8 lg:gap-12">
            {[
              { value: '50+', label: 'Ports Covered' },
              { value: '200+', label: 'Active Carriers' },
              { value: '98%', label: 'On-Time Rate' },
            ].map((stat) => (
              <div key={stat.label} className="animate-fade-up">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400/80 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What do you need? ── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-gold-600 uppercase tracking-[0.2em] mb-3">Get Started</p>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-navy-900 tracking-[-0.02em]">
              What do you need?
            </h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Whether you&apos;re shipping or carrying, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 max-w-3xl mx-auto">
            {/* Need Delivery */}
            <Link
              href="/marketplace"
              className="group relative bg-white rounded-2xl p-7 sm:p-9 border border-slate-200/80 hover:border-navy-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 card-hover overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-navy-50 to-transparent rounded-bl-[80px] opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center mb-6 shadow-lg shadow-navy-900/20">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-navy-900 mb-2.5">I need something delivered</h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-5">
                  Provisions, equipment, wine, or supplies — find a carrier heading to your port.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 group-hover:text-navy-900 transition-colors">
                  Browse routes
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Have Space */}
            <Link
              href="/listings/create"
              className="group relative bg-white rounded-2xl p-7 sm:p-9 border border-slate-200/80 hover:border-gold-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 card-hover overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-50 to-transparent rounded-bl-[80px] opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center mb-6 shadow-lg shadow-navy-900/20">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-navy-900 mb-2.5">I have van space available</h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-5">
                  Already heading to a port? List your spare capacity and earn on routes you&apos;re making.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 group-hover:text-navy-900 transition-colors">
                  List space
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-28 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-bold text-gold-600 uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-navy-900 tracking-[-0.02em]">
              Simple as 1-2-3
            </h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Book cargo space in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Find a Route',
                desc: 'Search by port, date, and cargo type. See real-time availability.',
                icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
              },
              {
                step: '2',
                title: 'Book & Pay',
                desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.',
                icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
              },
              {
                step: '3',
                title: 'Delivered Dockside',
                desc: 'Track in real-time. Your goods arrive direct to the marina berth.',
                icon: 'M5 13l4 4L19 7',
              },
            ].map((item) => (
              <div key={item.step} className="text-center sm:text-left group">
                <div className="mx-auto sm:mx-0 w-16 h-16 rounded-2xl bg-white shadow-md shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-navy-100/40 transition-shadow duration-300">
                  <svg className="w-7 h-7 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <div className="text-[11px] font-bold text-gold-600 uppercase tracking-[0.15em] mb-2">Step {item.step}</div>
                <h3 className="text-lg font-bold text-navy-900 mb-2.5">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Routes ── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 sm:mb-14">
            <div>
              <p className="text-xs font-bold text-gold-600 uppercase tracking-[0.2em] mb-3">Routes</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em]">
                Popular Routes
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-500">
                The Mediterranean&apos;s premier yachting destinations
              </p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map((route) => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group flex-shrink-0 w-[260px] sm:w-auto bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-navy-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 card-hover"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-lg">{route.emoji}</span>
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-[0.15em]">{route.region}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-navy-900 text-sm sm:text-base">{route.from}</span>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-bold text-navy-900 text-sm sm:text-base">{route.to}</span>
                </div>
                <div className="mt-4 text-xs sm:text-sm text-slate-400 group-hover:text-navy-600 transition-colors font-medium">
                  View available space &rarr;
                </div>
              </Link>
            ))}
          </div>

          <Link href="/marketplace" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-semibold text-navy-700">
            View all routes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Who is this for ── */}
      <section className="py-20 sm:py-28 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
            {/* Carriers */}
            <div className="bg-white rounded-2xl p-7 sm:p-9 lg:p-11 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/80 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-bold text-navy-900 mb-3">For Carriers & Drivers</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-5 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-2.5 mb-6">
                {['List space in under 2 minutes', 'Set your own prices', 'Get paid directly via Stripe', 'Manage everything from your phone'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CARRIER" className="btn-primary text-sm !py-2.5">
                Start as a Carrier
              </Link>
            </div>

            {/* Shippers */}
            <div className="bg-white rounded-2xl p-7 sm:p-9 lg:p-11 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/80 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] transition-shadow duration-300">
              <h3 className="text-xl sm:text-2xl font-bold text-navy-900 mb-3">For Yacht Owners & Suppliers</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-5 leading-relaxed">
                Need provisions or supplies delivered to a yacht? We connect you with carriers on route.
              </p>
              <ul className="space-y-2.5 mb-6">
                {['Search routes by port & date', 'Book exactly the space you need', 'Track deliveries in real-time', 'Secure payment with protection'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=YACHT_OWNER" className="btn-primary text-sm !py-2.5">
                Start Shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hero-gradient relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/[0.04] rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold text-white tracking-[-0.02em] leading-tight">
            Ready to simplify your yacht logistics?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300/90 max-w-xl mx-auto">
            Join carriers and yacht owners across the Mediterranean.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register" className="btn-gold text-center">
              Create Free Account
            </Link>
            <Link href="/marketplace" className="btn-outline text-center">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy-950 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <span className="text-gold-400 font-bold text-sm">YH</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">YachtHop</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Premium yacht logistics. Connecting carriers with yacht owners and suppliers across the Med.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h4>
              <div className="space-y-2">
                <Link href="/marketplace" className="block text-sm text-slate-400 hover:text-white transition-colors">Marketplace</Link>
                <Link href="/tracking" className="block text-sm text-slate-400 hover:text-white transition-colors">Track</Link>
                <Link href="/register?role=CARRIER" className="block text-sm text-slate-400 hover:text-white transition-colors">Become a Carrier</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-slate-400 hover:text-white transition-colors">About</Link>
                <Link href="/terms" className="block text-sm text-slate-400 hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="block text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link>
                <Link href="/help" className="block text-sm text-slate-400 hover:text-white transition-colors">Help</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} YachtHop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
