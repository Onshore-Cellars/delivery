import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { sendEmail } from '@/lib/email'
import { llmJson, aiEnabled } from './llm'

// The morning operations digest: one snapshot of what the agent teams did in
// the last 24h and where the business stands, delivered to every admin as a
// notification and (if email is configured) an email. When a key is set an AI
// writes the narrative; otherwise a deterministic template is used.

export interface DigestResult {
  ok: boolean
  metrics: Record<string, number>
  agentActivity: { team: string; created: number; executed: number; pending: number }[]
  headline: string
  body: string
  emailed: boolean
  error?: string
}

export async function buildOpsDigest(): Promise<DigestResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [newBookings, paidBookings, openDisputes, unpaid, pendingPayouts, pendingProposals, recentTasks] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: since } } }),
    prisma.booking.count({ where: { paidAt: { gte: since } } }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    prisma.booking.count({ where: { paymentStatus: { in: ['PENDING', 'PROCESSING'] }, status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'DELIVERED', paymentStatus: 'PAID', payoutTransferredAt: null } }),
    prisma.agentTask.count({ where: { status: 'PENDING' } }),
    prisma.agentTask.findMany({
      where: { OR: [{ createdAt: { gte: since } }, { executedAt: { gte: since } }] },
      select: { team: true, status: true, createdAt: true, executedAt: true, title: true },
      take: 500,
    }),
  ])

  // Revenue captured in the window (gross), from the ledger.
  const charges = await prisma.transaction.findMany({
    where: { type: 'CHARGE', createdAt: { gte: since } },
    select: { amount: true, currency: true },
  })
  const revenueByCcy = new Map<string, number>()
  for (const c of charges) revenueByCcy.set(c.currency, (revenueByCcy.get(c.currency) || 0) + c.amount)
  const revenueLine = [...revenueByCcy.entries()].map(([ccy, amt]) => `${ccy} ${amt.toFixed(2)}`).join(', ') || 'none'

  // Per-team agent activity in the window.
  const teams = ['OPS', 'SUPPORT', 'MARKETING', 'FINANCE', 'IT', 'GROWTH']
  const agentActivity = teams.map(team => {
    const forTeam = recentTasks.filter(t => t.team === team)
    return {
      team,
      created: forTeam.filter(t => t.createdAt >= since).length,
      executed: forTeam.filter(t => t.executedAt && t.executedAt >= since).length,
      pending: 0, // per-team pending is not broken out; see metrics.pendingProposals
    }
  })

  const metrics: Record<string, number> = {
    newBookings, paidBookings, openDisputes, unpaidBookings: unpaid,
    pendingPayouts, pendingProposals, revenueCurrencies: revenueByCcy.size,
  }

  // Build the narrative.
  const factLines = [
    `New bookings: ${newBookings}`,
    `Payments taken: ${paidBookings} (revenue ${revenueLine})`,
    `Open disputes: ${openDisputes}`,
    `Unpaid/pending bookings: ${unpaid}`,
    `Delivered awaiting payout: ${pendingPayouts}`,
    `Agent proposals awaiting your approval: ${pendingProposals}`,
    ...agentActivity.filter(a => a.created || a.executed).map(a => `${a.team}: ${a.created} proposed, ${a.executed} executed`),
  ]

  let headline = `Onshore daily ops — ${pendingProposals} awaiting approval`
  let body = factLines.join('\n')

  if (aiEnabled()) {
    const ai = await llmJson<{ headline: string; body: string }>({
      system: `You are Onshore's chief of staff writing a concise morning operations brief for the founder. Be direct and prioritised: lead with anything that needs action (approvals, disputes, stuck payouts), then the numbers. Plain, calm, no fluff. 4-7 short sentences max.`,
      prompt: `Write today's brief from these facts:\n${factLines.join('\n')}\n\nReturn JSON: { "headline": string (<=70 chars), "body": string (plain text, may use short line breaks) }.`,
      maxTokens: 500,
      smart: false,
    })
    if (ai?.body) { headline = ai.headline || headline; body = ai.body }
  }

  // Deliver to every admin.
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true, name: true } })
  let emailed = false
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
    <h2 style="color:#0C5C54;margin:0 0 4px">${headline}</h2>
    <p style="color:#555;font-size:13px;margin:0 0 16px">Onshore operations · last 24 hours</p>
    <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.5;color:#222">${body.replace(/</g, '&lt;')}</pre>
    <p style="margin-top:20px"><a href="${process.env.NEXTAUTH_URL || ''}/admin" style="background:#0C5C54;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">Open the operations queue →</a></p>
  </div>`

  for (const a of admins) {
    await createNotification({ userId: a.id, type: 'SYSTEM', title: headline, message: body.slice(0, 500), linkUrl: '/admin', sendEmailNotification: false }).catch(() => {})
    if (a.email) {
      const sent = await sendEmail({ to: a.email, subject: headline, html }).catch(() => false)
      if (sent) emailed = true
    }
  }

  return { ok: true, metrics, agentActivity, headline, body, emailed }
}
