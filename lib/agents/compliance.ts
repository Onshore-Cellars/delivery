import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import type { Agent, ProposedTask } from './types'

// Compliance agents guard the paperwork that keeps cargo legal and insured:
// carrier documents that are missing or lapsing, and cargo that needs a permit
// the carrier hasn't proven they hold.

// Verified documents that are expired or about to expire — prompt the owner to
// renew before it lapses (or, if already lapsed, mark it EXPIRED).
const expiringDocument: Agent = {
  team: 'COMPLIANCE',
  kind: 'expiring-document',
  label: 'Renew lapsing documents',
  description: 'Verified documents expired or expiring within 30 days.',
  async run() {
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const docs = await prisma.document.findMany({
      where: { status: 'VERIFIED', expiryDate: { not: null, lte: soon } },
      select: { id: true, type: true, name: true, expiryDate: true, userId: true, user: { select: { name: true, company: true } } },
      take: 25,
    })
    return docs.map((d): ProposedTask => {
      const exp = d.expiryDate!
      const lapsed = exp.getTime() <= Date.now()
      const days = Math.round((exp.getTime() - Date.now()) / 86400000)
      return {
        team: 'COMPLIANCE', kind: 'expiring-document',
        title: `${lapsed ? 'Expired' : 'Expiring'} ${d.type.replace(/_/g, ' ').toLowerCase()} · ${d.user.company || d.user.name}`,
        summary: lapsed
          ? `"${d.name}" expired ${Math.abs(days)} day(s) ago. Prompt the owner to re-upload; the document will be marked EXPIRED.`
          : `"${d.name}" expires in ${days} day(s). Nudge the owner to renew before it lapses.`,
        reasoning: 'Expired insurance/permits create legal and coverage risk on live shipments.',
        confidence: lapsed ? 0.92 : 0.8,
        payload: { documentId: d.id, userId: d.userId, lapsed, docName: d.name },
        relatedType: 'document', relatedId: d.id,
        dedupeKey: `expiring-document:${d.id}`,
      }
    })
  },
  async execute(payload) {
    const documentId = String(payload.documentId || '')
    const userId = String(payload.userId || '')
    if (!documentId || !userId) return { ok: false, error: 'Missing document or user' }
    try {
      if (payload.lapsed) {
        await prisma.document.update({ where: { id: documentId }, data: { status: 'EXPIRED' } })
      }
      await createNotification({
        userId, type: 'DOCUMENT_REJECTED', title: 'Document needs renewing',
        message: `Your "${payload.docName || 'document'}" ${payload.lapsed ? 'has expired' : 'is about to expire'}. Please upload a current version to keep carrying cargo.`,
        linkUrl: '/documents',
      })
      return { ok: true, result: payload.lapsed ? 'Marked EXPIRED + owner notified' : 'Owner reminded to renew' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Notify failed' } }
  },
}

// Carriers actively listing but with no verified goods-in-transit insurance on
// file — they should not be moving cargo uninsured.
const uninsuredCarrier: Agent = {
  team: 'COMPLIANCE',
  kind: 'uninsured-carrier',
  label: 'Flag uninsured active carriers',
  description: 'Carriers with active listings but no verified transit insurance.',
  async run() {
    const active = await prisma.listing.findMany({
      where: { status: 'ACTIVE', listingType: 'SPACE_AVAILABLE' },
      select: { carrierId: true, carrier: { select: { name: true, company: true } } },
      take: 1000,
    })
    const carriers = new Map<string, string>()
    for (const l of active) carriers.set(l.carrierId, l.carrier.company || l.carrier.name)
    if (!carriers.size) return []
    // Which of them have a verified, unexpired goods-in-transit insurance doc?
    const insured = await prisma.document.findMany({
      where: {
        userId: { in: [...carriers.keys()] },
        type: 'GOODS_IN_TRANSIT_INSURANCE', status: 'VERIFIED',
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
      select: { userId: true },
    })
    const insuredSet = new Set(insured.map(d => d.userId))
    const uninsured = [...carriers.entries()].filter(([id]) => !insuredSet.has(id)).slice(0, 25)
    return uninsured.map(([carrierId, name]): ProposedTask => ({
      team: 'COMPLIANCE', kind: 'uninsured-carrier',
      title: `No transit insurance on file: ${name}`,
      summary: `${name} has active listings but no verified goods-in-transit insurance. Prompt them to upload proof before they carry more cargo.`,
      reasoning: 'Carrying cargo without verified transit insurance is a coverage and liability gap.',
      confidence: 0.78,
      payload: { carrierId, name },
      relatedType: 'user', relatedId: carrierId,
      dedupeKey: `uninsured-carrier:${carrierId}`,
    }))
  },
  async execute(payload) {
    const carrierId = String(payload.carrierId || '')
    if (!carrierId) return { ok: false, error: 'Missing carrierId' }
    try {
      await createNotification({
        userId: carrierId, type: 'SYSTEM', title: 'Upload your transit insurance',
        message: `To keep your listings active you need verified goods-in-transit insurance on file. Please upload it from your documents page.`,
        linkUrl: '/documents',
      })
      return { ok: true, result: 'Carrier prompted for insurance proof' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Notify failed' } }
  },
}

// Dangerous-goods bookings whose carrier has no verified dangerous-goods
// certificate — a hard compliance stop that needs a human before it moves.
const dangerousGoodsCheck: Agent = {
  team: 'COMPLIANCE',
  kind: 'dangerous-goods-cert',
  label: 'Verify dangerous-goods carriage',
  description: 'Dangerous cargo booked to a carrier with no DG certificate.',
  async run() {
    const bookings = await prisma.booking.findMany({
      where: { isDangerous: true, status: { in: ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'PENDING'] } },
      select: { id: true, trackingCode: true, listing: { select: { carrierId: true, carrier: { select: { name: true, company: true } } } } },
      take: 200,
    })
    if (!bookings.length) return []
    const carrierIds = [...new Set(bookings.map(b => b.listing.carrierId))]
    const certs = await prisma.document.findMany({
      where: {
        userId: { in: carrierIds }, type: 'DANGEROUS_GOODS_CERT', status: 'VERIFIED',
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
      select: { userId: true },
    })
    const certified = new Set(certs.map(c => c.userId))
    const flagged = bookings.filter(b => !certified.has(b.listing.carrierId)).slice(0, 25)
    return flagged.map((b): ProposedTask => ({
      team: 'COMPLIANCE', kind: 'dangerous-goods-cert',
      title: `Dangerous cargo without DG cert · ${b.trackingCode || b.id.slice(-6)}`,
      summary: `Booking carries dangerous goods but ${b.listing.carrier.company || b.listing.carrier.name} has no verified dangerous-goods certificate. Alert admins to review before it moves.`,
      reasoning: 'Moving dangerous goods without certification is a legal and safety breach — never auto-resolve.',
      confidence: 0.9,
      payload: { bookingId: b.id },
      relatedType: 'booking', relatedId: b.id,
      dedupeKey: `dangerous-goods-cert:${b.id}`,
    }))
  },
  async execute(payload) {
    const bookingId = String(payload.bookingId || '')
    if (!bookingId) return { ok: false, error: 'Missing bookingId' }
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        await createNotification({ userId: a.id, type: 'SYSTEM', title: 'Compliance: dangerous goods uncertified', message: `A dangerous-goods booking is assigned to a carrier without a verified DG certificate. Review before it moves.`, linkUrl: '/admin' }).catch(() => {})
      }
      return { ok: true, result: 'Admins alerted to uncertified dangerous-goods carriage' }
    } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Alert failed' } }
  },
}

export const complianceAgents = [expiringDocument, uninsuredCarrier, dangerousGoodsCheck]
