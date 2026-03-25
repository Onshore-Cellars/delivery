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

// Store CRM settings as an AiAction with type 'crm_settings'
export async function GET(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const settings = await prisma.aiAction.findFirst({
      where: { type: 'crm_settings', status: 'executed' },
      orderBy: { createdAt: 'desc' },
    })

    const defaults = {
      emailSignature: '<p>Best regards,<br/>Onshore Delivery Team<br/><a href="https://onshoredelivery.com">onshoredelivery.com</a></p>',
      defaultFromName: 'Onshore Delivery',
      defaultFromEmail: 'info@onshoredelivery.com',
      autoAppendSignature: true,
      cancellationFeePercent: 10,
      insuranceBasicRate: 0.5,
      insuranceStandardRate: 1.0,
      insurancePremiumRate: 2.0,
    }

    if (settings) {
      try {
        const stored = JSON.parse(settings.payload)
        return NextResponse.json({ settings: { ...defaults, ...stored } })
      } catch {
        return NextResponse.json({ settings: defaults })
      }
    }
    return NextResponse.json({ settings: defaults })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Upsert by creating new settings record
    await prisma.aiAction.create({
      data: {
        type: 'crm_settings',
        status: 'executed',
        title: 'CRM Settings Update',
        payload: JSON.stringify(body.settings),
        createdBy: admin.userId,
        executedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
