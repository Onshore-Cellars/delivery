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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null)
  const [googleReady, setGoogleReady] = useState(false)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setError('')
    setLoading(true)
    try {
      const result = await googleSignIn(response.credential)
      if (result.needsRole) {
        setPendingGoogleToken(response.credential)
        setShowRoleSelect(true)
      }
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed') }
    finally { setLoading(false) }
  }, [googleSignIn])

  const handleRoleSelect = async (role: string) => {
    if (!pendingGoogleToken) return
    setError('')
    setLoading(true)
    try {
      await googleSignIn(pendingGoogleToken, role)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create account') }
    finally { setLoading(false); setShowRoleSelect(false); setPendingGoogleToken(null) }
  }

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleResponse })
        const btnEl = document.getElementById('google-signin-btn')
        if (btnEl) {
          window.google.accounts.id.renderButton(btnEl, { theme: 'outline', size: 'large', width: '100%', text: 'signin_with', shape: 'pill' })
        }
        setGoogleReady(true)
      }
    }
    script.onerror = () => setGoogleReady(false)
    document.head.appendChild(script)
    // If script hasn't loaded after 3s, show fallback
    const timeout = setTimeout(() => { if (!window.google?.accounts?.id) setGoogleReady(false) }, 3000)
    return () => { script.remove(); clearTimeout(timeout) }
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
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100" role="alert">
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
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 bg-white text-[#1a1a1a] text-[15px] placeholder:text-slate-400 focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
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

          {/* Google Sign-in: show real button if ready, otherwise fallback */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div id="google-signin-btn" className={`flex justify-center ${googleReady ? '' : 'hidden'}`} />
          )}
          {!googleReady && (
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Google sign-in is not available right now</p>
              <p className="text-xs text-slate-400">Please use email and password to sign in</p>
            </div>
          )}

          {/* Role Selection for Google Sign-in (new users) */}
          {showRoleSelect && (
            <div className="mt-4 p-4 rounded-xl border border-[#C6904D]/20 bg-[#faf9f7]">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Select your account type to continue:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'SUPPLIER', label: 'Shipper', desc: 'Send goods' },
                  { role: 'CARRIER', label: 'Carrier', desc: 'Deliver goods' },
                  { role: 'YACHT_OWNER', label: 'Yacht Owner', desc: 'Yacht deliveries' },
                  { role: 'CREW', label: 'Crew', desc: 'Crew member' },
                ].map(({ role, label, desc }) => (
                  <button
                    key={role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleRoleSelect(role)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#C6904D] hover:bg-[#C6904D]/5 transition-all text-center disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-[#1a1a1a]">{label}</span>
                    <span className="text-xs text-slate-500">{desc}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setShowRoleSelect(false); setPendingGoogleToken(null) }} className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
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
