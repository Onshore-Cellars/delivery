import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { checkListingForCircumvention } from '@/lib/pii-filter'
import { logAudit } from '@/lib/audit'
import { triggerListingAlerts } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const dateFrom = searchParams.get('dateFrom')
    const minWeight = searchParams.get('minWeight')
    const minVolume = searchParams.get('minVolume')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const vehicleType = searchParams.get('vehicleType')
    const featuredParam = searchParams.get('featured')
    const sort = searchParams.get('sort')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const carrierId = searchParams.get('carrierId')
    const listingType = searchParams.get('listingType')
    const showAll = searchParams.get('all')

    const where: Prisma.ListingWhereInput = {}

    // If filtering by carrier (dashboard), verify the requester owns these listings
    if (carrierId) {
      const token = getTokenFromHeader(request.headers.get('authorization'))
      const decoded = token ? verifyToken(token) : null
      if (decoded && (decoded.userId === carrierId || decoded.role === 'ADMIN')) {
        where.carrierId = carrierId // Show all statuses for own listings
      } else {
        where.carrierId = carrierId
        where.status = 'ACTIVE' // Public view: only active
      }
    } else if (showAll === 'true') {
      // Admin view: check token for admin role
      const token = getTokenFromHeader(request.headers.get('authorization'))
      const decoded = token ? verifyToken(token) : null
      if (decoded?.role === 'ADMIN') {
        // No status filter — admin sees everything
      } else {
        where.status = 'ACTIVE'
      }
    } else {
      // Public marketplace: only active listings
      where.status = 'ACTIVE'
    }

    if (listingType) {
      where.listingType = listingType
    }

    // Proximity search: if lat/lng provided, use radius filtering
    const originLat = searchParams.get('originLat') ? parseFloat(searchParams.get('originLat')!) : null
    const originLng = searchParams.get('originLng') ? parseFloat(searchParams.get('originLng')!) : null
    const destLat = searchParams.get('destLat') ? parseFloat(searchParams.get('destLat')!) : null
    const destLng = searchParams.get('destLng') ? parseFloat(searchParams.get('destLng')!) : null
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '50')

    let useProximityOrigin = false
    let useProximityDest = false

    if (originLat && originLng && !isNaN(originLat) && !isNaN(originLng)) {
      useProximityOrigin = true
      // Bounding box pre-filter (fast) — ~1 degree ≈ 111km
      const degRange = radiusKm / 111
      where.originLat = { gte: originLat - degRange, lte: originLat + degRange }
      where.originLng = { gte: originLng - degRange, lte: originLng + degRange }
    } else if (origin) {
      where.OR = [
        { originPort: { contains: origin, mode: 'insensitive' } },
        { originRegion: { contains: origin, mode: 'insensitive' } },
      ]
    }

    if (destLat && destLng && !isNaN(destLat) && !isNaN(destLng)) {
      useProximityDest = true
      const degRange = radiusKm / 111
      where.destinationLat = { gte: destLat - degRange, lte: destLat + degRange }
      where.destinationLng = { gte: destLng - degRange, lte: destLng + degRange }
    } else if (destination) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { destinationPort: { contains: destination, mode: 'insensitive' } },
            { destinationRegion: { contains: destination, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (dateFrom) {
      where.departureDate = { gte: new Date(dateFrom) }
    }

    if (minWeight) {
      where.availableKg = { gte: parseFloat(minWeight) }
    }

    if (minVolume) {
      where.availableM3 = { gte: parseFloat(minVolume) }
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (searchParams.get('hasRefrigeration') === 'true') where.hasRefrigeration = true
    if (searchParams.get('hasTailLift') === 'true') where.hasTailLift = true
    if (searchParams.get('hasGPS') === 'true') where.hasGPS = true

    if (featuredParam === 'true') {
      where.featured = true
    }

    const direction = searchParams.get('direction')
    if (direction === 'return') {
      where.routeDirection = { in: ['RETURN', 'BOTH'] }
    } else if (direction === 'outbound') {
      where.routeDirection = { in: ['OUTBOUND', 'BOTH'] }
    } else if (direction === 'both') {
      where.routeDirection = 'BOTH'
    }

    if (minPrice || maxPrice) {
      const priceConditions: Prisma.ListingWhereInput[] = []
      if (minPrice) {
        priceConditions.push({
          OR: [
            { flatRate: { gte: parseFloat(minPrice) } },
            { pricePerKg: { gte: parseFloat(minPrice) } },
          ],
        })
      }
      if (maxPrice) {
        priceConditions.push({
          AND: [
            { OR: [{ flatRate: null }, { flatRate: { lte: parseFloat(maxPrice) } }] },
            { OR: [{ pricePerKg: null }, { pricePerKg: { lte: parseFloat(maxPrice) } }] },
          ],
        })
      }
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        ...priceConditions,
      ]
    }

    // Build orderBy based on sort param
    let orderBy: Prisma.ListingOrderByWithRelationInput[] = [{ featured: 'desc' }, { departureDate: 'asc' }]
    if (sort === 'price_asc') {
      orderBy = [{ flatRate: { sort: 'asc', nulls: 'last' } }, { pricePerKg: { sort: 'asc', nulls: 'last' } }]
    } else if (sort === 'price_desc') {
      orderBy = [{ flatRate: { sort: 'desc', nulls: 'last' } }, { pricePerKg: { sort: 'desc', nulls: 'last' } }]
    } else if (sort === 'capacity') {
      orderBy = [{ availableKg: 'desc' }]
    } else if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sort === 'departure') {
      orderBy = [{ departureDate: 'asc' }]
    }

    // Haversine distance calculation helper
    const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    // If using proximity search, fetch extra results for post-filter precision
    const fetchLimit = (useProximityOrigin || useProximityDest) ? limit * 3 : limit
    const fetchSkip = (useProximityOrigin || useProximityDest) ? 0 : (page - 1) * limit

    const [rawListings, rawTotal] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          carrier: {
            select: {
              id: true,
              avatarUrl: true,
              name: true,
              company: true,
              receivedReviews: {
                select: { rating: true },
              },
            },
          },
          routeStops: {
            select: { portName: true, lat: true, lng: true, stopOrder: true },
            orderBy: { stopOrder: 'asc' },
          },
          _count: { select: { bookings: true } },
        },
        orderBy,
        skip: fetchSkip,
        take: fetchLimit,
      }),
      prisma.listing.count({ where }),
    ])

    // Cross-track distance: distance from point C to the great circle line A→B
    const crossTrackDistKm = (aLat: number, aLng: number, bLat: number, bLng: number, cLat: number, cLng: number): number => {
      const R = 6371
      const toRad = (d: number) => d * Math.PI / 180
      const dAC = haversineKm(aLat, aLng, cLat, cLng) / R
      const bearAC = Math.atan2(
        Math.sin(toRad(cLng - aLng)) * Math.cos(toRad(cLat)),
        Math.cos(toRad(aLat)) * Math.sin(toRad(cLat)) - Math.sin(toRad(aLat)) * Math.cos(toRad(cLat)) * Math.cos(toRad(cLng - aLng))
      )
      const bearAB = Math.atan2(
        Math.sin(toRad(bLng - aLng)) * Math.cos(toRad(bLat)),
        Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) - Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(toRad(bLng - aLng))
      )
      const xt = Math.asin(Math.sin(dAC) * Math.sin(bearAC - bearAB))
      return Math.abs(xt * R)
    }

    // Check if point C is "between" A and B along the route (not past either end)
    const isAlongRoute = (aLat: number, aLng: number, bLat: number, bLng: number, cLat: number, cLng: number): boolean => {
      const dAB = haversineKm(aLat, aLng, bLat, bLng)
      const dAC = haversineKm(aLat, aLng, cLat, cLng)
      const dCB = haversineKm(cLat, cLng, bLat, bLng)
      // Point is along route if the sum of distances from endpoints is close to the total route distance
      // Allow 20% tolerance for curved routes
      return dAC <= dAB * 1.2 && dCB <= dAB * 1.2
    }

    // Apply precise Haversine filtering for proximity searches
    let listings = rawListings
    let total = rawTotal

    if (useProximityOrigin || useProximityDest) {
      listings = rawListings.filter(l => {
        // Standard proximity check
        let originMatch = !useProximityOrigin
        let destMatch = !useProximityDest

        if (useProximityOrigin && originLat && originLng && l.originLat && l.originLng) {
          const dist = haversineKm(originLat, originLng, l.originLat, l.originLng)
          if (dist <= radiusKm) originMatch = true
        }
        if (useProximityDest && destLat && destLng && l.destinationLat && l.destinationLng) {
          const dist = haversineKm(destLat, destLng, l.destinationLat, l.destinationLng)
          if (dist <= radiusKm) destMatch = true
        }

        if (originMatch && destMatch) return true

        // Route corridor matching: if listing has flexible route, check if search point
        // falls within maxDetourKm of the listing's route line
        if (l.flexibleRoute && l.originLat && l.originLng && l.destinationLat && l.destinationLng) {
          const detourLimit = l.maxDetourKm || 30

          if (!originMatch && useProximityOrigin && originLat && originLng) {
            const xtDist = crossTrackDistKm(l.originLat, l.originLng, l.destinationLat, l.destinationLng, originLat, originLng)
            const along = isAlongRoute(l.originLat, l.originLng, l.destinationLat, l.destinationLng, originLat, originLng)
            if (xtDist <= detourLimit && along) originMatch = true
          }

          if (!destMatch && useProximityDest && destLat && destLng) {
            const xtDist = crossTrackDistKm(l.originLat, l.originLng, l.destinationLat, l.destinationLng, destLat, destLng)
            const along = isAlongRoute(l.originLat, l.originLng, l.destinationLat, l.destinationLng, destLat, destLng)
            if (xtDist <= detourLimit && along) destMatch = true
          }
        }

        return originMatch && destMatch
      })
      total = listings.length
      // Apply pagination after filtering
      listings = listings.slice((page - 1) * limit, page * limit)
    }

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
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

    const body = await request.json()
    const {
      title, description, vehicleType, vehicleName, vehicleReg,
      hasRefrigeration, hasTailLift, hasGPS, insuranceValue,
      originPort, originRegion, originCountry, destinationPort, destinationRegion, destinationCountry,
      departureDate, estimatedArrival, isRecurring, recurringSchedule,
      totalCapacityKg, totalCapacityM3, maxItemLength, maxItemWidth, maxItemHeight,
      pricePerKg, pricePerM3, flatRate, currency, minimumCharge,
      biddingEnabled, minBidPrice, acceptedCargo, restrictedItems,
      routeDirection, returnDepartureDate, returnEstimatedArrival,
      returnAvailableKg, returnAvailableM3, returnPricePerKg, returnPricePerM3,
      returnFlatRate, returnNotes,
      listingType: rawListingType, cargoDescription, specialRequirements,
      flexibleRoute, maxDetourKm, flexibleStops,
      originLat: bodyOriginLat, originLng: bodyOriginLng,
      destinationLat: bodyDestLat, destinationLng: bodyDestLng,
    } = body

    const listingType = rawListingType === 'SPACE_NEEDED' ? 'SPACE_NEEDED' : 'SPACE_AVAILABLE'

    const creator = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { canCarry: true, canShip: true, verified: true, suspended: true } })

    if (creator?.suspended) {
      return NextResponse.json({ error: 'Your account is suspended' }, { status: 403 })
    }
    if (!creator?.verified) {
      return NextResponse.json({ error: 'Please verify your email before creating a listing' }, { status: 403 })
    }

    if (listingType === 'SPACE_NEEDED') {
      if (!creator?.canShip && decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Enable "I can ship" in your profile to post space-needed listings' }, { status: 403 })
      }
    } else {
      if (!creator?.canCarry && decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Enable "I can carry / deliver" in your profile to create listings' }, { status: 403 })
      }
    }

    const isSpaceNeeded = listingType === 'SPACE_NEEDED'

    if (!title || !originPort || !destinationPort || !departureDate || !totalCapacityKg || !totalCapacityM3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isSpaceNeeded && !vehicleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (isNaN(parseFloat(totalCapacityKg)) || parseFloat(totalCapacityKg) <= 0) {
      return NextResponse.json({ error: 'Max payload must be a positive number' }, { status: 400 })
    }
    if (isNaN(parseFloat(totalCapacityM3)) || parseFloat(totalCapacityM3) <= 0) {
      return NextResponse.json({ error: 'Cargo volume must be a positive number' }, { status: 400 })
    }

    if (new Date(departureDate) < new Date()) {
      return NextResponse.json({ error: 'Departure date must be in the future' }, { status: 400 })
    }

    const numericFields = { pricePerKg, pricePerM3, flatRate, minimumCharge, minBidPrice, insuranceValue }
    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && value !== null && value !== '' && parseFloat(value) < 0) {
        return NextResponse.json({ error: `${field} cannot be negative` }, { status: 400 })
      }
    }

    const VALID_CURRENCIES = ['EUR', 'GBP', 'USD']
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: 'Currency must be EUR, GBP, or USD' }, { status: 400 })
    }

    // Check listing text for circumvention attempts
    const textToCheck = [title, description, restrictedItems].filter(Boolean).join(' ')
    const circumventionCheck = checkListingForCircumvention(textToCheck)
    if (circumventionCheck.flagged) {
      logAudit({
        userId: decoded.userId,
        action: 'LISTING_CIRCUMVENTION_FLAG',
        details: { reason: circumventionCheck.reason, title },
      }).catch(() => {})
      return NextResponse.json(
        { error: 'Your listing contains language that suggests off-platform transactions. All deliveries must be booked and paid through Onshore Delivery to ensure insurance coverage and payment protection.' },
        { status: 400 },
      )
    }

    const listing = await prisma.listing.create({
      data: {
        carrierId: decoded.userId,
        listingType,
        title,
        description: description || (isSpaceNeeded && cargoDescription ? cargoDescription : null),
        vehicleType: vehicleType || (isSpaceNeeded ? 'N/A' : ''),
        vehicleName: vehicleName || null,
        vehicleReg: vehicleReg || null,
        hasRefrigeration: hasRefrigeration || false,
        hasTailLift: hasTailLift || false,
        hasGPS: hasGPS !== false,
        insuranceValue: insuranceValue ? parseFloat(insuranceValue) : null,
        originPort,
        originRegion: originRegion || null,
        originCountry: originCountry || null,
        destinationPort,
        destinationRegion: destinationRegion || null,
        destinationCountry: destinationCountry || null,
        departureDate: new Date(departureDate),
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        isRecurring: isRecurring || false,
        recurringSchedule: recurringSchedule || null,
        totalCapacityKg: parseFloat(totalCapacityKg),
        totalCapacityM3: parseFloat(totalCapacityM3),
        availableKg: parseFloat(totalCapacityKg),
        availableM3: parseFloat(totalCapacityM3),
        maxItemLength: maxItemLength ? parseFloat(maxItemLength) : null,
        maxItemWidth: maxItemWidth ? parseFloat(maxItemWidth) : null,
        maxItemHeight: maxItemHeight ? parseFloat(maxItemHeight) : null,
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerM3: pricePerM3 ? parseFloat(pricePerM3) : null,
        flatRate: flatRate ? parseFloat(flatRate) : null,
        currency: currency || 'EUR',
        minimumCharge: minimumCharge ? parseFloat(minimumCharge) : null,
        biddingEnabled: biddingEnabled || false,
        minBidPrice: minBidPrice ? parseFloat(minBidPrice) : null,
        acceptedCargo: acceptedCargo || null,
        restrictedItems: isSpaceNeeded ? (specialRequirements || restrictedItems || null) : (restrictedItems || null),
        routeDirection: routeDirection || 'OUTBOUND',
        returnDepartureDate: returnDepartureDate ? new Date(returnDepartureDate) : null,
        returnEstimatedArrival: returnEstimatedArrival ? new Date(returnEstimatedArrival) : null,
        returnAvailableKg: returnAvailableKg ? parseFloat(returnAvailableKg) : null,
        returnAvailableM3: returnAvailableM3 ? parseFloat(returnAvailableM3) : null,
        returnTotalKg: returnAvailableKg ? parseFloat(returnAvailableKg) : null,
        returnTotalM3: returnAvailableM3 ? parseFloat(returnAvailableM3) : null,
        returnPricePerKg: returnPricePerKg ? parseFloat(returnPricePerKg) : null,
        returnPricePerM3: returnPricePerM3 ? parseFloat(returnPricePerM3) : null,
        returnFlatRate: returnFlatRate ? parseFloat(returnFlatRate) : null,
        returnNotes: returnNotes || null,
        flexibleRoute: flexibleRoute || false,
        maxDetourKm: maxDetourKm ? parseFloat(maxDetourKm) : null,
        flexibleStops: flexibleStops || false,
        originLat: bodyOriginLat ? parseFloat(bodyOriginLat) : null,
        originLng: bodyOriginLng ? parseFloat(bodyOriginLng) : null,
        destinationLat: bodyDestLat ? parseFloat(bodyDestLat) : null,
        destinationLng: bodyDestLng ? parseFloat(bodyDestLng) : null,
      },
      include: {
        carrier: {
          select: { id: true, avatarUrl: true },
        },
      },
    })

    // Fire-and-forget: check saved alerts for matching users
    triggerListingAlerts(listing).catch(err => console.error('Alert trigger error:', err))

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

