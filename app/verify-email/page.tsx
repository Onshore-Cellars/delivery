'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid verification link')
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        })
        const data = await res.json()
        if (res.ok) {
          setSuccess(true)
        } else {
          setError(data.error || 'Verification failed')
        }
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [token, email])

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="text-center">
          <div className="loading-shimmer w-48 h-8 rounded-xl mx-auto" />
          <p className="text-slate-500 mt-4">Verifying your email...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container flex items-center justify-center py-20">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full ${success ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center mx-auto mb-4`}>
          {success ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">{success ? 'Email Verified!' : 'Verification Failed'}</h2>
        <p className="text-slate-500 mb-6">{success ? 'Your email has been verified. You can now use all features.' : error}</p>
        <Link href={success ? '/dashboard' : '/login'} className="btn-primary">
          {success ? 'Go to Dashboard' : 'Back to Login'}
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="page-container flex items-center justify-center py-20">
        <div className="text-center">
          <div className="loading-shimmer w-48 h-8 rounded-xl mx-auto" />
          <p className="text-slate-500 mt-4">Verifying your email...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
