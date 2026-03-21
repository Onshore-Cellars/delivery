'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
      const result = await googleSignIn(response.credential)
      if (result.needsRole) {
        setError('No account found. Please register first to select your account type.')
      }
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed') }
    finally { setLoading(false) }
  }, [googleSignIn])

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({ client_id: clientId, callback: handleGoogleResponse })
      const btnEl = document.getElementById('google-signin-btn')
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, { theme: 'outline', size: 'large', width: '100%', text: 'signin_with', shape: 'pill' })
      }
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [handleGoogleResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login(email, password) }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 hover:no-underline">
            <Image src="/logo.png" alt="Onshore Deliver" width={32} height={32} className="rounded-sm" />
            <span className="text-lg font-semibold text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Onshore</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-light text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Welcome back</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500">Sign in to manage your deliveries.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1a1a1a] mb-2">Email</label>
              <input id="email" type="email" required autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[#1a1a1a] text-[15px] placeholder:text-slate-400 focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none"
                placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1a1a1a] mb-2">Password</label>
              <input id="password" type="password" required autoComplete="current-password"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[#1a1a1a] text-[15px] placeholder:text-slate-400 focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none"
                placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-[#C6904D] hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary !py-3.5 !text-[15px] disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8e4de]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 uppercase tracking-wider font-medium">or</span></div>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <div id="google-signin-btn" className="flex justify-center" />
          ) : (
            <button
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded border border-[#e8e4de] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors disabled:opacity-50"
              onClick={() => setError('Google sign-in requires configuration. Please use email/password or contact support.')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#C6904D] hover:text-[#b07d3f]">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
