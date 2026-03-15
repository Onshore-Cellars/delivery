'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">YachtHop</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-500">
              Sign in to manage your shipments and listings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right — decorative panel */}
      <div className="hidden lg:flex lg:flex-1 hero-gradient pattern-overlay items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-gold-400 font-bold text-2xl">YH</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Premium Yacht Logistics</h2>
          <p className="text-slate-300 leading-relaxed">
            The trusted marketplace for carriers and yacht owners across the Mediterranean.
            Streamline your yacht deliveries with YachtHop.
          </p>
        </div>
      </div>
    </div>
  )
}
