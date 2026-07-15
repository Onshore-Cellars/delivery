import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

// ─── POST /api/integrations/shopify ─────────────────────────────────────────
// Shopify "orders/create" webhook receiver. Creates an IntegrationOrder +
// SPACE_NEEDED listing from a Shopify order, same as /api/integrations/orders.
//
// Setup (Shopify admin → Settings → Notifications → Webhooks, or via API):
//   URL:    https://<host>/api/integrations/shopify
//   Event:  Order creation, format JSON
// Env vars:
//   SHOPIFY_WEBHOOK_SECRET     — webhook signing secret shown by Shopify
//   SHOPIFY_ORDERS_USER_EMAIL  — platform account that owns incoming orders

interface ShopifyLineItem { title?: string; quantity?: number; grams?: number; price?: string }
interface ShopifyAddress {
  name?: string; address1?: string; address2?: string; city?: string; zip?: string
  country?: string; country_code?: string; phone?: string; latitude?: number; longitude?: number
}
interface ShopifyOrder {
  id?: number
  name?: string             // e.g. "#1001"
  order_number?: number
  email?: string
  phone?: string
  currency?: string
  total_price?: string
  note?: string
  created_at?: string
  line_items?: ShopifyLineItem[]
  shipping_address?: ShopifyAddress
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string }
}

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  const a = Buffer.from(digest)
  const b = Buffer.from(hmacHeader)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET
    const ownerEmail = process.env.SHOPIFY_ORDERS_USER_EMAIL
    if (!secret || !ownerEmail) {
      return NextResponse.json({ error: 'Shopify integration not configured' }, { status: 503 })
    }

    // HMAC must be computed over the RAW body, before JSON parsing
    const rawBody = await request.text()
    if (!verifyShopifyHmac(rawBody, request.headers.get('x-shopify-hmac-sha256'), secret)) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 })
    }

    const topic = request.headers.get('x-shopify-topic') || ''
    if (topic && topic !== 'orders/create') {
      // Acknowledge unrelated topics so Shopify doesn't retry
      return NextResponse.json({ ignored: true, topic })
    }

    const order = JSON.parse(rawBody) as ShopifyOrder
    const orderReference = `shopify-${order.order_number ?? order.id ?? ''}`
    if (orderReference === 'shopify-') {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true, company: true } })
    if (!owner) {
      console.error('[shopify] SHOPIFY_ORDERS_USER_EMAIL does not match any user')
      return NextResponse.json({ error: 'Integration owner not found' }, { status: 503 })
    }

    // Idempotency — Shopify retries webhooks
    const existing = await prisma.integrationOrder.findUnique({
      where: { userId_orderReference: { userId: owner.id, orderReference } },
    })
    if (existing) {
      return NextResponse.json({ order: existing, duplicate: true })
    }

    const ship = order.shipping_address
    if (!ship?.address1) {
      // No delivery address (e.g. digital order) — acknowledge without creating
      return NextResponse.json({ ignored: true, reason: 'No shipping address' })
    }

    const customerName = ship.name
      || [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ')
      || 'Shopify customer'
    const deliveryAddress = [ship.address1, ship.address2, ship.city, ship.zip, ship.country].filter(Boolean).join(', ')
    const items = order.line_items || []
    const cargoDescription = items.length
      ? items.map(li => `${li.quantity ?? 1}× ${li.title ?? 'item'}`).join(', ').slice(0, 1000)
      : 'Shopify order'
    const weightKg = Math.max(
      items.reduce((s, li) => s + ((li.grams ?? 0) * (li.quantity ?? 1)) / 1000, 0),
      1, // Listings need a positive capacity even when Shopify has no weights
    )

    const listing = await prisma.listing.create({
      data: {
        carrierId: owner.id,
        listingType: 'SPACE_NEEDED',
        title: `Delivery: ${order.name || orderReference} — ${customerName}`,
        description: [cargoDescription, order.note ? `Order notes: ${order.note}` : null].filter(Boolean).join('\n'),
        vehicleType: 'N/A',
        originPort: owner.company || 'TBD',
        destinationPort: ship.city || deliveryAddress.split(',').pop()?.trim() || 'TBD',
        destinationLat: ship.latitude ?? null,
        destinationLng: ship.longitude ?? null,
        destinationCountry: ship.country_code ?? ship.country ?? null,
        departureDate: new Date(),
        totalCapacityKg: weightKg,
        totalCapacityM3: 1,
        availableKg: weightKg,
        availableM3: 1,
        currency: order.currency || 'EUR',
        insuranceValue: order.total_price ? parseFloat(order.total_price) : null,
        acceptedCargo: JSON.stringify([cargoDescription]),
      },
    })

    const integrationOrder = await prisma.integrationOrder.create({
      data: {
        userId: owner.id,
        orderReference,
        listingId: listing.id,
        customerName,
        customerEmail: order.email || order.customer?.email || null,
        customerPhone: ship.phone || order.phone || order.customer?.phone || null,
        deliveryAddress,
        deliveryCity: ship.city ?? null,
        deliveryCountry: ship.country ?? null,
        deliveryLat: ship.latitude ?? null,
        deliveryLng: ship.longitude ?? null,
        deliveryNotes: order.note ?? null,
        cargoDescription,
        cargoWeightKg: weightKg,
        cargoValue: order.total_price ? parseFloat(order.total_price) : null,
        cargoCurrency: order.currency || 'EUR',
        status: 'listed',
        metadata: JSON.stringify({ source: 'shopify', shopifyOrderId: order.id, shopifyOrderName: order.name }),
      },
    })

    await logAudit({
      userId: owner.id,
      action: 'INTEGRATION_ORDER_CREATED',
      targetId: integrationOrder.id,
      details: { orderReference, listingId: listing.id, source: 'shopify' },
    }).catch(() => {})

    return NextResponse.json({ order: integrationOrder, listing: { id: listing.id } }, { status: 201 })
  } catch (error) {
    console.error('[integrations/shopify] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
