'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: 'var(--c-canvas)' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--c-ink)', marginBottom: '1rem' }}>500</h1>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--c-ink)', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--c-text-2)', marginBottom: '1.5rem' }}>A critical error occurred. Please try again.</p>
            {error.digest && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>Error ID: {error.digest}</p>}
            <button onClick={reset} style={{ padding: '0.75rem 1.5rem', background: 'var(--c-accent)', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
