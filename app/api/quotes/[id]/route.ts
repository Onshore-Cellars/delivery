import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// Respond to a quote (carrier) or accept (requester)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const quote = await prisma.quote.findUnique({ where: { id } })
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    const body = await request.json()
    const { action, quotedPrice, validUntil, responseMessage } = body

    if (action === 'respond') {
      // Carrier responds with price
      if (quote.providerId !== decoded.userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      const updated = await prisma.quote.update({
        where: { id },
        data: {
          quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          responseMessage: responseMessage || null,
          status: 'QUOTED',
        },
      })

      await createNotification({
        userId: quote.requesterId,
        type: 'QUOTE_RECEIVED',
        title: 'Quote Received',
        message: `You received a quote of ${quotedPrice ? `€${parseFloat(quotedPrice).toFixed(2)}` : 'N/A'} for ${quote.originPort} → ${quote.destinationPort}`,
        linkUrl: '/dashboard',
      })

      return NextResponse.json({ quote: updated })
    } else if (action === 'accept') {
      if (quote.requesterId !== decoded.userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      const updated = await prisma.quote.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      })

      if (quote.providerId) {
        await createNotification({
          userId: quote.providerId,
          type: 'QUOTE_RECEIVED',
          title: 'Quote Accepted',
          message: `Your quote for ${quote.originPort} → ${quote.destinationPort} was accepted`,
          linkUrl: '/dashboard',
        })
      }

      return NextResponse.json({ quote: updated })
    } else if (action === 'cancel') {
      // Only requester or provider can cancel
      if (quote.requesterId !== decoded.userId && quote.providerId !== decoded.userId && decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ quote: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Quote update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
