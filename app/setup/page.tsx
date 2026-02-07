'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SetupPage() {
  const [status, setStatus] = useState<'checking' | 'needs_setup' | 'ready' | 'error' | 'setting_up'>('checking')
  const [message, setMessage] = useState('')
  const [demoAccounts, setDemoAccounts] = useState<{ email: string; role: string }[]>([])

  useEffect(() => {
    fetch('/api/setup')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error')
          setMessage(data.details || 'Cannot connect to database. Make sure you have added a Postgres database in Vercel Storage.')
        } else if (data.initialized) {
          setStatus('ready')
          setMessage(`Database is ready with ${data.userCount} users.`)
        } else {
          setStatus('needs_setup')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Cannot reach the server.')
      })
  }, [])

  const handleSetup = async () => {
    setStatus('setting_up')
    setMessage('Creating tables and seeding demo data...')
    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setStatus('error')
        setMessage(data.details || data.error)
      } else {
        setStatus('ready')
        setMessage(data.message)
        if (data.demo?.accounts) setDemoAccounts(data.demo.accounts)
      }
    } catch {
      setStatus('error')
      setMessage('Setup request failed. Check your database connection.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">DockDrop Setup</h1>
        <p className="text-gray-500 mb-6">Initialize your yacht supply delivery marketplace</p>

        {status === 'checking' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Checking database connection...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800 font-medium">Database Error</p>
              <p className="text-sm text-red-700 mt-1">{message}</p>
            </div>
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm font-medium text-yellow-800">How to fix:</p>
              <ol className="mt-2 text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Go to your Vercel Dashboard</li>
                <li>Click <strong>Storage</strong> tab</li>
                <li>Click <strong>Create Database</strong></li>
                <li>Select <strong>Neon Postgres</strong> (free)</li>
                <li>Connect it to this project</li>
                <li>Redeploy (or come back to this page)</li>
              </ol>
            </div>
            <button onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              Retry Connection
            </button>
          </div>
        )}

        {status === 'needs_setup' && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800 font-medium">Database connected!</p>
              <p className="text-sm text-green-700 mt-1">Click below to create tables and add demo data.</p>
            </div>
            <button onClick={handleSetup}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
              Initialize Database
            </button>
          </div>
        )}

        {status === 'setting_up' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800 font-medium">{message}</p>
            </div>

            {demoAccounts.length > 0 && (
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Demo Accounts (password: password123)</p>
                <div className="space-y-1">
                  {demoAccounts.map(acc => (
                    <p key={acc.email} className="text-sm text-blue-700">
                      <span className="font-medium">{acc.role}:</span> {acc.email}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Link href="/"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium text-center">
                Go to Homepage
              </Link>
              <Link href="/login"
                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium text-center">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
