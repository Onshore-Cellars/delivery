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
    name: '', email: '', password: '', role: defaultRole || '', company: '', phone: '',
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
    } catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed') }
    finally { setLoading(false) }
  }, [googleSignIn, formData.role])

  const handleGoogleWithRole = async () => {
    if (!pendingGoogleToken || !formData.role) { setError('Please select your account type first'); return }
    setError('')
    setLoading(true)
    try { await googleSignIn(pendingGoogleToken, formData.role) }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({ client_id: clientId, callback: handleGoogleResponse })
      const btnEl = document.getElementById('google-signup-btn')
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'pill' })
      }
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [handleGoogleResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.role) { setError('Please select an account type'); return }
    setError('')
    setLoading(true)
    try { await register(formData) }
    catch (err) { setError(err instanceof Error ? err.message : 'Registration failed') }
    finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const roles = [
    { value: 'CARRIER', label: 'Carrier / Driver', desc: 'I deliver goods to ports & marinas',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { value: 'SUPPLIER', label: 'Provisioner', desc: 'I supply goods & provisions',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
    { value: 'YACHT_OWNER', label: 'Owner / Mgmt', desc: 'I manage yachts & need deliveries',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
    },
    { value: 'CREW', label: 'Crew', desc: 'I work on yachts & order supplies',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
  ]

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[#0f172a] text-[15px] placeholder:text-slate-400 focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 transition-all outline-none"

  return (
    <div className="flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 hover:no-underline">
            <div className="w-8 h-8 rounded-sm bg-[#C6904D] flex items-center justify-center">
              <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>O</span>
            </div>
            <span className="text-lg font-semibold text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Onshore</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-light text-[#1a1a1a] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Create your account</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500">Join the delivery logistics marketplace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Role selection */}
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-3">I am a...</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`relative flex flex-col items-center text-center p-3.5 rounded-xl border-2 transition-all ${
                      formData.role === role.value
                        ? 'border-[#C6904D] bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`mb-2 ${formData.role === role.value ? 'text-[#C6904D]' : 'text-slate-400'}`}>
                      {role.icon}
                    </div>
                    <span className={`text-xs font-bold block leading-tight ${formData.role === role.value ? 'text-[#9a7039]' : 'text-slate-700'}`}>
                      {role.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 leading-tight hidden sm:block">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#0f172a] mb-2">Full Name</label>
              <input id="name" name="name" type="text" required className={inputClass} placeholder="John Smith" value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#0f172a] mb-2">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@company.com" value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#0f172a] mb-2">Password</label>
              <input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} className={inputClass} placeholder="Min 8 characters" value={formData.password} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-[#0f172a] mb-2">Company</label>
                <input id="company" name="company" type="text" className={inputClass} placeholder="Optional" value={formData.company} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#0f172a] mb-2">Phone</label>
                <input id="phone" name="phone" type="tel" className={inputClass} placeholder="Optional" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary !py-3.5 !text-[15px] disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8e4de]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 uppercase tracking-wider font-medium">or</span></div>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            pendingGoogleToken ? (
              <button onClick={handleGoogleWithRole} disabled={loading || !formData.role}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded border border-[#e8e4de] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google as {formData.role ? roles.find(r => r.value === formData.role)?.label : '...'}
              </button>
            ) : (
              <div id="google-signup-btn" className="flex justify-center" />
            )
          ) : (
            <button
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded border border-[#e8e4de] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors disabled:opacity-50"
              onClick={() => setError('Google sign-in requires configuration. Please use email/password.')}
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
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#C6904D] hover:text-[#b07d3f]">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-xl" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
