'use client'

import Link from 'next/link'
import { AuthProvider } from './AuthProvider'
import Navbar from './Navbar'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

function Footer() {
  return (
    <footer className="border-t border-[#d2d2d7]/60 bg-white/60">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b]">
          <p>&copy; {new Date().getFullYear()} Onshore Deliver. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">About</Link>
            <Link href="/terms" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Privacy</Link>
            <Link href="/help" className="text-[#86868b] hover:text-[#1d1d1f] hover:no-underline transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const showChrome = !isLandingPage

  return (
    <AuthProvider>
      {showChrome && <Navbar />}
      <main
        id="main-content"
        className={
          showChrome
            ? isAuthPage
              ? 'pt-14 pb-20 md:pb-0 min-h-screen'
              : 'pt-14 pb-20 md:pb-0 min-h-screen bg-[#f5f5f7]'
            : ''
        }
      >
        {children}
      </main>
      {showChrome && !isAuthPage && <Footer />}
    </AuthProvider>
  )
}
