import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'

// Growth / liquidity agents. They read demand and supply signals and propose
// the cheapest actions that raise booking volume: fill routes people are
// searching, wake dormant shippers, and get idle carriers listing again.

const norm = (s: string) => s.trim().toLowerCase()

// Routes people are requesting quotes on but that have no active supply.
const unmetDemand: Agent = {
  team: 'GROWTH',
  kind: 'unmet-route-demand',
  label: 'Surface unmet route demand',
  description: 'Routes with recent quote requests but no active listings.',
  async run() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const quotes = await prisma.quote.findMany({
      where: { createdAt: { gte: since } },
      select: { originPort: true, destinationPort: true },
      take: 500,
    })
    if (!quotes.length) return []
    // Count demand per route.
    const demand = new Map<string, { origin: string; dest: string; count: number }>()
    for (const q of quotes) {
      const key = `${norm(q.originPort)}→${norm(q.destinationPort)}`
      const cur = demand.get(key) || { origin: q.originPort, dest: q.destinationPort, count: 0 }
      cur.count++; demand.set(key, cur)
    }
    // Which routes have active supply right now?
    const active = await prisma.listing.findMany({
      where: { status: 'ACTIVE', listingType: 'SPACE_AVAILABLE' },
      select: { originPort: true, destinationPort: true },
      take: 1000,
    })
    const supplied = new Set(active.map(l => `${norm(l.originPort)}→${norm(l.destinationPort)}`))

    const gaps = [...demand.entries()]
      .filter(([key, v]) => v.count >= 2 && !supplied.has(key))
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)

    return gaps.map(([, v]): ProposedTask => ({
      team: 'GROWTH', kind: 'unmet-route-demand',
      title: `Unmet demand: ${v.origin} → ${v.dest}`,
      summary: `${v.count} quote request(s) in the last 30 days on this route with no active listing. Recruit a carrier or run a targeted campaign to capture it.`,
      reasoning: 'Demand with zero supply is lost revenue; the route is a concrete recruiting/marketing target.',
      confidence: 0.75,
      payload: { origin: v.origin, dest: v.dest, count: v.count },
      dedupeKey: `unmet-route-demand:${norm(v.origin)}→${norm(v.dest)}:${new Date().toISOString().slice(0, 7)}`,
    }))
  },
  async execute(payload) {
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Growth: unmet route demand', message: `${payload.count} request(s) on ${payload.origin} → ${payload.dest} with no supply. Consider recruiting a carrier or targeting this route.`, linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: 'Route flagged to admins for recruiting/marketing' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Flag failed' } }
  },
}

// Shippers who used to book but have gone quiet — a warm re-engagement target.
const dormantShipper: Agent = {
  team: 'GROWTH',
  kind: 'dormant-shipper',
  label: 'Re-engage dormant shippers',
  description: 'Shippers with past paid bookings but none in 60+ days.',
  async run() {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    // Shippers who have paid before…
    const paid = await prisma.booking.findMany({
      where: { paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] } },
      select: { shipperId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    })
    const lastByShipper = new Map<string, Date>()
    for (const b of paid) {
      if (!lastByShipper.has(b.shipperId)) lastByShipper.set(b.shipperId, b.createdAt)
    }
    const dormantIds = [...lastByShipper.entries()].filter(([, d]) => d <= cutoff).map(([id]) => id)
    if (!dormantIds.length) return []
    const shippers = await prisma.user.findMany({
      where: { id: { in: dormantIds.slice(0, 200) }, role: { not: 'ADMIN' } },
      select: { id: true, name: true, company: true },
      take: 25,
    })
    return shippers.map((s): ProposedTask => {
      const last = lastByShipper.get(s.id)!
      const days = Math.floor((Date.now() - last.getTime()) / 86400000)
      return {
        team: 'GROWTH', kind: 'dormant-shipper',
        title: `Re-engage ${s.company || s.name}`,
        summary: `Last booked ${days} days ago. Send a friendly nudge highlighting space running their way.`,
        confidence: 0.72,
        payload: { shipperId: s.id, name: s.name },
        relatedType: 'user', relatedId: s.id,
        dedupeKey: `dormant-shipper:${s.id}:${new Date().toISOString().slice(0, 7)}`,
      }
    })
  },
  async execute(payload) {
    const shipperId = String(payload.shipperId || '')
    if (!shipperId) return { ok: false, error: 'Missing shipperId' }
    try {
      await createNotification({
        userId: shipperId, type: 'SYSTEM', title: 'Space is running your way',
        message: `It's been a while — vans are moving cargo along your usual routes now, insured and paid on delivery. Take a look at what's available.`,
        linkUrl: '/marketplace',
      })
      return { ok: true, result: 'Re-engagement nudge sent' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Nudge failed' } }
  },
}

// Carriers who have delivered before but have nothing listed right now.
const relistCarrier: Agent = {
  team: 'GROWTH',
  kind: 'relist-carrier',
  label: 'Nudge idle carriers to list',
  description: 'Carriers who have delivered before but have no active listing.',
  async run() {
    // Carriers with at least one delivered booking on their listings.
    const delivered = await prisma.booking.findMany({
      where: { status: 'DELIVERED' },
      select: { listing: { select: { carrierId: true } } },
      take: 2000,
    })
    const carrierIds = [...new Set(delivered.map(b => b.listing.carrierId))]
    if (!carrierIds.length) return []
    // Of those, which have zero active listings now?
    const withActive = await prisma.listing.findMany({
      where: { carrierId: { in: carrierIds }, status: 'ACTIVE' },
      select: { carrierId: true },
    })
    const activeSet = new Set(withActive.map(l => l.carrierId))
    const idle = carrierIds.filter(id => !activeSet.has(id)).slice(0, 200)
    if (!idle.length) return []
    const carriers = await prisma.user.findMany({
      where: { id: { in: idle }, role: { not: 'ADMIN' } },
      select: { id: true, name: true, company: true },
      take: 25,
    })
    return carriers.map((c): ProposedTask => ({
      team: 'GROWTH', kind: 'relist-carrier',
      title: `Nudge ${c.company || c.name} to list again`,
      summary: `Has delivered before but has no active listing. A reminder to post their next trip keeps supply flowing.`,
      confidence: 0.72,
      payload: { carrierId: c.id },
      relatedType: 'user', relatedId: c.id,
      dedupeKey: `relist-carrier:${c.id}:${new Date().toISOString().slice(0, 7)}`,
    }))
  },
  async execute(payload) {
    const carrierId = String(payload.carrierId || '')
    if (!carrierId) return { ok: false, error: 'Missing carrierId' }
    try {
      await createNotification({
        userId: carrierId, type: 'SYSTEM', title: 'Got a trip coming up?',
        message: `List your next run in a minute and fill the spare space — shippers are searching your routes. You only get paid on delivery.`,
        linkUrl: '/listings/create',
      })
      return { ok: true, result: 'Relist nudge sent' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Nudge failed' } }
  },
}

export const growthAgents = [unmetDemand, dormantShipper, relistCarrier]
