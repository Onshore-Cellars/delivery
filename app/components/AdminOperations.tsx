'use client'

import { useCallback, useEffect, useState } from 'react'

type Task = {
  id: string; team: string; kind: string; title: string; summary: string; reasoning: string
  confidence: number; status: string; createdAt: string; executionResult?: string | null; error?: string | null
}
type CatalogueItem = { team: string; kind: string; label: string; description: string; policy: { autoApprove: boolean; minConfidence: number } }
type Data = { tasks: Task[]; catalogue: CatalogueItem[]; counts: Record<string, number> }

const TEAM_STYLE: Record<string, string> = {
  OPS: 'bg-[var(--c-info)]/12 text-[var(--c-info)]',
  SUPPORT: 'bg-[var(--c-brass)]/15 text-[var(--c-brass-text)]',
  MARKETING: 'bg-[var(--c-success)]/12 text-[var(--c-success)]',
}
const STATUSES = ['PENDING', 'ALL', 'EXECUTED', 'REJECTED', 'FAILED']

export default function AdminOperations({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/agent-tasks?status=${status}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [status, token])

  useEffect(() => { load() }, [load])

  const runNow = async () => {
    setRunning(true); setMsg('')
    try {
      const res = await fetch('/api/admin/agent-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'run' }) })
      const d = await res.json()
      if (res.ok) setMsg(`Ran agents: ${d.summary.created} new proposal(s), ${d.summary.autoExecuted} auto-executed, ${d.summary.skipped} skipped.`)
      await load()
    } catch { setMsg('Run failed') } finally { setRunning(false) }
  }

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id)
    try {
      await fetch(`/api/admin/agent-tasks/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, feedback: feedback[id] || '' }) })
      await load()
    } catch { /* ignore */ } finally { setBusy(null) }
  }

  const setPolicy = async (c: CatalogueItem, patch: { autoApprove?: boolean; minConfidence?: number }) => {
    await fetch('/api/admin/agent-policies', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ team: c.team, kind: c.kind, ...patch }) })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-[var(--c-ink)] mb-1">Operations agents</h3>
            <p className="text-xs text-[var(--c-text-2)]">Agent teams propose actions here for your approval. Approvals/rejections train them; graduate a category to auto-run in Automation below.</p>
          </div>
          <button onClick={runNow} disabled={running} className="px-4 py-2 rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">{running ? 'Running…' : 'Run agents now'}</button>
        </div>
        {msg && <p className="mt-3 text-sm text-[var(--c-text-2)]">{msg}</p>}
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {STATUSES.map(st => (
            <button key={st} onClick={() => setStatus(st)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${status === st ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-canvas-2)] text-[var(--c-text-2)]'}`}>
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}{data?.counts?.[st] != null && st !== 'ALL' ? ` (${data.counts[st]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Queue */}
      <div className="space-y-3">
        {loading ? <p className="text-[var(--c-text-3)] text-sm">Loading…</p>
          : !data || data.tasks.length === 0 ? (
            <div className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-8 text-center text-[var(--c-text-3)]">Nothing here. Run the agents to generate proposals.</div>
          ) : data.tasks.map(t => (
            <div key={t.id} className="bg-[var(--c-surface)] rounded-xl border border-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${TEAM_STYLE[t.team] || ''}`}>{t.team}</span>
                    <span className="text-[11px] text-[var(--c-text-3)]">{Math.round(t.confidence * 100)}% confidence</span>
                    {t.status !== 'PENDING' && <span className="text-[11px] font-semibold text-[var(--c-text-2)]">· {t.status}</span>}
                  </div>
                  <div className="font-semibold text-[var(--c-ink)]">{t.title}</div>
                  <div className="text-sm text-[var(--c-text-2)] mt-0.5">{t.summary}</div>
                  {t.reasoning && <div className="text-xs text-[var(--c-text-3)] mt-1 italic">{t.reasoning}</div>}
                  {t.executionResult && <div className="text-xs text-[var(--c-success)] mt-1">✓ {t.executionResult}</div>}
                  {t.error && <div className="text-xs text-[var(--c-error)] mt-1">✕ {t.error}</div>}
                </div>
              </div>
              {t.status === 'PENDING' && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input value={feedback[t.id] || ''} onChange={e => setFeedback(f => ({ ...f, [t.id]: e.target.value }))} placeholder="Optional feedback (trains the agent)" className="flex-1 px-3 py-1.5 rounded-lg border border-black/10 text-xs text-[var(--c-ink)] outline-none focus:border-[var(--c-accent)]" />
                  <div className="flex gap-2">
                    <button disabled={busy === t.id} onClick={() => decide(t.id, 'approve')} className="px-3 py-1.5 rounded-lg bg-[var(--c-accent)] text-white text-xs font-medium hover:bg-[var(--c-accent-hover)] disabled:opacity-50">Approve &amp; run</button>
                    <button disabled={busy === t.id} onClick={() => decide(t.id, 'reject')} className="px-3 py-1.5 rounded-lg border border-black/10 text-xs font-medium text-[var(--c-text-2)] hover:bg-[var(--c-canvas-2)] disabled:opacity-50">Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Automation policies */}
      {data && (
        <div className="bg-[var(--c-surface)] rounded-2xl border border-black/10 shadow-sm p-6">
          <h3 className="text-base font-bold text-[var(--c-ink)] mb-1">Automation</h3>
          <p className="text-xs text-[var(--c-text-2)] mb-4">Turn on auto-approval for a category once you trust it. Proposals at or above the confidence threshold will then run without review.</p>
          <div className="space-y-2">
            {data.catalogue.map(c => (
              <div key={`${c.team}:${c.kind}`} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--c-border)] last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--c-ink)]"><span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${TEAM_STYLE[c.team] || ''}`}>{c.team}</span>{c.label}</div>
                  <div className="text-xs text-[var(--c-text-3)]">{c.description}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.policy.autoApprove && (
                    <select value={c.policy.minConfidence} onChange={e => setPolicy(c, { minConfidence: Number(e.target.value) })} className="px-2 py-1 rounded border border-black/10 text-xs text-[var(--c-ink)]">
                      {[0.7, 0.8, 0.85, 0.9, 0.95].map(v => <option key={v} value={v}>≥ {Math.round(v * 100)}%</option>)}
                    </select>
                  )}
                  <button type="button" role="switch" aria-checked={c.policy.autoApprove} onClick={() => setPolicy(c, { autoApprove: !c.policy.autoApprove })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${c.policy.autoApprove ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-canvas-2)]'}`}>
                    <span className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-[var(--c-surface)] shadow transition-transform ${c.policy.autoApprove ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--c-text-3)] mt-4">Auto-approval executes real actions (payouts, notifications, listing changes) without review. Enable only for categories you've watched approve reliably.</p>
        </div>
      )}
    </div>
  )
}
