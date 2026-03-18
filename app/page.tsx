'use client'

import Link from 'next/link'
import { useAuth } from './components/AuthProvider'
import { useState } from 'react'

export default function Home() {
  const { user } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─ Apple-style translucent bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#d2d2d7]/60">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            <Link href="/" className="flex items-center gap-2 hover:no-underline">
              <span className="text-xl font-semibold text-[#1d1d1f] tracking-tight">Onshore</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/marketplace" className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] hover:no-underline transition-colors">
                Marketplace
              </Link>
              <Link href="/tracking" className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] hover:no-underline transition-colors">
                Tracking
              </Link>
              <Link href="/about" className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] hover:no-underline transition-colors">
                About
              </Link>
              <Link href="/help" className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] hover:no-underline transition-colors">
                Support
              </Link>
              {user ? (
                <Link href="/dashboard" className="bg-[#0071e3] text-white text-xs font-normal px-4 py-1.5 rounded-full hover:bg-[#0077ED] hover:no-underline transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-xs font-normal text-[#1d1d1f]/80 hover:text-[#1d1d1f] hover:no-underline transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-[#0071e3] text-white text-xs font-normal px-4 py-1.5 rounded-full hover:bg-[#0077ED] hover:no-underline transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden p-2 -mr-2 text-[#1d1d1f]"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNav ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileNav && (
          <>
            <div className="mobile-menu-overlay fixed inset-0 z-40 md:hidden" onClick={() => setMobileNav(false)} />
            <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-[#f5f5f7]/95 backdrop-blur-xl border-b border-[#d2d2d7]">
              <div className="px-6 py-3 space-y-0 stagger">
                {[
                  { href: '/marketplace', label: 'Marketplace' },
                  { href: '/tracking', label: 'Tracking' },
                  { href: '/about', label: 'About' },
                  { href: '/help', label: 'Support' },
                ].map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileNav(false)}
                    className="animate-fade-up block py-3 text-sm text-[#1d1d1f] hover:no-underline border-b border-[#d2d2d7]/40 last:border-0">
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 pb-2 flex gap-3 animate-fade-up">
                  {user ? (
                    <Link href="/dashboard" onClick={() => setMobileNav(false)} className="btn-primary w-full text-center text-sm !min-h-[44px]">
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileNav(false)} className="flex-1 text-center py-2.5 text-sm text-[#0071e3] border border-[#0071e3] rounded-full hover:no-underline">
                        Sign In
                      </Link>
                      <Link href="/register" onClick={() => setMobileNav(false)} className="flex-1 btn-primary text-center text-sm !min-h-[44px]">
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* ── Hero ─ Full-bleed dark. Large type. Minimal. ── */}
      <section className="relative bg-black overflow-hidden">
        <div className="max-w-[980px] mx-auto px-6 pt-32 pb-20 sm:pt-44 sm:pb-32 text-center">
          <h1 className="animate-fade-up text-[clamp(2.5rem,8vw,5rem)] leading-[1.05] font-semibold text-[#f5f5f7] tracking-[-0.03em]">
            Delivery logistics,<br />
            <span className="gradient-text">simplified.</span>
          </h1>
          <p className="animate-fade-up mt-5 text-lg sm:text-xl text-[#86868b] max-w-[600px] mx-auto leading-relaxed font-light" style={{ animationDelay: '100ms' }}>
            Share van space to ports and marinas. Book capacity for provisions, equipment, and supplies — delivered dockside.
          </p>
          <div className="animate-fade-up mt-10 flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: '200ms' }}>
            <Link href="/marketplace" className="btn-primary text-base">
              Find available space
            </Link>
            <Link href="/listings/create" className="btn-outline text-base">
              List your van space
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#f5f5f7] border-b border-[#d2d2d7]/60">
        <div className="max-w-[980px] mx-auto px-6 py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '50+', label: 'Ports covered' },
              { value: '200+', label: 'Active carriers' },
              { value: '98%', label: 'On-time delivery' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#86868b] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What do you need? ── */}
      <section className="bg-white">
        <div className="max-w-[980px] mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-semibold text-[#1d1d1f] tracking-tight">
              What do you need?
            </h2>
            <p className="mt-4 text-lg text-[#86868b] max-w-[500px] mx-auto">
              Whether you&apos;re shipping or carrying, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[800px] mx-auto">
            <Link href="/marketplace" className="group block rounded-2xl bg-[#f5f5f7] p-8 sm:p-10 hover:no-underline transition-all duration-300 hover:bg-[#e8e8ed] card-hover">
              <div className="w-12 h-12 rounded-full bg-[#0071e3] flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] mb-2">I need a delivery</h3>
              <p className="text-[15px] text-[#86868b] leading-relaxed mb-6">
                Find carriers heading to your port. Ship provisions, equipment, wine, or supplies.
              </p>
              <span className="text-[#0071e3] text-base group-hover:underline">
                Browse routes →
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-2xl bg-[#f5f5f7] p-8 sm:p-10 hover:no-underline transition-all duration-300 hover:bg-[#e8e8ed] card-hover">
              <div className="w-12 h-12 rounded-full bg-[#1d1d1f] flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] mb-2">I have van space</h3>
              <p className="text-[15px] text-[#86868b] leading-relaxed mb-6">
                Already heading to a port? List your spare capacity and earn on routes you&apos;re making.
              </p>
              <span className="text-[#0071e3] text-base group-hover:underline">
                List space →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-6 py-20 sm:py-28">
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-semibold text-[#1d1d1f] tracking-tight">
              How it works.
            </h2>
            <p className="mt-4 text-lg text-[#86868b]">
              Book cargo space in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {[
              { num: '1', title: 'Find a route', desc: 'Search by port, date, and cargo type. See real-time availability across the Med.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { num: '2', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { num: '3', title: 'Delivered dockside', desc: 'Track in real-time. Your goods arrive direct to the marina berth.', icon: 'M5 13l4 4L19 7' },
            ].map(step => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <svg className="w-6 h-6 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                  </svg>
                </div>
                <div className="text-xs font-medium text-[#86868b] uppercase tracking-widest mb-2">Step {step.num}</div>
                <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2">{step.title}</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed max-w-[280px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Routes ── */}
      <section className="bg-white">
        <div className="max-w-[980px] mx-auto px-6 py-20 sm:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-5xl font-semibold text-[#1d1d1f] tracking-tight">
                Popular routes.
              </h2>
              <p className="mt-3 text-lg text-[#86868b]">The Mediterranean&apos;s premier destinations.</p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex text-[#0071e3] text-base hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-2xl bg-[#f5f5f7] p-6 hover:no-underline hover:bg-[#e8e8ed] transition-colors card-hover"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">{route.emoji}</span>
                  <span className="text-xs text-[#86868b]">{route.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1d1d1f] text-sm">{route.from}</span>
                  <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-[#1d1d1f] text-sm">{route.to}</span>
                </div>
                <div className="mt-4 text-sm text-[#0071e3] group-hover:underline">View space →</div>
              </Link>
            ))}
          </div>

          <Link href="/marketplace" className="sm:hidden block text-center mt-6 text-[#0071e3] text-base">
            View all routes →
          </Link>
        </div>
      </section>

      {/* ── For who ── */}
      <section className="bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white p-8 sm:p-10">
              <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-3">For carriers & drivers</h3>
              <p className="text-[15px] text-[#86868b] mb-6 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-3 mb-8">
                {['List space in under 2 minutes', 'Set your own prices', 'Get paid directly via Stripe', 'Manage everything from your phone'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-[15px] text-[#1d1d1f]">
                    <svg className="w-5 h-5 text-[#30d158] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CARRIER" className="btn-primary text-sm !px-6">
                Start as a carrier
              </Link>
            </div>

            <div className="rounded-2xl bg-white p-8 sm:p-10">
              <h3 className="text-2xl font-semibold text-[#1d1d1f] mb-3">For owners & suppliers</h3>
              <p className="text-[15px] text-[#86868b] mb-6 leading-relaxed">
                Need provisions or supplies delivered? We connect you with carriers on route.
              </p>
              <ul className="space-y-3 mb-8">
                {['Search routes by port & date', 'Book exactly the space you need', 'Track deliveries in real-time', 'Secure payment with protection'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-[15px] text-[#1d1d1f]">
                    <svg className="w-5 h-5 text-[#30d158] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=YACHT_OWNER" className="btn-primary text-sm !px-6">
                Start shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-black">
        <div className="max-w-[680px] mx-auto px-6 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold text-[#f5f5f7] tracking-tight leading-tight">
            Ready to simplify your<br />delivery logistics?
          </h2>
          <p className="mt-5 text-lg text-[#86868b]">
            Join carriers and suppliers across the Mediterranean.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base">
              Create free account
            </Link>
            <Link href="/marketplace" className="btn-outline text-base">
              Browse marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]/60">
        <div className="max-w-[980px] mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b]">
            <p>&copy; {new Date().getFullYear()} Onshore Deliver. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/about" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
