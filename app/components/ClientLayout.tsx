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
      <Navbar />
      <main
        id="main-content"
        className="pt-16 pb-20 md:pb-0"
      >
        {children}
      </main>
    </AuthProvider>
  )
}
