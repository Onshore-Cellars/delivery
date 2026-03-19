'use client'

import Link from 'next/link'
import { useAuth } from './components/AuthProvider'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white -mt-16">
      {/* ---- HERO ---- */}
      <section className="relative bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-28 pb-16 sm:pt-40 sm:pb-24">
          {/* Eyebrow */}
          <div className="animate-fade-up flex items-center gap-2 mb-6 sm:mb-8">
            <div className="h-px w-8 bg-blue-500/60" />
            <span className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-[0.2em]">Delivery Logistics Platform</span>
          </div>

          <h1 className="animate-fade-up text-[2.25rem] sm:text-[3.5rem] lg:text-[4.25rem] leading-[1.08] font-bold text-white tracking-[-0.03em] max-w-3xl">
            Move supplies to any port,{' '}
            <span className="gradient-text">effortlessly.</span>
          </h1>

          <p className="animate-fade-up mt-5 sm:mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed" style={{ animationDelay: '80ms' }}>
            The marketplace for yacht provisioning logistics. Share van space, book deliveries, and get supplies dockside across the Mediterranean.
          </p>

          <div className="animate-fade-up mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4" style={{ animationDelay: '160ms' }}>
            <Link href="/marketplace" className="btn-primary text-base !px-8">
              Find Available Space
            </Link>
            <Link href="/listings/create" className="btn-outline text-base">
              List Your Van Space
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up mt-14 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg" style={{ animationDelay: '240ms' }}>
            {[
              { value: '50+', label: 'Ports covered' },
              { value: '200+', label: 'Active carriers' },
              { value: '98%', label: 'On-time rate' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- WHAT DO YOU NEED ---- */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] tracking-tight">
              What do you need?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-md">
              Whether you&apos;re shipping provisions or filling spare capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Link href="/marketplace" className="group block rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 hover:no-underline hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-2">I need a delivery</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-5">
                Find carriers heading to your port. Ship provisions, equipment, wine, or supplies to any marina.
              </p>
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                Browse routes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </Link>

            <Link href="/listings/create" className="group block rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 hover:no-underline hover:border-slate-300 hover:shadow-lg hover:shadow-slate-500/5 transition-all duration-300 card-hover">
              <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-2">I have van space</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-5">
                Already heading to a port? List your spare capacity and earn on the routes you&apos;re running.
              </p>
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                List space
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-500">
              Book cargo space in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              { num: '01', title: 'Find a route', desc: 'Search by port, date, and cargo type. See real-time availability across the Med.', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { num: '02', title: 'Book & pay', desc: 'Reserve the exact space you need. Secure checkout with instant confirmation.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { num: '03', title: 'Delivered dockside', desc: 'Track in real-time. Your goods arrive direct to the marina berth.', icon: 'M5 13l4 4L19 7' },
            ].map(step => (
              <div key={step.num} className="relative">
                <div className="text-5xl sm:text-6xl font-bold text-slate-200/60 tracking-tighter mb-4">{step.num}</div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- POPULAR ROUTES ---- */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] tracking-tight">
                Popular routes
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-500">The Mediterranean&apos;s premier destinations.</p>
            </div>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:underline">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera', emoji: '🇫🇷' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics', emoji: '🇪🇸' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera', emoji: '🇮🇹' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands', emoji: '🇬🇷' },
            ].map(route => (
              <Link
                key={route.from + route.to}
                href={`/marketplace?origin=${route.from}&destination=${route.to}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:no-underline hover:border-blue-200 hover:shadow-md transition-all card-hover"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{route.emoji}</span>
                  <span className="text-xs text-slate-500 font-medium">{route.region}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-[#0f172a] text-sm">{route.from}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-slate-300" />
                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="font-bold text-[#0f172a] text-sm">{route.to}</div>
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

      {/* ---- FOR WHO ---- */}
      <section className="bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold mb-5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Carriers
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">For carriers & drivers</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6 leading-relaxed">
                Already heading to a port or marina? Monetise your spare van space.
              </p>
              <ul className="space-y-3 mb-8">
                {['List space in under 2 minutes', 'Set your own prices', 'Get paid directly via Stripe', 'Manage everything from your phone'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-[#0f172a]">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CARRIER" className="btn-primary text-sm !px-6 !py-3">
                Start as a carrier
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold mb-5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                Shippers
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3">For owners & suppliers</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6 leading-relaxed">
                Need provisions or supplies delivered? We connect you with carriers on route.
              </p>
              <ul className="space-y-3 mb-8">
                {['Search routes by port & date', 'Book exactly the space you need', 'Track deliveries in real-time', 'Secure payment with protection'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm sm:text-base text-[#0f172a]">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=YACHT_OWNER" className="btn-primary text-sm !px-6 !py-3">
                Start shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Ready to simplify your<br className="hidden sm:inline" /> delivery logistics?
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-400 max-w-lg mx-auto">
            Join carriers and suppliers across the Mediterranean.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary text-base !px-8">
              Create Free Account
            </Link>
            <Link href="/marketplace" className="btn-outline text-base">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center">
                <span className="text-white text-xs font-bold">O</span>
              </div>
              <span className="text-sm font-bold text-[#0f172a]">Onshore Deliver</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/about" className="text-slate-500 hover:text-[#0f172a] hover:no-underline transition-colors">About</Link>
              <Link href="/terms" className="text-slate-500 hover:text-[#0f172a] hover:no-underline transition-colors">Terms</Link>
              <Link href="/privacy" className="text-slate-500 hover:text-[#0f172a] hover:no-underline transition-colors">Privacy</Link>
              <Link href="/help" className="text-slate-500 hover:text-[#0f172a] hover:no-underline transition-colors">Support</Link>
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
