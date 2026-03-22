import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// GET /api/admin/crm — list contacts with filtering, search, pagination
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const country = searchParams.get('country') || ''
    const priority = searchParams.get('priority') || ''
    const source = searchParams.get('source') || ''
    const hasEmail = searchParams.get('hasEmail')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortDir = searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc'

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = category
    if (country) where.country = { contains: country, mode: 'insensitive' }
    if (priority) where.priority = priority
    if (source) where.source = source
    if (hasEmail === 'true') where.email = { not: null }
    if (hasEmail === 'false') where.email = null

    const [contacts, total] = await Promise.all([
      prisma.crmContact.findMany({
        where: where as never,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.crmContact.count({ where: where as never }),
    ])

    // Get category + country counts for filters
    const [categories, countries, stats] = await Promise.all([
      prisma.crmContact.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } } }),
      prisma.crmContact.groupBy({ by: ['country'], _count: true, orderBy: { _count: { country: 'desc' } }, where: { country: { not: null } } }),
      prisma.crmContact.aggregate({
        _count: true,
        where: { email: { not: null } },
      }),
    ])

    const totalAll = await prisma.crmContact.count()

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filters: {
        categories: categories.map(c => ({ value: c.category, count: c._count })),
        countries: countries.filter(c => c.country).map(c => ({ value: c.country!, count: c._count })),
      },
      stats: { total: totalAll, withEmail: stats._count },
    })
  } catch (error) {
    console.error('CRM GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm — create a new contact
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { name, category, country, location, website, email, email2, phone, phone2, instagram, notes, priority, tags } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const contact = await prisma.crmContact.create({
      data: {
        name: String(name).trim(),
        category: String(category).trim(),
        country: country || null,
        location: location || null,
        website: website || null,
        email: email || null,
        email2: email2 || null,
        phone: phone || null,
        phone2: phone2 || null,
        instagram: instagram || null,
        notes: notes || null,
        priority: priority || 'medium',
        tags: tags || null,
        source: 'manual',
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('CRM POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/crm — update contact(s) or bulk operations
export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()

    // Bulk update: { ids: [...], updates: { priority, category, etc } }
    if (body.ids && Array.isArray(body.ids)) {
      const allowedFields = ['priority', 'category', 'country', 'tags', 'opted_out']
      const updates: Record<string, unknown> = {}
      for (const key of allowedFields) {
        if (body.updates && body.updates[key] !== undefined) {
          updates[key] = body.updates[key]
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
      }

      const result = await prisma.crmContact.updateMany({
        where: { id: { in: body.ids } },
        data: updates,
      })

      return NextResponse.json({ updated: result.count })
    }

    // Single update: { id, ...fields }
    if (!body.id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const contact = await prisma.crmContact.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.country !== undefined && { country: body.country || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.email2 !== undefined && { email2: body.email2 || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.phone2 !== undefined && { phone2: body.phone2 || null }),
        ...(body.instagram !== undefined && { instagram: body.instagram || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.opted_out !== undefined && { opted_out: body.opted_out }),
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('CRM PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm — delete contact(s)
export async function DELETE(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()

    // Bulk delete
    if (body.ids && Array.isArray(body.ids)) {
      const result = await prisma.crmContact.deleteMany({
        where: { id: { in: body.ids } },
      })
      return NextResponse.json({ deleted: result.count })
    }

    // Single delete
    if (!body.id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    await prisma.crmContact.delete({ where: { id: body.id } })
    return NextResponse.json({ deleted: 1 })
  } catch (error) {
    console.error('CRM DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
