'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1F2A]">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 80% 30%, rgba(30,111,143,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 10% 80%, rgba(255,106,42,0.07) 0%, transparent 60%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative site-container pt-36 sm:pt-48 pb-24 sm:pb-32">
          {/* Eyebrow */}
          <div className="animate-fade-up flex items-center gap-3 mb-8">
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] uppercase text-[#268CB5]">Marine-Grade Logistics</span>
            <div className="flex-1 max-w-[200px] h-px bg-[#1E6F8F]/30" />
          </div>

          <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-[2.5rem] sm:text-[4rem] md:text-[5.5rem] leading-[0.95] font-light text-[#F7F9FB] tracking-[-0.01em] max-w-3xl">
            ON.SHORE<br />
            <em className="text-[#268CB5] italic">Delivery</em>
          </h1>

          <div className="animate-fade-up mt-8 flex items-center gap-4" style={{ animationDelay: '80ms' }}>
            <div className="w-8 h-px bg-[#FF6A2A]" />
            <span className="font-[family-name:var(--font-mono)] text-[12px] tracking-[0.18em] uppercase text-[#6B7C86]">Precision logistics for high-value environments</span>
          </div>

          <p className="animate-fade-up mt-8 text-[15px] sm:text-lg text-[#9AADB8] max-w-lg leading-relaxed" style={{ animationDelay: '120ms' }}>
            Stop sending five vans to the same yacht. Consolidate deliveries, book return legs, and get last-minute orders to your vessel or shipyard &mdash; fast.
          </p>

          <div className="animate-fade-up mt-10 flex flex-col sm:flex-row gap-4" style={{ animationDelay: '200ms' }}>
            <Link href="/marketplace" className="btn-primary !text-[13px] sm:!text-sm !px-8">
              Find Available Space
            </Link>
            <Link href="/listings/create" className="btn-outline !text-[13px] sm:!text-sm">
              List Your Van Space
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fade-up mt-16 sm:mt-20 flex gap-8 sm:gap-14" style={{ animationDelay: '280ms' }}>
            {[
              { value: '200+', label: 'Active carriers' },
              { value: '98%', label: 'On-time rate' },
              { value: '4.9', label: 'Avg rating' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-[family-name:var(--font-mono)] text-xl sm:text-3xl font-medium text-[#F7F9FB]">{stat.value}</div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.15em] uppercase text-[#6B7C86] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div className="animate-fade-up mt-16 inline-block border border-[#1E6F8F]/40 px-6 py-4 relative" style={{ animationDelay: '360ms' }}>
            <span className="absolute top-[-0.5em] left-4 text-3xl text-[#1E6F8F] leading-none font-[family-name:var(--font-display)]">&ldquo;</span>
            <span className="font-[family-name:var(--font-display)] text-xl italic font-light text-[#D6C3A3]">Not a courier. A marine-grade logistics layer.</span>
          </div>
        </div>
      </section>

      {/* ─── WHAT DO YOU NEED ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-20 sm:py-28">
          <div className="mb-12 sm:mb-16">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#FF6A2A] block mb-2">01 — Services</span>
            <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] sm:text-[2.5rem] font-light text-[#F7F9FB] tracking-[-0.01em] leading-tight">
              What do you <em className="text-[#268CB5] italic">need?</em>
            </h2>
            <p className="mt-2 text-[15px] text-[#6B7C86] max-w-[540px]">
              Whether you&apos;re shipping or filling spare capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/marketplace" className="group block rounded-md border border-white/[0.06] bg-[#162E3D] p-7 sm:p-9 hover:no-underline hover:border-[#1E6F8F]/40 hover:shadow-xl hover:shadow-[#1E6F8F]/5 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-[#FF6A2A] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#F7F9FB] mb-2">I need a delivery</h3>
              <p className="text-sm text-[#6B7C86] leading-relaxed mb-5">
                Find carriers heading to your port. Ship provisions, equipment, wine, or supplies to any marina.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#FF6A2A] text-sm font-semibold group-hover:gap-2.5 transition-all">
                Browse routes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-md border border-white/[0.06] bg-[#162E3D] p-7 sm:p-9 hover:no-underline hover:border-[#1E6F8F]/40 hover:shadow-xl hover:shadow-[#1E6F8F]/5 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-[#1E6F8F] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#F7F9FB] mb-2">I have van space</h3>
              <p className="text-sm text-[#6B7C86] leading-relaxed mb-5">
                Already heading to a port? List your spare capacity and earn on routes you&apos;re running.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#FF6A2A] text-sm font-semibold group-hover:gap-2.5 transition-all">
                List space
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-20 sm:py-28">
          <div className="mb-12 sm:mb-16">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#FF6A2A] block mb-2">02 — Process</span>
            <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] sm:text-[2.5rem] font-light text-[#F7F9FB] tracking-[-0.01em]">
              How it <em className="text-[#268CB5] italic">works</em>
            </h2>
            <p className="mt-2 text-[15px] text-[#6B7C86]">
              Book cargo space in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Find a route', desc: 'Search by port, date, and cargo type. See real-time availability across the Med.' },
              { num: '02', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.' },
              { num: '03', title: 'Delivered dockside', desc: 'Track in real-time. Your goods arrive direct to the marina berth.' },
            ].map(step => (
              <div key={step.num} className="bg-[#162E3D] rounded-md border border-white/[0.06] p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="font-[family-name:var(--font-mono)] text-2xl font-light text-[#FF6A2A]/25">{step.num}</div>
                  <h3 className="text-base font-bold text-[#F7F9FB]">{step.title}</h3>
                </div>
                <p className="text-sm text-[#6B7C86] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO-WAY ROUTES ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#FF6A2A] block mb-2">03 — Returns</span>
              <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] sm:text-[2.5rem] font-light text-[#F7F9FB] tracking-[-0.01em] leading-tight mb-4">
                Full there.{' '}
                <em className="text-[#268CB5] italic">Empty back?</em>{' '}
                Not anymore.
              </h2>
              <p className="text-[15px] text-[#6B7C86] leading-relaxed mb-6">
                Every delivery van that drives to a marina drives back empty. That&apos;s wasted fuel, wasted time, and a missed opportunity. With two-way route listings, carriers offer space in both directions &mdash; and earn on the return.
              </p>
              <ul className="space-y-3">
                {[
                  'Carriers list outbound and return legs in one listing',
                  'Crew can send laundry, returns, or equipment back to shore',
                  'Vendors consolidate pickups from multiple yachts on the return',
                  'Halve the number of vans at the marina',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#9AADB8]">
                    <svg className="w-4 h-4 text-[#9ED36A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#162E3D] rounded-xl border border-white/[0.06] p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#9ED36A]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#9ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#F7F9FB]">Outbound &mdash; Antibes to Monaco</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-[#6B7C86] mt-0.5">Provisions, wine, engine parts &middot; 850kg loaded</div>
                    <div className="mt-2 h-2 bg-[#9ED36A]/10 rounded-full">
                      <div className="h-full bg-[#9ED36A] rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FF6A2A]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#F7F9FB]">Return &mdash; Monaco to Antibes</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-[#6B7C86] mt-0.5">Crew luggage, warranty returns &middot; 200kg booked</div>
                    <div className="mt-2 h-2 bg-[#FF6A2A]/10 rounded-full">
                      <div className="h-full bg-[#FF6A2A] rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#6B7C86]">Space available on both legs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-20 sm:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#FF6A2A] block mb-2">04 — Routes</span>
              <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] sm:text-[2.5rem] font-light text-[#F7F9FB] tracking-[-0.01em]">
                Popular <em className="text-[#268CB5] italic">routes</em>
              </h2>
              <p className="mt-2 text-[15px] text-[#6B7C86]">Top Mediterranean destinations.</p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-[#FF6A2A] text-sm font-semibold hover:underline">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-md border border-white/[0.06] bg-[#162E3D] p-4 sm:p-5 hover:no-underline hover:border-[#1E6F8F]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{route.emoji}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#6B7C86] font-medium tracking-[0.15em] uppercase">{route.region}</span>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-[#F7F9FB] text-sm">{route.from}</div>
                  <svg className="w-4 h-4 text-[#1E6F8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <div className="font-bold text-[#F7F9FB] text-sm">{route.to}</div>
                </div>
                <div className="mt-3 text-xs text-[#FF6A2A] font-semibold group-hover:underline">View space</div>
              </Link>
            ))}
          </div>

          <Link href="/marketplace" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-[#FF6A2A] text-sm font-semibold">
            View all routes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* ─── FOR WHO ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-20 sm:py-28">
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#FF6A2A] block mb-2">05 — Who</span>
          <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] sm:text-[2.5rem] font-light text-[#F7F9FB] tracking-[-0.01em] mb-12">
            Built for <em className="text-[#268CB5] italic">maritime</em>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-md bg-[#162E3D] border border-white/[0.06] p-6 sm:p-8">
              <div className="font-[family-name:var(--font-mono)] inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6A2A]/10 text-[#FF6A2A] rounded text-[10px] tracking-[0.15em] uppercase font-bold mb-5">
                Carriers
              </div>
              <h3 className="text-xl font-semibold text-[#F7F9FB] mb-3">For carriers & drivers</h3>
              <p className="text-sm text-[#6B7C86] mb-6 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-3 mb-8">
                {['List both outbound & return legs', 'Set your own prices per direction', 'Get paid directly via Stripe', 'No more empty return journeys'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#9AADB8]">
                    <svg className="w-5 h-5 text-[#9ED36A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="rounded-md bg-[#162E3D] border border-white/[0.06] p-6 sm:p-8">
              <div className="font-[family-name:var(--font-mono)] inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E6F8F]/15 text-[#268CB5] rounded text-[10px] tracking-[0.15em] uppercase font-bold mb-5">
                Crew &amp; Vendors
              </div>
              <h3 className="text-xl font-semibold text-[#F7F9FB] mb-3">For crew, vendors &amp; fleet managers</h3>
              <p className="text-sm text-[#6B7C86] mb-6 leading-relaxed">
                Last-minute parts, provisions, or equipment? Get it to your yacht or shipyard without the hassle.
              </p>
              <ul className="space-y-3 mb-8">
                {['Book outbound & return journeys', 'MMSI tracking — deliveries follow your vessel', 'Live driver tracking with ETA & SMS alerts', 'Secure payment with protection'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#9AADB8]">
                    <svg className="w-5 h-5 text-[#9ED36A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <section className="border-t border-[#FF6A2A]/15">
        <div className="site-container py-20 sm:py-28 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-[#1E6F8F]/15 to-transparent border border-[#1E6F8F]/25 rounded-md p-10 sm:p-14">
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] uppercase text-[#268CB5] block mb-4">Core positioning</span>
              <h2 className="font-[family-name:var(--font-display)] text-[1.4rem] sm:text-[2.2rem] font-light italic text-[#D6C3A3] leading-[1.3]">
                &ldquo;Marine-grade logistics infrastructure<br />for high-value environments.&rdquo;
              </h2>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-primary !text-sm !px-8">
                  Create Free Account
                </Link>
                <Link href="/marketplace" className="btn-outline !text-sm">
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] bg-[#0B1F2A] pb-20 md:pb-0">
        <div className="site-container py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="ON.SHORE Delivery" width={28} height={28} className="rounded-sm" />
              <span className="font-[family-name:var(--font-display)] text-sm font-light text-[#6B7C86] tracking-wide">Onshore Group · Brand System</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#6B7C86]">
              <Link href="/about" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/[0.04]">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#6B7C86]">&copy; {new Date().getFullYear()} Onshore Group. All rights reserved.</p>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#6B7C86]/50 tracking-[0.15em] uppercase">ON.SHORE DELIVERY · v1.0</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
