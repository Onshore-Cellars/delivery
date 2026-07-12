'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-canvas)] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[var(--c-ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>500</h1>
        <h2 className="text-xl font-semibold text-[var(--c-ink)] mb-2">Something went wrong</h2>
        <p className="text-sm text-[var(--c-text-3)] mb-2">An unexpected error occurred. Our team has been notified.</p>
        {error.digest && <p className="text-xs text-[var(--c-text-2)] mb-6">Error ID: {error.digest}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-[var(--c-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--c-accent-hover)] transition-colors">
            Try Again
          </button>
          <a href="/" className="px-6 py-3 border border-black/10 text-[var(--c-ink)] rounded-lg text-sm font-semibold hover:bg-[var(--c-surface)] transition-colors">
            Go Home
          </a>
        </div>
        <p className="text-xs text-[var(--c-text-2)] mt-8">Need help? <a href="/help" className="text-[var(--c-accent)] hover:underline">Contact support</a></p>
      </div>
    </div>
  )
}
