'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from.trim()) params.set('origin', from.trim())
    if (to.trim()) params.set('destination', to.trim())
    router.push(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-[#0B1F2A]">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 78% 25%, rgba(30,111,143,0.20) 0%, transparent 70%), radial-gradient(ellipse 45% 45% at 8% 85%, rgba(199,154,86,0.08) 0%, transparent 60%)'
        }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '34px 34px' }} />

        <div className="relative site-container pt-28 sm:pt-40 pb-20 sm:pb-28">
          <div className="animate-fade-up inline-flex items-center gap-2.5 mb-7 rounded-full border border-[#C79A56]/30 bg-[#C79A56]/[0.06] px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9ED36A]" />
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#C79A56]">Yacht logistics · Med &amp; South Coast</span>
          </div>

          <h1 className="animate-fade-up text-[2.15rem] sm:text-[3.4rem] md:text-[4.1rem] font-bold text-[#F7F9FB] tracking-[-0.02em] leading-[1.02] max-w-4xl">
            Get anything to any berth —<br className="hidden sm:block" />
            <span className="text-[#5FB3C4]"> shared van space</span> for the yachting trade.
          </h1>

          <p className="animate-fade-up mt-6 text-[16px] sm:text-lg text-[#B9C6CC] max-w-xl leading-relaxed" style={{ animationDelay: '80ms' }}>
            Stop sending five vans to the same marina. Consolidate deliveries, book carriers&rsquo; return legs, and get last-minute provisions, parts and wine to your vessel or shipyard — insured and tracked.
          </p>

          {/* Live route search */}
          <form onSubmit={search} className="animate-fade-up mt-9 max-w-2xl" style={{ animationDelay: '140ms' }}>
            <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-white/10 bg-[#0B1F2A]/60 backdrop-blur p-2.5 shadow-2xl shadow-black/30">
              <div className="flex-1 flex items-center gap-2.5 rounded-xl bg-[#162E3D] px-4 py-3">
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#8FA1AB] shrink-0">From</span>
                <input
                  value={from} onChange={e => setFrom(e.target.value)}
                  placeholder="Antibes"
                  aria-label="Origin port"
                  className="w-full bg-transparent border-0 p-0 text-[15px] text-[#F7F9FB] placeholder:text-[#6B7C86] focus:ring-0 outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-2.5 rounded-xl bg-[#162E3D] px-4 py-3">
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#8FA1AB] shrink-0">To</span>
                <input
                  value={to} onChange={e => setTo(e.target.value)}
                  placeholder="Monaco"
                  aria-label="Destination port"
                  className="w-full bg-transparent border-0 p-0 text-[15px] text-[#F7F9FB] placeholder:text-[#6B7C86] focus:ring-0 outline-none"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0 !px-7">Find space</button>
            </div>
          </form>

          <div className="animate-fade-up mt-6 flex flex-col sm:flex-row gap-3" style={{ animationDelay: '200ms' }}>
            <Link href="/listings/create" className="btn-outline">List your van space</Link>
          </div>

          {/* Trust signals — substantiated, not vanity stats */}
          <div className="animate-fade-up mt-14 flex flex-wrap gap-x-7 gap-y-3" style={{ animationDelay: '280ms' }}>
            {[
              { label: 'Insured cargo', d: 'M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6z' },
              { label: 'Vetted carriers', d: 'M9 12l2 2 4-4M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6z' },
              { label: 'Secure escrow payment', d: 'M5 11V7a5 5 0 0110 0v4M4 11h12v9H4z' },
              { label: 'Live tracking & POD', d: 'M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7zM12 9a2 2 0 100-4 2 2 0 000 4z' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[13px] text-[#9AADB8]">
                <svg className="w-4 h-4 text-[#C79A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={s.d} /></svg>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT DO YOU NEED ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-18 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[#C79A56] block mb-3">Two sides, one platform</span>
            <h2 className="text-[1.6rem] sm:text-[2.4rem] font-bold text-[#F7F9FB] tracking-[-0.02em] leading-tight">
              Shipping, or filling spare capacity?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/marketplace" className="group block rounded-2xl border border-white/[0.06] bg-[#162E3D] p-7 sm:p-9 hover:no-underline hover:border-[#5FB3C4]/40 hover:shadow-xl hover:shadow-[#1E6F8F]/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#1E6F8F] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[#F7F9FB] mb-2">I need a delivery</h3>
              <p className="text-sm text-[#9AADB8] leading-relaxed mb-5">
                Find carriers already heading to your port. Ship provisions, equipment, wine or supplies to any marina — insured and tracked door to berth.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#5FB3C4] text-sm font-semibold group-hover:gap-2.5 transition-all">
                Browse routes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-2xl border border-white/[0.06] bg-[#162E3D] p-7 sm:p-9 hover:no-underline hover:border-[#C79A56]/40 hover:shadow-xl hover:shadow-[#C79A56]/10 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[#C79A56] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-[#0B1F2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[#F7F9FB] mb-2">I have van space</h3>
              <p className="text-sm text-[#9AADB8] leading-relaxed mb-5">
                Already driving to a port? List your spare capacity — outbound and return — and earn on journeys you&rsquo;re running anyway.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[#C79A56] text-sm font-semibold group-hover:gap-2.5 transition-all">
                List space
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (a genuine sequence) ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-18 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[#C79A56] block mb-3">How it works</span>
            <h2 className="text-[1.6rem] sm:text-[2.4rem] font-bold text-[#F7F9FB] tracking-[-0.02em]">
              Book cargo space in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Find a route', desc: 'Search by port, date and cargo. See real-time capacity across the Med.' },
              { num: '02', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure escrow checkout, released on delivery.' },
              { num: '03', title: 'Delivered dockside', desc: 'Track live, get proof of delivery, and rate the carrier — straight to the berth.' },
            ].map(step => (
              <div key={step.num} className="bg-[#162E3D] rounded-2xl border border-white/[0.06] p-7">
                <div className="font-[family-name:var(--font-mono)] text-sm font-medium text-[#C79A56] mb-3">{step.num}</div>
                <h3 className="text-base font-bold text-[#F7F9FB] mb-1.5">{step.title}</h3>
                <p className="text-sm text-[#9AADB8] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO-WAY ROUTES ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-18 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[#C79A56] block mb-3">Return legs</span>
              <h2 className="text-[1.6rem] sm:text-[2.4rem] font-bold text-[#F7F9FB] tracking-[-0.02em] leading-tight mb-4">
                Full there. Empty back? Not anymore.
              </h2>
              <p className="text-[15px] text-[#9AADB8] leading-relaxed mb-6">
                Every van that drives to a marina drives home empty — wasted fuel and a missed opportunity. Two-way listings let carriers sell space in both directions and earn on the return.
              </p>
              <ul className="space-y-3">
                {[
                  'Carriers list outbound and return legs in one listing',
                  'Crew send laundry, returns or equipment back to shore',
                  'Vendors consolidate pickups from multiple yachts on the return',
                  'Halve the number of vans at the marina gate',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#B9C6CC]">
                    <svg className="w-4 h-4 text-[#9ED36A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#162E3D] rounded-2xl border border-white/[0.06] p-6 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#9ED36A]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#9ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#F7F9FB]">Outbound — Antibes to Monaco</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-[#8FA1AB] mt-0.5">Provisions, wine, engine parts · 850kg loaded</div>
                    <div className="mt-2 h-2 bg-[#9ED36A]/10 rounded-full"><div className="h-full bg-[#9ED36A] rounded-full" style={{ width: '85%' }} /></div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#C79A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C79A56]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#C79A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#F7F9FB]">Return — Monaco to Antibes</div>
                    <div className="font-[family-name:var(--font-mono)] text-xs text-[#8FA1AB] mt-0.5">Crew luggage, warranty returns · 200kg booked</div>
                    <div className="mt-2 h-2 bg-[#C79A56]/10 rounded-full"><div className="h-full bg-[#C79A56] rounded-full" style={{ width: '20%' }} /></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#8FA1AB]">Space available on both legs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-18 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[#C79A56] block mb-3">Popular routes</span>
              <h2 className="text-[1.6rem] sm:text-[2.4rem] font-bold text-[#F7F9FB] tracking-[-0.02em]">Top Mediterranean corridors</h2>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-[#5FB3C4] text-sm font-semibold hover:underline">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ from: 'Antibes', to: 'Monaco', region: 'French Riviera' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-2xl border border-white/[0.06] bg-[#162E3D] p-5 hover:no-underline hover:border-[#5FB3C4]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#8FA1AB] font-medium tracking-[0.14em] uppercase">{route.region}</span>
                <div className="mt-3 space-y-1">
                  <div className="font-bold text-[#F7F9FB] text-sm">{route.from}</div>
                  <svg className="w-4 h-4 text-[#5FB3C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  <div className="font-bold text-[#F7F9FB] text-sm">{route.to}</div>
                </div>
                <div className="mt-3 text-xs text-[#5FB3C4] font-semibold group-hover:underline">View space</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-white/[0.07]">
        <div className="site-container py-18 sm:py-24 text-center">
          <div className="max-w-2xl mx-auto rounded-3xl border border-[#C79A56]/25 bg-gradient-to-br from-[#1E6F8F]/12 to-transparent p-10 sm:p-14">
            <h2 className="text-[1.5rem] sm:text-[2.1rem] font-bold text-[#F7F9FB] tracking-[-0.02em] leading-tight">
              The logistics layer the yachting trade trusts.
            </h2>
            <p className="mt-3 text-[15px] text-[#B9C6CC]">Insured cargo, vetted carriers, payment held until delivery.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="btn-primary !px-8">Create free account</Link>
              <Link href="/marketplace" className="btn-outline">Browse marketplace</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] bg-[#0B1F2A] pb-20 md:pb-8">
        <div className="site-container py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="ON.SHORE Delivery" width={28} height={28} className="rounded-sm" />
              <span className="text-sm font-semibold text-[#9AADB8] tracking-wide">ON.SHORE Delivery</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/about" className="text-[#9AADB8] hover:text-white hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-[#9AADB8] hover:text-white hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-[#9AADB8] hover:text-white hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-[#9AADB8] hover:text-white hover:no-underline transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-[#8FA1AB]">&copy; {new Date().getFullYear()} Onshore Group. Shared delivery space for the yachting industry.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
