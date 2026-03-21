'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="page-container narrow flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Check Your Email</h2>
          <p className="text-slate-500 mb-6">If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox and spam folder.</p>
          <Link href="/login" className="text-sm text-[#C6904D] hover:underline">Back to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container narrow flex items-center justify-center py-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Forgot Password</h1>
        <p className="text-slate-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Email</label>
            <input type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary !py-3 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-[#1a1a1a]">Back to Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
