'use client'

import { AuthProvider } from './AuthProvider'
import Navbar from './Navbar'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  return (
    <AuthProvider>
      {!isLandingPage && <Navbar />}
      <main id="main-content" className={!isLandingPage ? 'pt-12' : ''}>
        {children}
      </main>
    </AuthProvider>
  )
}
