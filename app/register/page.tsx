'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

function RegisterForm() {
  const { register } = useAuth()
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
      <div className="hidden lg:flex lg:flex-1 hero-gradient pattern-overlay items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-gold-400 font-bold text-2xl">YH</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">The Yachting Logistics Marketplace</h2>
          <p className="text-slate-300 leading-relaxed">
            Provisioners, vendors, yacht management, crew &mdash; share van space, post loads, bid on transport. Built exclusively for the yachting industry.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center">
                <span className="text-gold-400 font-bold text-sm">YH</span>
              </div>
              <span className="text-lg font-bold text-navy-900 tracking-tight">YachtHop</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500">Join the yachting logistics marketplace.</p>
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
                        ? 'border-navy-700 bg-navy-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
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
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
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
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
                placeholder="Min 8 characters"
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-navy-900 text-sm focus:border-navy-400 focus:ring-2 focus:ring-navy-100 transition-all outline-none"
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
