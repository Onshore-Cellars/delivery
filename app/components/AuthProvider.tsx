'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
  phone?: string
  avatarUrl?: string
  verified: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  googleSignIn: (idToken: string, role?: string) => Promise<{ needsRole?: boolean }>
  logout: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: string
  phone?: string
  company?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('yh_token')
    if (!storedToken) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(storedToken)
      } else {
        localStorage.removeItem('yh_token')
        setUser(null)
        setToken(null)
      }
    } catch {
      localStorage.removeItem('yh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    localStorage.setItem('yh_token', data.token)
    setToken(data.token)
    setUser(data.user)
    router.push('/dashboard')
  }

  const register = async (regData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')

    localStorage.setItem('yh_token', data.token)
    setToken(data.token)
    setUser(data.user)
    router.push('/dashboard')
  }

  const googleSignIn = async (idToken: string, role?: string): Promise<{ needsRole?: boolean }> => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'ROLE_REQUIRED') return { needsRole: true }
      throw new Error(data.error || 'Google sign-in failed')
    }

    localStorage.setItem('yh_token', data.token)
    setToken(data.token)
    setUser(data.user)
    router.push('/dashboard')
    return {}
  }

  const logout = () => {
    localStorage.removeItem('yh_token')
    setUser(null)
    setToken(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleSignIn, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
