'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">HH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">
                Hull & Haulage
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/marketplace"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Marketplace
            </Link>

            <Link
              href="/tracking"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Track
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === 'CARRIER' && (
                  <Link
                    href="/listings/create"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    List Space
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-navy-700">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-navy-900 leading-none">{user.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            <Link href="/marketplace" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
              Marketplace
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                {user.role === 'CARRIER' && (
                  <Link href="/listings/create" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    List Space
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-navy-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="block px-3 py-2 text-sm font-medium text-white bg-navy-800 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
