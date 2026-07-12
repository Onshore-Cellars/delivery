'use client'

import { useState } from 'react'

// Sends the full transactional email suite (with a sample invoice + payout PDF)
// to an address so you can eyeball real deliveries. Needs a configured mail
// provider (SMTP_* or RESEND_API_KEY) to actually deliver.
export default function AdminTestEmail({ token }: { token: string }) {
  const [to, setTo] = useState('edward@onshorecellars.com')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ delivered: boolean; sent: number; total: number; note: string } | null>(null)
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to }),
      })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || 'Failed to send')
    } catch { setError('Failed to send') }
    finally { setBusy(false) }
  }

  return (
    <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
      <h3 className="text-lg font-bold text-[var(--c-ink)] mb-1">Send test emails</h3>
      <p className="text-xs text-[var(--c-text-2)] mb-4">
        Delivers the full transactional suite (welcome, booking, payment receipt with invoice PDF, status, delivery, carrier payout with statement PDF, bid, quote) to one address. Requires a mail provider (SMTP or Resend) to actually send.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-[var(--c-text-2)] mb-1">Recipient</label>
          <input type="email" value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
        </div>
        <button onClick={send} disabled={busy || !to} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50 whitespace-nowrap">
          {busy ? 'Sending…' : 'Send test suite'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-[var(--c-error)]">{error}</p>}
      {result && (
        <div className={`mt-3 text-sm ${result.delivered ? 'text-[var(--c-success)]' : 'text-[var(--c-warning)]'}`}>
          {result.delivered ? '✓' : '⚠'} {result.sent}/{result.total} handled — {result.note}
        </div>
      )}
    </div>
  )
}
