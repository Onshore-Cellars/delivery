'use client'

import Link from 'next/link'
import { useAuth } from './components/AuthProvider'
import Navbar from './components/Navbar'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Landing gets its own navbar with transparent bg */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-gold-400 font-bold text-sm">YH</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  YachtHop
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/marketplace" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
                Marketplace
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn-gold text-sm !py-2 !px-5">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-gold text-sm !py-2 !px-5">
                    Get Started
                  </Link>
                </>
              )}
            </div>
            {/* Mobile: just show key links */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/marketplace" className="text-sm text-white/80">Marketplace</Link>
              <Link href={user ? "/dashboard" : "/register"} className="btn-gold text-xs !py-1.5 !px-3">
                {user ? "Dashboard" : "Get Started"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient pattern-overlay relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-sea-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
                Premium Yacht Logistics
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Deliver to any yacht,{' '}
              <span className="gradient-text">anywhere.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
              The marketplace where suppliers share van space to ports and marinas.
              Book space for provisions, equipment, and luxury goods — delivered dockside.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="btn-gold text-center text-base !py-3.5 !px-8">
                Start Shipping
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg text-base font-semibold text-white border border-white/20 hover:bg-white/5 transition-all"
              >
                Browse Routes
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">50+</div>
                <div className="text-sm text-slate-400 mt-1">Ports Covered</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">200+</div>
                <div className="text-sm text-slate-400 mt-1">Active Carriers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">98%</div>
                <div className="text-sm text-slate-400 mt-1">On-Time Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps to get your cargo delivered to any port or marina
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-2">Step 1</div>
              <h3 className="text-xl font-bold text-navy-900 mb-3">Find a Route</h3>
              <p className="text-slate-500 leading-relaxed">
                Search for carriers heading to your port. Filter by date, capacity, and cargo type.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-2">Step 2</div>
              <h3 className="text-xl font-bold text-navy-900 mb-3">Book Space</h3>
              <p className="text-slate-500 leading-relaxed">
                Reserve exactly the capacity you need. Pay securely online with instant confirmation.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-2">Step 3</div>
              <h3 className="text-xl font-bold text-navy-900 mb-3">Delivered Dockside</h3>
              <p className="text-slate-500 leading-relaxed">
                Track your cargo in real-time. Delivered directly to the marina, ready for your yacht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Carriers / For Shippers */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Carriers */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-slate-100 card-hover">
              <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">For Carriers & Suppliers</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Already running deliveries to ports? List your spare van space and earn extra revenue
                on routes you're making anyway. Set your own prices, manage bookings on your terms.
              </p>
              <ul className="space-y-3 mb-8">
                {['List available space in minutes', 'Set your own pricing model', 'Manage bookings from your dashboard', 'Get paid directly via Stripe'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=CARRIER" className="btn-primary inline-block text-sm !py-2.5">
                Start as a Carrier
              </Link>
            </div>

            {/* Shippers */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-slate-100 card-hover">
              <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-3">For Yacht Owners & Suppliers</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Need provisions, equipment, or supplies delivered to a yacht? Browse available routes,
                book space, and track your delivery — all from one premium platform.
              </p>
              <ul className="space-y-3 mb-8">
                {['Search routes by port and date', 'Book exactly the space you need', 'Track deliveries in real-time', 'Secure payment with full protection'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=YACHT_OWNER" className="btn-primary inline-block text-sm !py-2.5">
                Start Shipping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Popular Routes
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Covering the Mediterranean&apos;s premier yachting destinations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { from: 'Antibes', to: 'Monaco', region: 'French Riviera' },
              { from: 'Palma', to: 'Ibiza', region: 'Balearics' },
              { from: 'Genoa', to: 'Portofino', region: 'Italian Riviera' },
              { from: 'Athens', to: 'Mykonos', region: 'Greek Islands' },
            ].map((route) => (
              <div
                key={route.from + route.to}
                className="group bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-navy-200 hover:shadow-lg transition-all cursor-pointer card-hover"
              >
                <div className="text-xs font-semibold text-gold-500 uppercase tracking-widest mb-3">{route.region}</div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-navy-900">{route.from}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-bold text-navy-900">{route.to}</span>
                </div>
                <div className="mt-3 text-sm text-slate-500 group-hover:text-navy-600 transition-colors">
                  View available space &rarr;
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to streamline your yacht logistics?
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Join the marketplace trusted by carriers and yacht owners across the Mediterranean.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-gold text-base !py-3.5 !px-8">
              Create Free Account
            </Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg text-base font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <span className="text-gold-400 font-bold text-sm">YH</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">YachtHop</span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                The premium marketplace for yacht logistics. Connecting carriers with spare capacity
                to yacht owners and suppliers who need reliable delivery to ports and marinas.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
              <div className="space-y-2.5">
                <Link href="/marketplace" className="block text-sm text-slate-400 hover:text-white transition-colors">Marketplace</Link>
                <Link href="/register?role=CARRIER" className="block text-sm text-slate-400 hover:text-white transition-colors">Become a Carrier</Link>
                <Link href="/register" className="block text-sm text-slate-400 hover:text-white transition-colors">Sign Up</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
              <div className="space-y-2.5">
                <Link href="#" className="block text-sm text-slate-400 hover:text-white transition-colors">About</Link>
                <Link href="#" className="block text-sm text-slate-400 hover:text-white transition-colors">Terms</Link>
                <Link href="#" className="block text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} YachtHop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
