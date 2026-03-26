'use client'

import Link from 'next/link'
import { AuthProvider, useAuth } from './AuthProvider'
import Navbar from './Navbar'
import CookieConsent from './CookieConsent'
import PushNotificationPrompt from './PushNotificationPrompt'
import AIChatWidget from './AIChatWidget'
import { I18nProvider } from '@/lib/i18n'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0B1F2A]">
      <div className="site-container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7C86]">
          <p className="font-[family-name:var(--font-display)] text-sm font-light text-[#6B7C86]">&copy; {new Date().getFullYear()} Onshore Group · ON.SHORE Delivery</p>
          <div className="flex gap-6">
            <Link href="/about" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">About</Link>
            <Link href="/terms" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Privacy</Link>
            <Link href="/help" className="text-[#6B7C86] hover:text-white hover:no-underline transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function PushPromptWrapper() {
  const { token } = useAuth()
  if (!token) return null
  return <PushNotificationPrompt token={token} />
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(pathname)

  return (
    <I18nProvider>
      <AuthProvider>
        <Navbar transparent={isLandingPage} />
        <main
          id="main-content"
          className={
            isLandingPage
              ? ''
              : isAuthPage
                ? 'pt-16 pb-20 md:pb-0 min-h-screen'
                : 'pt-16 pb-20 md:pb-0 min-h-screen bg-[#0B1F2A]'
          }
        >
          {children}
        </main>
        {!isLandingPage && !isAuthPage && <Footer />}
        <CookieConsent />
        <PushPromptWrapper />
        <AIChatWidget />
      </AuthProvider>
    </I18nProvider>
  )
}
