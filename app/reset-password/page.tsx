'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, token: tokenParam, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page-container narrow flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#9ED36A]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#9ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F7F9FB] mb-2">Password Reset</h2>
          <p className="text-[#6B7C86] mb-6">Your password has been updated successfully.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container narrow flex items-center justify-center py-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#F7F9FB] mb-2">Reset Password</h1>
        <p className="text-[#6B7C86] mb-6">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 text-sm text-red-400">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-[#F7F9FB] mb-1.5">New Password</label>
            <input type="password" required minLength={8} className="w-full px-4 py-3 rounded-xl border border-white/[0.08] text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars, upper+lower+number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F7F9FB] mb-1.5">Confirm Password</label>
            <input type="password" required minLength={8} className="w-full px-4 py-3 rounded-xl border border-white/[0.08] text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary !py-3 disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="page-container narrow flex items-center justify-center py-20">
        <div className="w-full max-w-md text-center text-[#6B7C86]">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
