import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#102535] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#F7F9FB] mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
        <h2 className="text-xl font-semibold text-[#F7F9FB] mb-2">Page not found</h2>
        <p className="text-sm text-[#6B7C86] mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors">
            Go Home
          </Link>
          <Link href="/marketplace" className="px-6 py-3 border border-white/[0.08] text-[#F7F9FB] rounded-lg text-sm font-semibold hover:bg-[#162E3D] transition-colors">
            Browse Marketplace
          </Link>
        </div>
        <p className="text-xs text-[#6B7C86] mt-8">Need help? <a href="/help" className="text-[#FF6A2A] hover:underline">Contact support</a></p>
      </div>
    </div>
  )
}
