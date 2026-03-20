import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { sendEmail, quoteRequestEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const quotes = await prisma.quote.findMany({
      where: {
        OR: [{ requesterId: decoded.userId }, { providerId: decoded.userId }],
      },
      include: {
        requester: { select: { id: true, name: true, company: true } },
        provider: { select: { id: true, name: true, company: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Quotes fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const {
      listingId, providerId,
      originPort, destinationPort,
      cargoDescription, cargoType,
      weightKg, volumeM3,
      packages,
      preferredDate, specialRequirements,
    } = body

    if (!originPort || !destinationPort || !cargoDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate packages JSON if provided
    let packagesJson: string | null = null
    if (packages && Array.isArray(packages) && packages.length > 0) {
      packagesJson = JSON.stringify(packages)
    }

    const quote = await prisma.quote.create({
      data: {
        listingId: listingId || null,
        requesterId: decoded.userId,
        providerId: providerId || null,
        originPort,
        destinationPort,
        cargoDescription,
        cargoType: cargoType || null,
        weightKg: parseFloat(weightKg) || 0,
        volumeM3: parseFloat(volumeM3) || 0,
        packages: packagesJson,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        specialRequirements: specialRequirements || null,
      },
      include: {
        requester: { select: { id: true, name: true, company: true } },
      },
    })

    // Notify provider if specified
    if (providerId) {
      const requester = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { name: true } })
      const provider = await prisma.user.findUnique({ where: { id: providerId }, select: { name: true, email: true, emailNotifications: true } })

      if (provider && requester) {
        await createNotification({
          userId: providerId,
          type: 'QUOTE_REQUESTED',
          title: 'Quote Request Received',
          message: `${requester.name} is requesting a quote for ${originPort} → ${destinationPort}`,
          linkUrl: '/dashboard',
          sendEmailNotification: false,
        })

        if (provider.emailNotifications) {
          const template = quoteRequestEmail({
            carrierName: provider.name,
            requesterName: requester.name,
            origin: originPort,
            destination: destinationPort,
            cargoDescription,
            weightKg: parseFloat(weightKg),
          })
          await sendEmail({ to: provider.email, ...template })
        }
      }
    }

    return NextResponse.json({ quote }, { status: 201 })
  } catch (error) {
    console.error('Quote creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
