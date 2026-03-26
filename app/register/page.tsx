'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: defaultRole || 'SUPPLIER', company: '', phone: '',
    canCarry: defaultRole === 'CARRIER',
    canShip: defaultRole !== 'CARRIER' || !defaultRole,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
    if (!acceptedTerms) { setError('You must accept the Terms of Service'); return }
    if (!formData.role) { setError('Please select an account type'); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('Password must include uppercase, lowercase, and a number'); return
    }
    setError('')
    setLoading(true)
    try { await register({ ...formData, acceptedTerms }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Registration failed') }
    finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const capabilities = [
    { key: 'canCarry', label: 'I deliver goods', desc: 'Drive & deliver to ports, marinas, yachts',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    },
    { key: 'canShip', label: 'I need deliveries', desc: 'Send provisions, equipment, supplies',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
  ]

  const roles = [
    { value: 'CARRIER', label: 'Carrier / Driver', desc: 'Transport company or freelance driver' },
    { value: 'SUPPLIER', label: 'Provisioner / Vendor', desc: 'Supply goods, food, wine, equipment' },
    { value: 'YACHT_OWNER', label: 'Owner / Mgmt', desc: 'Yacht owner or management company' },
    { value: 'CREW', label: 'Crew', desc: 'Work on yachts, order supplies' },
  ]

  const inputClass = "w-full px-4 py-3.5 rounded-xl border border-white/10 bg-[#162E3D] text-[#F7F9FB] text-[15px] placeholder:text-slate-400 focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 transition-all outline-none"

  return (
    <div className="flex flex-col bg-[#162E3D]">
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center mb-10 hover:no-underline">
            <Image src="/logo.png" alt="ON.SHORE Delivery" width={36} height={36} className="rounded-sm" />
          </Link>

          <h1 className="text-2xl sm:text-3xl font-light text-[#F7F9FB] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Create your account</h1>
          <p className="mt-2 text-sm sm:text-base text-[#6B7C86]">Join the delivery logistics marketplace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30" role="alert">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* What do you need? */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FB] mb-3">What do you need?</label>
              <div className="grid grid-cols-2 gap-2.5">
                {capabilities.map((cap) => {
                  const active = formData[cap.key as 'canCarry' | 'canShip']
                  return (
                    <button
                      key={cap.key}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, [cap.key]: !active }
                        // Auto-set role based on capabilities
                        if (updated.canCarry && !updated.canShip) updated.role = 'CARRIER'
                        else if (!updated.canCarry && updated.canShip) updated.role = formData.role === 'CARRIER' ? 'SUPPLIER' : formData.role
                        setFormData(updated)
                      }}
                      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        active ? 'border-[#FF6A2A] bg-[#FF6A2A]/10' : 'border-white/10 hover:border-white/15 bg-[#162E3D]'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${active ? 'text-[#FF6A2A]' : 'text-slate-400'}`}>{cap.icon}</div>
                      <div>
                        <span className={`text-sm font-bold block ${active ? 'text-[#FF6A2A]' : 'text-[#9AADB8]'}`}>{cap.label}</span>
                        <span className="text-[11px] text-[#6B7C86] leading-tight">{cap.desc}</span>
                      </div>
                      {active && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FF6A2A] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Select both if you deliver AND need deliveries. You can change this later.</p>
            </div>

            {/* Role / account type */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FB] mb-3">Account type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`relative flex flex-col text-center p-3 rounded-xl border-2 transition-all ${
                      formData.role === role.value
                        ? 'border-[#FF6A2A] bg-[#FF6A2A]/10'
                        : 'border-white/10 hover:border-white/15 bg-[#162E3D]'
                    }`}
                  >
                    <span className={`text-xs font-bold block leading-tight ${formData.role === role.value ? 'text-[#FF6A2A]' : 'text-[#9AADB8]'}`}>
                      {role.label}
                    </span>
                    <span className="text-[10px] text-[#6B7C86] mt-1 leading-tight hidden sm:block">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#F7F9FB] mb-2">Full Name</label>
              <input id="name" name="name" type="text" required className={inputClass} placeholder="John Smith" value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#F7F9FB] mb-2">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder="you@company.com" value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#F7F9FB] mb-2">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" minLength={8} className={`${inputClass} !pr-12`} placeholder="Min 8 chars, upper + lower + number" value={formData.password} onChange={handleChange} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#9AADB8] transition-colors"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-[#F7F9FB] mb-2">Company</label>
                <input id="company" name="company" type="text" className={inputClass} placeholder="Optional" value={formData.company} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#F7F9FB] mb-2">Phone</label>
                <input id="phone" name="phone" type="tel" className={inputClass} placeholder="Optional" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-white/15 text-[#FF6A2A] focus:ring-[#FF6A2A]" />
              <span className="text-sm text-[#9AADB8]">
                I agree to the <Link href="/terms" className="text-[#FF6A2A] underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#FF6A2A] underline">Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading || !acceptedTerms} className="w-full btn-primary !py-3.5 !text-[15px] disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#162E3D] px-3 text-slate-400 uppercase tracking-wider font-medium">or</span></div>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            pendingGoogleToken ? (
              <button onClick={handleGoogleWithRole} disabled={loading || !formData.role}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded border border-white/10 bg-[#162E3D] text-sm font-medium text-[#F7F9FB] hover:bg-[#0B1F2A] transition-colors disabled:opacity-50">
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
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded border border-white/10 bg-[#162E3D] text-sm font-medium text-[#F7F9FB] hover:bg-[#0B1F2A] transition-colors disabled:opacity-50"
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

          <p className="mt-8 text-center text-sm text-[#6B7C86]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#FF6A2A] hover:text-[#FF8F5A]">Sign in</Link>
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
