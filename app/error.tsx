'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#1a1a1a] mb-4" style={{ fontFamily: 'var(--font-display)' }}>500</h1>
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 mb-2">An unexpected error occurred. Our team has been notified.</p>
        {error.digest && <p className="text-xs text-slate-400 mb-6">Error ID: {error.digest}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors">
            Try Again
          </button>
          <a href="/" className="px-6 py-3 border border-[#e8e4de] text-[#1a1a1a] rounded-lg text-sm font-semibold hover:bg-white transition-colors">
            Go Home
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-8">Need help? <a href="/help" className="text-[#C6904D] hover:underline">Contact support</a></p>
      </div>
    </div>
  )
}
