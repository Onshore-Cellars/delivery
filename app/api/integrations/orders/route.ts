import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateApiKey, hasScope } from '@/lib/api-key'
import { logAudit } from '@/lib/audit'

// ─── POST /api/integrations/orders ──────────────────────────────────────────
// Create a delivery listing from a sales order.
// Auth: API key (Bearer od_live_...)

interface OrderPayload {
  orderReference: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  deliveryAddress: string
  deliveryCity?: string
  deliveryCountry?: string
  deliveryLat?: number
  deliveryLng?: number
  deliveryNotes?: string
  cargoDescription: string
  cargoWeightKg: number
  cargoVolumeM3?: number
  cargoValue?: number
  cargoCurrency?: string
  preferredDate?: string   // ISO date
  urgency?: 'standard' | 'express' | 'flexible'
  originPort?: string      // Override company default origin
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const apiKey = await validateApiKey(request.headers.get('authorization'))
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 },
      )
    }

    if (!hasScope(apiKey, 'orders:write')) {
      return NextResponse.json(
        { error: 'API key does not have orders:write scope' },
        { status: 403 },
      )
    }

    const body = await request.json() as OrderPayload

    // --- Validate required fields ---
    const { orderReference, customerName, deliveryAddress, cargoDescription, cargoWeightKg } = body
    if (!orderReference || !customerName || !deliveryAddress || !cargoDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: orderReference, customerName, deliveryAddress, cargoDescription' },
        { status: 400 },
      )
    }
    if (!cargoWeightKg || cargoWeightKg <= 0) {
      return NextResponse.json(
        { error: 'cargoWeightKg must be a positive number' },
        { status: 400 },
      )
    }

    // --- Idempotency: check for duplicate orderReference ---
    const existing = await prisma.integrationOrder.findUnique({
      where: {
        userId_orderReference: {
          userId: apiKey.userId,
          orderReference,
        },
      },
      include: { listing: { select: { id: true, status: true } } },
    })
    if (existing) {
      return NextResponse.json({
        order: existing,
        listing: existing.listing,
        duplicate: true,
        message: `Order ${orderReference} already exists`,
      }, { status: 200 })
    }

    // --- Resolve origin port ---
    // Default to company address/city, or allow override
    const originPort = body.originPort || apiKey.user.company || 'TBD'
    const destinationPort = body.deliveryCity || body.deliveryAddress.split(',').pop()?.trim() || 'TBD'

    // --- Create the SPACE_NEEDED listing ---
    const listing = await prisma.listing.create({
      data: {
        carrierId: apiKey.userId,
        listingType: 'SPACE_NEEDED',
        title: `Delivery: ${orderReference} — ${customerName}`,
        description: [
          cargoDescription,
          body.deliveryNotes ? `Delivery notes: ${body.deliveryNotes}` : null,
          body.urgency === 'express' ? 'EXPRESS delivery requested' : null,
        ].filter(Boolean).join('\n'),
        vehicleType: 'N/A',
        originPort,
        destinationPort,
        destinationLat: body.deliveryLat ?? null,
        destinationLng: body.deliveryLng ?? null,
        destinationCountry: body.deliveryCountry ?? null,
        departureDate: body.preferredDate ? new Date(body.preferredDate) : new Date(),
        totalCapacityKg: cargoWeightKg,
        totalCapacityM3: body.cargoVolumeM3 || 1,
        availableKg: cargoWeightKg,
        availableM3: body.cargoVolumeM3 || 1,
        currency: body.cargoCurrency || 'EUR',
        insuranceValue: body.cargoValue ?? null,
        acceptedCargo: cargoDescription ? JSON.stringify([cargoDescription]) : null,
      },
      include: {
        carrier: { select: { id: true, avatarUrl: true } },
      },
    })

    // --- Create integration order record ---
    const order = await prisma.integrationOrder.create({
      data: {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        orderReference,
        listingId: listing.id,
        customerName,
        customerEmail: body.customerEmail ?? null,
        customerPhone: body.customerPhone ?? null,
        deliveryAddress,
        deliveryCity: body.deliveryCity ?? null,
        deliveryCountry: body.deliveryCountry ?? null,
        deliveryLat: body.deliveryLat ?? null,
        deliveryLng: body.deliveryLng ?? null,
        deliveryNotes: body.deliveryNotes ?? null,
        cargoDescription,
        cargoWeightKg,
        cargoVolumeM3: body.cargoVolumeM3 ?? null,
        cargoValue: body.cargoValue ?? null,
        cargoCurrency: body.cargoCurrency || 'EUR',
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
        urgency: body.urgency || 'standard',
        status: 'listed',
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    })

    // --- Audit log ---
    await logAudit({
      userId: apiKey.userId,
      action: 'INTEGRATION_ORDER_CREATED',
      targetId: order.id,
      details: { orderReference, listingId: listing.id, apiKeyId: apiKey.id },
      ipAddress: request.headers.get('x-client-ip') || undefined,
    }).catch(() => {})

    return NextResponse.json({
      order,
      listing: {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        originPort: listing.originPort,
        destinationPort: listing.destinationPort,
        departureDate: listing.departureDate,
      },
      message: 'Order created and listed successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('[integrations/orders] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// ─── GET /api/integrations/orders ───────────────────────────────────────────
// List orders for the authenticated company. Supports pagination & filtering.

export async function GET(request: NextRequest) {
  try {
    const apiKey = await validateApiKey(request.headers.get('authorization'))
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 },
      )
    }

    if (!hasScope(apiKey, 'orders:read')) {
      return NextResponse.json(
        { error: 'API key does not have orders:read scope' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status')
    const orderReference = searchParams.get('orderReference')

    const where: Record<string, unknown> = { userId: apiKey.userId }
    if (status) where.status = status
    if (orderReference) where.orderReference = { contains: orderReference, mode: 'insensitive' }

    const [orders, total] = await Promise.all([
      prisma.integrationOrder.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true, title: true, status: true,
              originPort: true, destinationPort: true,
              departureDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.integrationOrder.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[integrations/orders] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
