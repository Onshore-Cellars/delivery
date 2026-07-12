import prisma from '@/lib/prisma'
import type { Agent, ProposedTask } from './types'

// Propose a re-engagement email campaign (as a DRAFT) when there's a sizeable
// segment of verified contacts who haven't been emailed recently.
const reengage: Agent = {
  team: 'MARKETING',
  kind: 'reengage-campaign',
  label: 'Re-engagement campaign',
  description: 'Draft a campaign to verified contacts not emailed in 90 days.',
  async run() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const segment = await prisma.crmContact.count({
      where: {
        email: { not: null }, opted_out: false,
        NOT: { tags: { contains: 'unverified', mode: 'insensitive' } },
        OR: [{ lastEmailed: null }, { lastEmailed: { lte: ninetyDaysAgo } }],
      },
    })
    if (segment < 10) return [] // not worth a campaign yet

    const subject = 'Space on the water — Onshore yacht logistics'
    const htmlBody = `<p>Hi {{name}},</p>
<p>Onshore moves cargo along the Mediterranean and UK South Coast on vans already making the trip — insured, tracked, and paid only on delivery.</p>
<p>If you've got equipment, provisions or parts to move, it's worth a quick look at what's running your way.</p>
<p><a href="https://onshore.delivery/marketplace">Browse available space →</a></p>
<p>— The Onshore team</p>`

    return [{
      team: 'MARKETING', kind: 'reengage-campaign',
      title: `Draft re-engagement campaign (${segment} contacts)`,
      summary: `${segment} verified contacts haven't been emailed in 90+ days. Create a draft campaign to re-engage them (you review & send).`,
      reasoning: 'A dormant but verified segment is the cheapest source of new bookings; a draft keeps a human in the loop before sending.',
      confidence: 0.75,
      payload: { name: `Re-engagement — ${new Date().toISOString().slice(0, 10)}`, subject, htmlBody, segmentSize: segment },
      dedupeKey: `reengage-campaign:${new Date().toISOString().slice(0, 7)}`, // once a month
    }] satisfies ProposedTask[]
  },
  async execute(payload) {
    try {
      const campaign = await prisma.crmCampaign.create({
        data: {
          name: String(payload.name || 'Re-engagement campaign'),
          subject: String(payload.subject || 'Onshore'),
          htmlBody: String(payload.htmlBody || ''),
          status: 'draft',
        },
      })
      return { ok: true, result: `Draft campaign created (id ${campaign.id}) — review and send from CRM.` }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Draft creation failed' } }
  },
}

export const marketingAgents = [reengage]
