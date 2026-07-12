import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { enrichContact, discoverSuppliers } from '@/lib/ai'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

const uniqTags = (...parts: (string | null | undefined)[]) =>
  Array.from(new Set(parts.filter(Boolean).join(',').split(',').map(s => s.trim()).filter(Boolean))).join(',')

// Only accept GENERIC role mailboxes (never a named person's address — GDPR/PECR)
// and only at the domain actually derived from the company's own website.
const GENERIC_LOCALPARTS = new Set([
  'info', 'sales', 'contact', 'contacts', 'enquiries', 'inquiries', 'hello',
  'office', 'admin', 'mail', 'reception', 'orders', 'support', 'bookings', 'shop',
])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function acceptableEmail(email: string | undefined, domain: string | null): string | null {
  if (!email || !domain) return null
  const e = email.trim().toLowerCase()
  if (!EMAIL_RE.test(e)) return null
  const [local, host] = e.split('@')
  // must be a generic role mailbox
  if (!GENERIC_LOCALPARTS.has(local)) return null
  // must be at the derived domain (guards against fabricated/mismatched domains)
  const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase()
  if (host !== d && !host.endsWith('.' + d)) return null
  return e
}

// POST /api/admin/crm/enrich
//   { action: 'enrich', contactIds: string[] }  — AI-enrich existing contacts (infer emails, category, country)
//   { action: 'discover', category?, country? }  — AI-suggest new EU/UK yacht suppliers and add them (unverified)
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { action, contactIds, category, country } = await request.json()

    if (action === 'enrich') {
      if (!Array.isArray(contactIds) || contactIds.length === 0) {
        return NextResponse.json({ error: 'contactIds required' }, { status: 400 })
      }
      // Cap per request to bound AI cost/latency.
      const contacts = await prisma.crmContact.findMany({
        where: { id: { in: contactIds.slice(0, 25) } },
        select: { id: true, name: true, website: true, email: true, email2: true, category: true, country: true, location: true, tags: true, notes: true, priority: true },
      })

      let updated = 0
      for (const c of contacts) {
        const e = await enrichContact({
          name: c.name,
          website: c.website || undefined,
          category: c.category,
          country: c.country || undefined,
          location: c.location || undefined,
        }).catch(() => null)
        if (!e) continue

        // Accept only code-validated generic mailboxes at the derived domain.
        const valid = (e.suggestedEmails || [])
          .map(s => acceptableEmail(s.email, e.domain))
          .filter((x): x is string => !!x)
        const wroteGuessedEmail = (!c.email && valid[0]) || (!c.email2 && valid[1])

        const data: Record<string, unknown> = {}
        if (!c.email && valid[0]) data.email = valid[0]
        if (!c.email2 && valid[1] && valid[1] !== valid[0]) data.email2 = valid[1]
        if (e.category && (!c.category || c.category === 'Other')) data.category = e.category
        if (!c.country && e.country) data.country = e.country
        // Only fill priority when it's still the default 'medium' — never clobber a manual high/low.
        if (e.priority && (!c.priority || c.priority === 'medium')) data.priority = e.priority
        data.tags = uniqTags(
          c.tags, e.tags?.join(','),
          e.isYachtSupplier ? 'yacht-supplier' : 'non-yacht',
          'ai-enriched',
          // A guessed email must be human-verified before it can be emailed (see campaign query).
          wroteGuessedEmail ? 'unverified' : undefined,
        )
        const note = `AI enrichment: ${e.reasoning}${e.suggestedEmails?.length ? ` · suggested: ${e.suggestedEmails.map(x => `${x.email} (${x.confidence})`).join(', ')}` : ''}`
        data.notes = [c.notes, note].filter(Boolean).join('\n')

        await prisma.crmContact.update({ where: { id: c.id }, data })
        updated++
      }
      // requested = what the admin selected; processed = what we ran (capped at 25).
      return NextResponse.json({ action, updated, processed: contacts.length, requested: contactIds.length })
    }

    if (action === 'discover') {
      const existing = await prisma.crmContact.findMany({ select: { name: true } })
      const existingSet = new Set(existing.map(e => e.name.toLowerCase()))

      const res = await discoverSuppliers({
        category: category || undefined,
        country: country || undefined,
        existingNames: existing.map(e => e.name),
      })
      if (!res) return NextResponse.json({ error: 'AI service unavailable — check ANTHROPIC_API_KEY' }, { status: 503 })

      let created = 0
      for (const s of res.suppliers || []) {
        if (!s.name || existingSet.has(s.name.toLowerCase())) continue
        existingSet.add(s.name.toLowerCase())
        await prisma.crmContact.create({
          data: {
            name: s.name,
            category: s.category || 'Other',
            country: s.country || null,
            location: s.location || null,
            website: s.website || null,
            source: 'ai-discovered',
            priority: 'medium',
            tags: 'ai-discovered,unverified',
            notes: s.why || null,
          },
        })
        created++
      }
      return NextResponse.json({ action, created, suggested: res.suppliers?.length || 0 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('CRM enrich error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
