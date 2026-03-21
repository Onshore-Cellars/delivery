import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, generateTrackingCode } from '@/lib/auth'
import { notifyBookingCreated } from '@/lib/notifications'
import { calculatePlatformFee, calculateCarrierPayout } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (decoded.role === 'ADMIN') {
      // Admin sees all bookings
    } else if (decoded.role === 'CARRIER') {
      where.listing = { carrierId: decoded.userId }
    } else {
      where.shipperId = decoded.userId
    }

    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          include: {
            carrier: { select: { id: true, name: true, company: true } },
          },
        },
        shipper: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Anonymise contact details on unconfirmed bookings to prevent payment circumvention
    const confirmedStatuses = ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']
    const sanitizedBookings = bookings.map(b => {
      if (confirmedStatuses.includes(b.status) || decoded.role === 'ADMIN') {
        return b
      }
      // Redact contact details on pending/unconfirmed bookings
      return {
        ...b,
        pickupPhone: b.pickupPhone ? '***' : null,
        pickupEmail: b.pickupEmail ? '***' : null,
        deliveryPhone: b.deliveryPhone ? '***' : null,
        deliveryEmail: b.deliveryEmail ? '***' : null,
        listing: {
          ...b.listing,
          carrier: {
            ...b.listing.carrier,
          },
        },
      }
    })

    return NextResponse.json({ bookings: sanitizedBookings })
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check suspended status
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { suspended: true, canShip: true },
    })
    if (currentUser?.suspended) {
      return NextResponse.json({ error: 'Your account is suspended' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const {
      listingId, cargoDescription, cargoType, weightKg, volumeM3,
      cargoLengthCm, cargoWidthCm, cargoHeightCm, cargoImages,
      specialHandling, pickupAddress, pickupContact, pickupPhone, pickupEmail,
      deliveryAddress, deliveryContact, deliveryPhone, deliveryEmail,
      deliveryNotes, deliveryTimeWindow,
      yachtName, yachtMMSI, berthNumber, marinaName, routeDirection,
      itemCount, declaredValue,
    } = body

    if (!listingId || !cargoDescription || !weightKg || !volumeM3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const weight = parseFloat(weightKg)
    const volume = parseFloat(volumeM3)

    if (isNaN(weight) || isNaN(volume) || weight <= 0 || volume <= 0) {
      return NextResponse.json({ error: 'Weight and volume must be positive numbers' }, { status: 400 })
    }

    if (weight > 50000 || volume > 200) {
      return NextResponse.json({ error: 'Weight or volume exceeds maximum allowed' }, { status: 400 })
    }

    // Validate MMSI format if provided
    if (yachtMMSI && !/^\d{9}$/.test(yachtMMSI)) {
      return NextResponse.json({ error: 'MMSI must be exactly 9 digits' }, { status: 400 })
    }

    // Use a transaction for the entire booking to prevent race conditions
    const trackingCode = generateTrackingCode()

    const result = await prisma.$transaction(async (tx) => {
      // Lock and fetch listing inside transaction
      const listing = await tx.listing.findUnique({ where: { id: listingId } })
      if (!listing || listing.status !== 'ACTIVE') {
        throw new Error('VALIDATION:Listing not found or no longer available')
      }

      if (listing.carrierId === decoded.userId) {
        throw new Error('VALIDATION:You cannot book your own listing')
      }

      // Prevent duplicate active bookings
      const existingBooking = await tx.booking.findFirst({
        where: {
          listingId,
          shipperId: decoded.userId,
          status: { in: ['PENDING', 'ACCEPTED', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      })
      if (existingBooking) {
        throw new Error('VALIDATION:You already have an active booking on this listing')
      }

      // Check capacity based on route direction
      const isReturnLeg = routeDirection === 'return'
      if (isReturnLeg) {
        const returnKg = listing.returnAvailableKg ?? 0
        const returnM3 = listing.returnAvailableM3 ?? 0
        if (weight > returnKg || volume > returnM3) {
          throw new Error('VALIDATION:Requested capacity exceeds available return leg space')
        }
      } else {
        if (weight > listing.availableKg || volume > listing.availableM3) {
          throw new Error('VALIDATION:Requested capacity exceeds available space')
        }
      }

      // Calculate price with minimum charge enforcement
      let totalPrice = 0
      if (isReturnLeg) {
        if (listing.returnFlatRate) {
          totalPrice = listing.returnFlatRate
        } else {
          if (listing.returnPricePerKg) totalPrice += weight * listing.returnPricePerKg
          if (listing.returnPricePerM3) totalPrice += volume * listing.returnPricePerM3
        }
      } else {
        if (listing.flatRate) {
          totalPrice = listing.flatRate
        } else {
          if (listing.pricePerKg) totalPrice += weight * listing.pricePerKg
          if (listing.pricePerM3) totalPrice += volume * listing.pricePerM3
        }
      }
      // Enforce minimum charge
      if (listing.minimumCharge && totalPrice < listing.minimumCharge) {
        totalPrice = listing.minimumCharge
      }

      // Calculate platform fee and carrier payout
      const platformFee = calculatePlatformFee(totalPrice)
      const carrierPayout = calculateCarrierPayout(totalPrice)

      // Create booking
      const booking = await tx.booking.create({
        data: {
          listingId,
          shipperId: decoded.userId,
          cargoDescription,
          cargoType: cargoType || null,
          weightKg: weight,
          volumeM3: volume,
          itemCount: itemCount ? parseInt(itemCount) : 1,
          cargoLengthCm: cargoLengthCm ? parseFloat(cargoLengthCm) : null,
          cargoWidthCm: cargoWidthCm ? parseFloat(cargoWidthCm) : null,
          cargoHeightCm: cargoHeightCm ? parseFloat(cargoHeightCm) : null,
          cargoImages: cargoImages && Array.isArray(cargoImages) && cargoImages.length > 0
            ? JSON.stringify(cargoImages)
            : null,
          declaredValue: declaredValue ? parseFloat(declaredValue) : null,
          specialHandling: specialHandling || null,
          pickupAddress: pickupAddress || null,
          pickupContact: pickupContact || null,
          pickupPhone: pickupPhone || null,
          pickupEmail: pickupEmail || null,
          deliveryAddress: deliveryAddress || null,
          deliveryContact: deliveryContact || null,
          deliveryPhone: deliveryPhone || null,
          deliveryEmail: deliveryEmail || null,
          deliveryNotes: deliveryNotes || null,
          deliveryTimeWindow: deliveryTimeWindow || null,
          yachtName: yachtName || null,
          yachtMMSI: yachtMMSI || null,
          berthNumber: berthNumber || null,
          marinaName: marinaName || null,
          routeDirection: routeDirection || null,
          totalPrice,
          platformFee,
          carrierPayout,
          trackingCode,
          currency: listing.currency,
        },
        include: {
          listing: {
            include: {
              carrier: { select: { id: true, name: true, company: true, stripeAccountId: true } },
            },
          },
        },
      })

      // Decrement capacity based on route direction
      if (isReturnLeg) {
        await tx.listing.update({
          where: { id: listingId },
          data: {
            returnAvailableKg: { decrement: weight },
            returnAvailableM3: { decrement: volume },
          },
        })
      } else {
        await tx.listing.update({
          where: { id: listingId },
          data: {
            availableKg: { decrement: weight },
            availableM3: { decrement: volume },
          },
        })
      }

      // Check if listing should be marked FULL
      const updated = await tx.listing.findUnique({ where: { id: listingId } })
      if (updated) {
        const outboundFull = updated.availableKg <= 0 || updated.availableM3 <= 0
        const hasReturn = updated.routeDirection === 'BOTH' || updated.routeDirection === 'RETURN'
        const returnFull = hasReturn
          ? (updated.returnAvailableKg ?? 0) <= 0 || (updated.returnAvailableM3 ?? 0) <= 0
          : true // No return leg means consider it "full"

        if (outboundFull && returnFull) {
          await tx.listing.update({
            where: { id: listingId },
            data: { status: 'FULL' },
          })
        }
      }

      return booking
    })

    // Send notifications (outside transaction)
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: result.id },
        include: {
          shipper: { select: { id: true, name: true, email: true, emailNotifications: true } },
          listing: {
            include: {
              carrier: { select: { id: true, name: true, email: true, emailNotifications: true } },
            },
          },
        },
      })
      if (fullBooking) {
        await notifyBookingCreated({
          id: fullBooking.id,
          trackingCode: fullBooking.trackingCode || trackingCode,
          cargoDescription: fullBooking.cargoDescription,
          totalPrice: fullBooking.totalPrice,
          currency: fullBooking.currency,
          shipperId: fullBooking.shipperId,
          listing: {
            title: fullBooking.listing.title,
            originPort: fullBooking.listing.originPort,
            destinationPort: fullBooking.listing.destinationPort,
            departureDate: fullBooking.listing.departureDate,
            carrierId: fullBooking.listing.carrierId,
            carrier: fullBooking.listing.carrier,
          },
          shipper: fullBooking.shipper,
        })
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    // Notify the carrier that they have a new booking request to review
    try {
      await prisma.notification.create({
        data: {
          userId: result.listing.carrierId,
          type: 'BOOKING_CREATED',
          title: 'New Booking Request',
          message: `You have a new booking request #${result.trackingCode || trackingCode} from a shipper. Please review and accept or reject it.`,
          metadata: JSON.stringify({ bookingId: result.id }),
        },
      })
    } catch (carrierNotifErr) {
      console.error('Carrier notification error:', carrierNotifErr)
    }

    return NextResponse.json({
      booking: result,
      awaitingConfirmation: true,
    }, { status: 201 })
  } catch (error) {
    // Handle validation errors thrown from transaction
    if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
      const msg = error.message.replace('VALIDATION:', '')
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error('Booking creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
