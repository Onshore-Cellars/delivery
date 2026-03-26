'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1F2A] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#F7F9FB] mb-4" style={{ fontFamily: 'var(--font-display)' }}>500</h1>
        <h2 className="text-xl font-semibold text-[#F7F9FB] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#6B7C86] mb-2">An unexpected error occurred. Our team has been notified.</p>
        {error.digest && <p className="text-xs text-slate-400 mb-6">Error ID: {error.digest}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-[#FF6A2A] text-white rounded-lg text-sm font-semibold hover:bg-[#E85A1C] transition-colors">
            Try Again
          </button>
          <a href="/" className="px-6 py-3 border border-white/10 text-[#F7F9FB] rounded-lg text-sm font-semibold hover:bg-[#162E3D] transition-colors">
            Go Home
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-8">Need help? <a href="/help" className="text-[#FF6A2A] hover:underline">Contact support</a></p>
      </div>
    </div>
  )
}
