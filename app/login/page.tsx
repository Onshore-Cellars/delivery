'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const { login, googleSignIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setError('')
    setLoading(true)
    try {
      await googleSignIn(response.credential)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [googleSignIn])

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      })
      const btnEl = document.getElementById('google-signin-btn')
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill',
        })
      }
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [handleGoogleResponse])

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
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center shadow-sm">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">YachtHop</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em]">Welcome back</h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-500 leading-relaxed">
              Sign in to manage your yacht logistics.
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
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
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
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
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

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 uppercase tracking-wider">or</span>
                </div>
              </div>
              <div id="google-signin-btn" className="flex justify-center" />
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right — decorative panel */}
      <div className="hidden lg:flex lg:flex-1 hero-gradient pattern-overlay items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-gold-500/[0.05] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] bg-sea-500/[0.04] rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.08] backdrop-blur-md border border-white/[0.12] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <span className="text-gold-400 font-bold text-3xl">YH</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-5 tracking-[-0.02em]">The Yachting Industry&apos;s Logistics Hub</h2>
          <p className="text-slate-300/90 leading-relaxed text-lg font-light">
            Share van space, book deliveries, and coordinate supplies across the Med &mdash; built exclusively for the yachting industry.
          </p>
        </div>
      </div>
    </div>
  )
}
