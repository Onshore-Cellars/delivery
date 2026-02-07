'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try { setUser(JSON.parse(userData)) } catch { /* ignore */ }
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">DockDrop</Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link href="/marketplace"
                className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/marketplace') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>
                Marketplace
              </Link>
              {user && (
                <Link href="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>
                  Dashboard
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link href="/admin"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/admin') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                <Link href="/profile"
                  className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>
                  {user.name}
                </Link>
                <button onClick={handleLogout} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900 font-medium">Login</Link>
                <Link href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/marketplace" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
              Marketplace
            </Link>
            {user && (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Profile
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    Admin
                  </Link>
                )}
                <button onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50 rounded-md">
                  Logout
                </button>
              </>
            )}
            {!user && (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50 rounded-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
