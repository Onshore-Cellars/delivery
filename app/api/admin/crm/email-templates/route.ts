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

// GET /api/admin/crm/email-templates — List all email templates
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const actions = await prisma.aiAction.findMany({
      where: { type: 'email_template', status: 'executed' },
      orderBy: { createdAt: 'desc' },
    })

    const templates = actions.map((action) => {
      const data = JSON.parse(action.payload)
      return {
        id: action.id,
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Email templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/email-templates — Create a new email template
export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { name, subject, body, category } = await req.json()

    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 })
    }

    const action = await prisma.aiAction.create({
      data: {
        type: 'email_template',
        status: 'executed',
        title: name,
        payload: JSON.stringify({ name, subject, body, category: category || 'general' }),
      },
    })

    const data = JSON.parse(action.payload)

    return NextResponse.json({
      template: {
        id: action.id,
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category,
      },
    })
  } catch (error) {
    console.error('Email templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/crm/email-templates — Delete template(s)
export async function DELETE(req: NextRequest) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { ids } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const result = await prisma.aiAction.deleteMany({
      where: { id: { in: ids }, type: 'email_template' },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Email templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
