'use client'

import Link from 'next/link'
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

  const serif = { fontFamily: 'var(--font-display)' }

  return (
    <div className="min-h-screen bg-[var(--c-canvas)]">
      {/* ─── HERO (Marine Teal band) ─── */}
      <section className="relative overflow-hidden" style={{ background: 'var(--c-brand)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 55% at 82% 15%, rgba(199,154,78,0.16) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 5% 90%, rgba(255,255,255,0.05) 0%, transparent 60%)'
        }} />
        <div className="relative site-container pt-32 sm:pt-44 pb-20 sm:pb-28">
          <div className="animate-fade-up inline-flex items-center gap-2.5 mb-8 rounded-full border border-[#C79A4E]/40 bg-[#C79A4E]/[0.1] px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C79A4E' }} />
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] uppercase text-[#E7C98A]">Mediterranean &amp; UK South Coast</span>
          </div>

          <h1 className="animate-fade-up text-[#FCFBF8] font-light tracking-[-0.02em] leading-[1.03] max-w-4xl" style={{ ...serif, fontSize: 'clamp(40px,7vw,78px)' }}>
            Space that&rsquo;s already<br className="hidden sm:block" /> <em className="italic text-[#E7C98A]">going your way.</em>
          </h1>

          <p className="animate-fade-up mt-7 text-[17px] sm:text-xl text-[#CFDDD9] max-w-2xl leading-relaxed" style={{ animationDelay: '80ms' }}>
            The yacht-corridor delivery network. Spare van space is already moving between the ports you use — we match it to the provisions, parts and wine that need to travel. Book the room, track the run, receive dockside.
          </p>

          {/* Live route search */}
          <form onSubmit={search} className="animate-fade-up mt-9 max-w-2xl" style={{ animationDelay: '140ms' }}>
            <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur p-2.5">
              <div className="flex-1 flex items-center gap-2.5 rounded-xl bg-[#FCFBF8] px-4 py-3">
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--c-text-3)] shrink-0">From</span>
                <input value={from} onChange={e => setFrom(e.target.value)} placeholder="Antibes" aria-label="Origin port"
                  className="w-full bg-transparent border-0 p-0 text-[15px] text-[var(--c-ink)] placeholder:text-[var(--c-text-3)] focus:ring-0 outline-none" />
              </div>
              <div className="flex-1 flex items-center gap-2.5 rounded-xl bg-[#FCFBF8] px-4 py-3">
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--c-text-3)] shrink-0">To</span>
                <input value={to} onChange={e => setTo(e.target.value)} placeholder="Monaco" aria-label="Destination port"
                  className="w-full bg-transparent border-0 p-0 text-[15px] text-[var(--c-ink)] placeholder:text-[var(--c-text-3)] focus:ring-0 outline-none" />
              </div>
              <button type="submit" className="shrink-0 rounded-xl bg-[#C79A4E] px-7 py-3 text-[15px] font-semibold text-[#12302C] hover:brightness-105 transition">Find space</button>
            </div>
          </form>

          <div className="animate-fade-up mt-5" style={{ animationDelay: '200ms' }}>
            <Link href="/listings/create" className="text-[15px] font-semibold text-[#E7C98A] hover:text-white transition inline-flex items-center gap-1.5">
              Or list your spare van space
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-up mt-14 flex flex-wrap gap-x-7 gap-y-3" style={{ animationDelay: '280ms' }}>
            {['Insured cargo','Vetted carriers','Secure escrow payment','Live tracking & POD'].map(s => (
              <div key={s} className="flex items-center gap-2 text-[13px] text-[#CFDDD9]">
                <svg className="w-4 h-4 text-[#C79A4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12l2 2 4-4M12 3l7 4v5c0 4-3 7-7 8-4-1-7-4-7-8V7z" /></svg>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO SIDES ─── */}
      <section className="border-b border-[var(--c-border)]">
        <div className="site-container py-18 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--c-brass-text)] block mb-3">Two sides, one platform</span>
            <h2 className="text-[var(--c-ink)] tracking-[-0.02em]" style={{ ...serif, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400 }}>Shipping, or filling spare capacity?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/marketplace" className="group block rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-7 sm:p-9 hover:no-underline hover:border-[var(--c-brand)]/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'var(--c-brand)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--c-ink)] mb-2">I need a delivery</h3>
              <p className="text-sm text-[var(--c-text-2)] leading-relaxed mb-5">Find carriers already heading to your port. Ship provisions, equipment, wine or parts to any marina — insured and tracked, door to berth.</p>
              <span className="inline-flex items-center gap-1.5 text-[var(--c-brand)] text-sm font-semibold group-hover:gap-2.5 transition-all">Browse routes<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></span>
            </Link>
            <Link href="/listings/create" className="group block rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-7 sm:p-9 hover:no-underline hover:border-[var(--c-brass)]/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'var(--c-brass)' }}>
                <svg className="w-6 h-6 text-[#12302C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--c-ink)] mb-2">I have van space</h3>
              <p className="text-sm text-[var(--c-text-2)] leading-relaxed mb-5">Already driving to a port? List your spare capacity — outbound and return — and earn on journeys you&rsquo;re running anyway.</p>
              <span className="inline-flex items-center gap-1.5 text-[var(--c-brass-text)] text-sm font-semibold group-hover:gap-2.5 transition-all">List space<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-b border-[var(--c-border)]">
        <div className="site-container py-18 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--c-brass-text)] block mb-3">How it works</span>
            <h2 className="text-[var(--c-ink)] tracking-[-0.02em]" style={{ ...serif, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400 }}>Book cargo space in three steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Find a route', desc: 'Search by port, date and cargo. See real-time capacity across the corridor.' },
              { num: '02', title: 'Book & pay', desc: 'Reserve the exact space you need. Payment held in escrow, released on delivery.' },
              { num: '03', title: 'Delivered dockside', desc: 'Track live, get proof of delivery, and rate the carrier — straight to the berth.' },
            ].map(s => (
              <div key={s.num} className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-7">
                <div className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--c-brass-text)] mb-3">{s.num}</div>
                <h3 className="text-base font-bold text-[var(--c-ink)] mb-1.5">{s.title}</h3>
                <p className="text-sm text-[var(--c-text-2)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="border-b border-[var(--c-border)]">
        <div className="site-container py-18 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--c-brass-text)] block mb-3">Popular routes</span>
              <h2 className="text-[var(--c-ink)] tracking-[-0.02em]" style={{ ...serif, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400 }}>Top Mediterranean corridors</h2>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-[var(--c-brand)] text-sm font-semibold hover:underline">View all<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ from:'Antibes', to:'Monaco', region:'French Riviera' },{ from:'Palma', to:'Ibiza', region:'Balearics' },{ from:'Genoa', to:'Portofino', region:'Italian Riviera' },{ from:'Athens', to:'Mykonos', region:'Greek Islands' }].map(r => (
              <Link key={r.from+r.to} href={`/marketplace?origin=${r.from}&destination=${r.to}`} className="group block rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 hover:no-underline hover:border-[var(--c-brand)]/40 hover:shadow-lg hover:-translate-y-1 transition-all">
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--c-text-3)] font-medium tracking-[0.14em] uppercase">{r.region}</span>
                <div className="mt-3 space-y-1">
                  <div className="font-bold text-[var(--c-ink)] text-sm">{r.from}</div>
                  <svg className="w-4 h-4 text-[var(--c-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  <div className="font-bold text-[var(--c-ink)] text-sm">{r.to}</div>
                </div>
                <div className="mt-3 text-xs text-[var(--c-brand)] font-semibold group-hover:underline">View space</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section>
        <div className="site-container py-18 sm:py-24 text-center">
          <div className="max-w-2xl mx-auto rounded-3xl p-10 sm:p-14" style={{ background: 'var(--c-brand)' }}>
            <h2 className="text-[#FCFBF8] tracking-[-0.02em] leading-tight" style={{ ...serif, fontWeight: 400, fontSize: 'clamp(26px,4vw,40px)' }}>The logistics layer the yachting trade trusts.</h2>
            <p className="mt-3 text-[15px] text-[#CFDDD9]">Insured cargo, vetted carriers, payment held until delivery.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="rounded-lg bg-[#C79A4E] px-8 py-3 text-[15px] font-semibold text-[#12302C] hover:brightness-105 transition">Create free account</Link>
              <Link href="/marketplace" className="rounded-lg border border-white/25 px-7 py-3 text-[15px] font-semibold text-white hover:bg-white/10 transition">Browse marketplace</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--c-border)] pb-20 md:pb-8">
        <div className="site-container py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true"><line x1="16" y1="62" x2="84" y2="62" stroke="#0C5C54" strokeWidth="7" strokeLinecap="round" /><circle cx="50" cy="41" r="9" fill="#A8813C" /></svg>
              <span className="text-sm font-semibold text-[var(--c-ink)] tracking-[-0.01em]">Onshore</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/about" className="text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-[var(--c-text-2)] hover:text-[var(--c-ink)] hover:no-underline transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--c-border)]">
            <p className="text-xs text-[var(--c-text-3)]">&copy; {new Date().getFullYear()} Onshore Group · the yacht delivery network. Space that&rsquo;s already going your way.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
