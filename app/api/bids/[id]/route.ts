import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateTrackingCode } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { createCheckoutSession, calculatePlatformFee, calculateCarrierPayout } from '@/lib/stripe'

// Accept, reject, counter, or withdraw a bid
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

    const body = await request.json()
    const { action, counterOffer, counterMessage } = body

    const isCarrier = bid.listing.carrierId === decoded.userId || decoded.role === 'ADMIN'
    const isBidder = bid.bidderId === decoded.userId

    if (!isCarrier && !isBidder) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Carrier actions: accept, reject, counter
    // Bidder actions: withdraw, accept (counter-offer)

    if (action === 'accept' && isCarrier) {
      if (bid.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
      }

      const acceptAmount = bid.counterOffer ?? bid.amount
      const trackingCode = generateTrackingCode()
      const platformFee = calculatePlatformFee(acceptAmount)
      const carrierPayout = calculateCarrierPayout(acceptAmount)

      let updatedBid, booking
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Re-check capacity inside transaction to prevent race condition
          const listing = await tx.listing.findUnique({ where: { id: bid.listingId }, select: { availableKg: true, availableM3: true } })
          if (!listing || bid.weightKg > listing.availableKg || bid.volumeM3 > listing.availableM3) {
            throw new Error('VALIDATION:Insufficient capacity for this bid')
          }

          const updBid = await tx.bid.update({ where: { id }, data: { status: 'ACCEPTED' } })
          const bk = await tx.booking.create({
            data: {
              listingId: bid.listingId,
              shipperId: bid.bidderId,
              cargoDescription: bid.message || 'Bid-based booking',
              cargoType: bid.cargoType || null,
              weightKg: bid.weightKg,
              volumeM3: bid.volumeM3,
              totalPrice: acceptAmount,
              platformFee,
              carrierPayout,
              currency: bid.currency,
              trackingCode,
              status: 'PENDING',
            },
          })
          await tx.listing.update({
            where: { id: bid.listingId },
            data: {
              availableKg: { decrement: bid.weightKg },
              availableM3: { decrement: bid.volumeM3 },
            },
          })
          // Reject all other pending bids on the same listing
          await tx.bid.updateMany({
            where: {
              listingId: bid.listingId,
              id: { not: id },
              status: 'PENDING',
            },
            data: { status: 'REJECTED' },
          })
          return { updatedBid: updBid, booking: bk }
        })
        updatedBid = result.updatedBid
        booking = result.booking
      } catch (txErr) {
        if (txErr instanceof Error && txErr.message.startsWith('VALIDATION:')) {
          return NextResponse.json({ error: txErr.message.replace('VALIDATION:', '') }, { status: 400 })
        }
        throw txErr
      }

      // Notify bidder of acceptance
      try {
        await createNotification({
          userId: bid.bidderId,
          type: 'BID_ACCEPTED',
          title: 'Bid Accepted',
          message: `Your bid of ${bid.currency === 'GBP' ? '£' : '€'}${acceptAmount.toFixed(2)} on ${bid.listing.title} was accepted! Please complete payment.`,
          linkUrl: '/dashboard',
        })
      } catch (e) { console.error('Notification error:', e) }

      // Notify other bidders their bids were rejected
      try {
        const rejectedBids = await prisma.bid.findMany({
          where: { listingId: bid.listingId, id: { not: id }, status: 'REJECTED' },
          select: { bidderId: true },
        })
        for (const rb of rejectedBids) {
          await createNotification({
            userId: rb.bidderId,
            type: 'BID_REJECTED',
            title: 'Bid Not Accepted',
            message: `Your bid on ${bid.listing.title} was not accepted. You can browse other listings.`,
            linkUrl: '/marketplace',
          })
        }
      } catch (e) { console.error('Notification error:', e) }

      // Create Stripe checkout session for payment
      let checkoutUrl: string | null = null
      try {
        const bidder = await prisma.user.findUnique({
          where: { id: bid.bidderId },
          select: { email: true, name: true },
        })
        const carrier = await prisma.user.findUnique({
          where: { id: bid.listing.carrierId },
          select: { stripeAccountId: true },
        })
        if (bidder && acceptAmount > 0) {
          const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const session = await createCheckoutSession({
            bookingId: booking.id,
            amount: acceptAmount,
            currency: bid.currency,
            customerEmail: bidder.email,
            customerName: bidder.name,
            description: `Delivery: ${bid.listing.originPort} → ${bid.listing.destinationPort}`,
            origin: bid.listing.originPort,
            destination: bid.listing.destinationPort,
            successUrl: `${appUrl}/dashboard?payment=success&booking=${booking.id}`,
            cancelUrl: `${appUrl}/dashboard?payment=cancelled&booking=${booking.id}`,
            carrierStripeAccountId: carrier?.stripeAccountId || undefined,
          })
          checkoutUrl = session.url
        }
      } catch (e) { console.error('Stripe checkout error:', e) }

      return NextResponse.json({ bid: updatedBid, booking, checkoutUrl, message: 'Bid accepted — payment required' })

    } else if (action === 'accept' && isBidder) {
      // Bidder accepting a counter-offer
      if (!bid.counterOffer) {
        return NextResponse.json({ error: 'No counter-offer to accept' }, { status: 400 })
      }
      if (bid.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
      }

      // Update bid amount to the counter-offer and mark accepted
      const updatedBid = await prisma.bid.update({
        where: { id },
        data: { amount: bid.counterOffer, status: 'ACCEPTED' },
      })

      const acceptAmount = bid.counterOffer
      const trackingCode = generateTrackingCode()
      const platformFee = calculatePlatformFee(acceptAmount)
      const carrierPayout = calculateCarrierPayout(acceptAmount)

      let booking
      try {
        booking = await prisma.$transaction(async (tx) => {
          const listing = await tx.listing.findUnique({ where: { id: bid.listingId }, select: { availableKg: true, availableM3: true } })
          if (!listing || bid.weightKg > listing.availableKg || bid.volumeM3 > listing.availableM3) {
            throw new Error('VALIDATION:Insufficient capacity for this bid')
          }

          const bk = await tx.booking.create({
            data: {
              listingId: bid.listingId,
              shipperId: bid.bidderId,
              cargoDescription: bid.message || 'Bid-based booking',
              cargoType: bid.cargoType || null,
              weightKg: bid.weightKg,
              volumeM3: bid.volumeM3,
              totalPrice: acceptAmount,
              platformFee,
              carrierPayout,
              currency: bid.currency,
              trackingCode,
              status: 'PENDING',
            },
          })
          await tx.listing.update({
            where: { id: bid.listingId },
            data: {
              availableKg: { decrement: bid.weightKg },
              availableM3: { decrement: bid.volumeM3 },
            },
          })
          // Reject all other pending bids on the same listing
          await tx.bid.updateMany({
            where: {
              listingId: bid.listingId,
              id: { not: id },
              status: 'PENDING',
            },
            data: { status: 'REJECTED' },
          })
          return bk
        })
      } catch (txErr) {
        if (txErr instanceof Error && txErr.message.startsWith('VALIDATION:')) {
          return NextResponse.json({ error: txErr.message.replace('VALIDATION:', '') }, { status: 400 })
        }
        throw txErr
      }

      // Notify carrier that bidder accepted their counter-offer
      try {
        await createNotification({
          userId: bid.listing.carrierId,
          type: 'BID_ACCEPTED',
          title: 'Counter-Offer Accepted',
          message: `The bidder accepted your counter-offer of ${bid.currency === 'GBP' ? '£' : '€'}${acceptAmount.toFixed(2)} on ${bid.listing.title}.`,
          linkUrl: '/dashboard',
        })
      } catch (e) { console.error('Notification error:', e) }

      // Create Stripe checkout session
      let checkoutUrl: string | null = null
      try {
        const bidder = await prisma.user.findUnique({
          where: { id: bid.bidderId },
          select: { email: true, name: true },
        })
        const carrier = await prisma.user.findUnique({
          where: { id: bid.listing.carrierId },
          select: { stripeAccountId: true },
        })
        if (bidder && acceptAmount > 0) {
          const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const session = await createCheckoutSession({
            bookingId: booking.id,
            amount: acceptAmount,
            currency: bid.currency,
            customerEmail: bidder.email,
            customerName: bidder.name,
            description: `Delivery: ${bid.listing.originPort} → ${bid.listing.destinationPort}`,
            origin: bid.listing.originPort,
            destination: bid.listing.destinationPort,
            successUrl: `${appUrl}/dashboard?payment=success&booking=${booking.id}`,
            cancelUrl: `${appUrl}/dashboard?payment=cancelled&booking=${booking.id}`,
            carrierStripeAccountId: carrier?.stripeAccountId || undefined,
          })
          checkoutUrl = session.url
        }
      } catch (e) { console.error('Stripe checkout error:', e) }

      return NextResponse.json({ bid: updatedBid, booking, checkoutUrl, message: 'Counter-offer accepted — payment required' })

    } else if (action === 'reject' && isCarrier) {
      if (bid.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
      }

      const updatedBid = await prisma.bid.update({
        where: { id },
        data: { status: 'REJECTED' },
      })

      try {
        await createNotification({
          userId: bid.bidderId,
          type: 'BID_REJECTED',
          title: 'Bid Not Accepted',
          message: `Your bid on ${bid.listing.title} was not accepted. You can submit a new bid or browse other listings.`,
          linkUrl: '/marketplace',
        })
      } catch (e) { console.error('Notification error:', e) }

      return NextResponse.json({ bid: updatedBid })

    } else if (action === 'counter' && isCarrier) {
      if (bid.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
      }
      if (!counterOffer || typeof counterOffer !== 'number' || counterOffer <= 0) {
        return NextResponse.json({ error: 'Valid counterOffer amount is required' }, { status: 400 })
      }

      const updatedBid = await prisma.bid.update({
        where: { id },
        data: {
          counterOffer,
          counterMessage: counterMessage || null,
        },
      })

      try {
        await createNotification({
          userId: bid.bidderId,
          type: 'BID_RECEIVED',
          title: 'Counter-Offer Received',
          message: `The carrier sent a counter-offer of ${bid.currency === 'GBP' ? '£' : '€'}${counterOffer.toFixed(2)} on ${bid.listing.title}.${counterMessage ? ` Message: "${counterMessage}"` : ''}`,
          linkUrl: '/dashboard',
        })
      } catch (e) { console.error('Notification error:', e) }

      return NextResponse.json({ bid: updatedBid, message: 'Counter-offer sent' })

    } else if (action === 'withdraw' && isBidder) {
      if (bid.status !== 'PENDING') {
        return NextResponse.json({ error: 'Bid already processed' }, { status: 400 })
      }

      const updatedBid = await prisma.bid.update({
        where: { id },
        data: { status: 'WITHDRAWN' },
      })

      try {
        await createNotification({
          userId: bid.listing.carrierId,
          type: 'BID_REJECTED',
          title: 'Bid Withdrawn',
          message: `A bid on ${bid.listing.title} was withdrawn by the bidder.`,
          linkUrl: '/dashboard',
        })
      } catch (e) { console.error('Notification error:', e) }

      return NextResponse.json({ bid: updatedBid, message: 'Bid withdrawn' })

    } else {
      return NextResponse.json({ error: 'Invalid action or not authorized for this action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bid action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
