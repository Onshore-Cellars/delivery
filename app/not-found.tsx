import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-canvas)] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[var(--c-ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
        <h2 className="text-xl font-semibold text-[var(--c-ink)] mb-2">Page not found</h2>
        <p className="text-sm text-[var(--c-text-3)] mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-[var(--c-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--c-accent-hover)] transition-colors">
            Go Home
          </Link>
          <Link href="/marketplace" className="px-6 py-3 border border-black/10 text-[var(--c-ink)] rounded-lg text-sm font-semibold hover:bg-[var(--c-surface)] transition-colors">
            Browse Marketplace
          </Link>
        </div>
        <p className="text-xs text-[var(--c-text-2)] mt-8">Need help? <a href="/help" className="text-[var(--c-accent)] hover:underline">Contact support</a></p>
      </div>
    </div>
  )
}
