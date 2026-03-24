import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { crmAssistant } from '@/lib/ai'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/crm/ai — Chat with the CRM AI assistant
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { message, signature, selectedContactIds } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Gather CRM context for the AI
    const [contactCount, categories, recentCampaigns, selectedContacts] = await Promise.all([
      prisma.crmContact.count(),
      prisma.crmContact.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } },
        take: 20,
      }),
      prisma.crmCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, status: true, sentCount: true },
      }),
      selectedContactIds?.length
        ? prisma.crmContact.findMany({
            where: { id: { in: selectedContactIds } },
            select: {
              name: true, email: true, phone: true,
              category: true, priority: true,
              country: true, notes: true,
            },
          })
        : Promise.resolve([]),
    ])

    const result = await crmAssistant(message, {
      contactCount,
      categories: categories.map((c: { category: string; _count: number }) => `${c.category} (${c._count})`),
      recentCampaigns: recentCampaigns.map(c => `${c.name} [${c.status}] - ${c.sentCount} sent`),
      signature: signature || undefined,
      selectedContacts: selectedContacts.length ? selectedContacts as Array<{ name: string; email?: string; phone?: string; category: string; priority: string; country?: string; notes?: string }> : undefined,
    })

    if (!result) {
      return NextResponse.json({ error: 'AI service unavailable — check ANTHROPIC_API_KEY' }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('CRM AI error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
