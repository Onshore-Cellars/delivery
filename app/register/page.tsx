'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

function RegisterForm() {
  const { register, googleSignIn } = useAuth()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || ''

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole || '',
    company: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setError('')
    setLoading(true)
    try {
      const result = await googleSignIn(response.credential, formData.role || undefined)
      if (result.needsRole) {
        setPendingGoogleToken(response.credential)
        setError('Please select your account type above, then click "Continue with Google" below.')
        setLoading(false)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [googleSignIn, formData.role])

  const handleGoogleWithRole = async () => {
    if (!pendingGoogleToken || !formData.role) {
      setError('Please select your account type first')
      return
    }
    setError('')
    setLoading(true)
    try {
      await googleSignIn(pendingGoogleToken, formData.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

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
      const btnEl = document.getElementById('google-signup-btn')
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
          shape: 'pill',
        })
      }
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [handleGoogleResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.role) {
      setError('Please select an account type')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const roles = [
    {
      value: 'CARRIER',
      label: 'Carrier / Driver',
      desc: 'I have van space on yacht routes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      value: 'SUPPLIER',
      label: 'Provisioner / Vendor',
      desc: 'I supply goods to the yachting industry',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      value: 'YACHT_OWNER',
      label: 'Owner / Management',
      desc: 'I manage yachts and need deliveries',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex lg:flex-1 hero-gradient pattern-overlay items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-gold-500/[0.05] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] bg-sea-500/[0.04] rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.08] backdrop-blur-md border border-white/[0.12] flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <span className="text-gold-400 font-bold text-3xl">YH</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-5 tracking-[-0.02em]">The Yachting Logistics Marketplace</h2>
          <p className="text-slate-300/90 leading-relaxed text-lg font-light">
            Provisioners, vendors, yacht management, crew &mdash; share van space, post loads, bid on transport. Built exclusively for the yachting industry.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center shadow-sm">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">YachtHop</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-[-0.02em]">Create your account</h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-500 leading-relaxed">Join the yachting logistics marketplace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-2">I am a...</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`relative flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0 p-3.5 sm:p-3 rounded-xl border-2 transition-all ${
                      formData.role === role.value
                        ? 'border-navy-700 bg-navy-50 shadow-[0_0_0_1px_rgba(15,23,42,0.05)]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    <div className={`sm:mb-1.5 ${formData.role === role.value ? 'text-navy-700' : 'text-slate-400'}`}>
                      {role.icon}
                    </div>
                    <div className="sm:text-center">
                      <span className={`text-sm sm:text-xs font-semibold block ${formData.role === role.value ? 'text-navy-900' : 'text-slate-700'}`}>
                        {role.label}
                      </span>
                      <span className="text-xs sm:text-[10px] text-slate-500 mt-0.5 leading-tight block">{role.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy-900 mb-1.5">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-1.5">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-navy-900 mb-1.5">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
                  placeholder="Optional"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-navy-900 mb-1.5">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 focus:bg-white transition-all outline-none"
                  placeholder="Optional"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
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
                  Creating account...
                </span>
              ) : 'Create Account'}
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
              {pendingGoogleToken ? (
                <button
                  onClick={handleGoogleWithRole}
                  disabled={loading || !formData.role}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-navy-900 transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              ) : (
                <div id="google-signup-btn" className="flex justify-center" />
              )}
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loading-shimmer w-96 h-96 rounded-xl" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
