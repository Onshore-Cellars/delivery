// Push notification sender — uses Web Push Protocol
// Requires VAPID keys: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
import prisma from '@/lib/prisma'
import crypto from 'crypto'

interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  type?: string
  requireInteraction?: boolean
  actions?: { action: string; title: string }[]
}

// ─── Send push to a specific user ───────────────────────────────────────────

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, active: true },
  })

  if (subscriptions.length === 0) return 0

  let sent = 0
  for (const sub of subscriptions) {
    try {
      const success = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      if (success) sent++
      else {
        // Mark subscription as inactive if delivery failed
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { active: false },
        })
      }
    } catch {
      // Subscription is stale, deactivate
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { active: false },
      })
    }
  }

  return sent
}

// ─── Web Push implementation ─────────────────────────────────────────────────
// Uses the Web Push Protocol with VAPID authentication

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
  const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:push@onshore.delivery'

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('[Push] VAPID keys not configured — skipping push notification')
    console.log('[Push] Would send to:', subscription.endpoint.slice(0, 60) + '...')
    console.log('[Push] Payload:', JSON.stringify(payload))
    return true // Don't deactivate the subscription
  }

  try {
    // Build and sign JWT for VAPID using ES256
    const audience = new URL(subscription.endpoint).origin
    const base64url = (buf: Buffer | string) =>
      (typeof buf === 'string' ? Buffer.from(buf) : buf)
        .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const header = base64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
    const now = Math.floor(Date.now() / 1000)
    const claims = base64url(JSON.stringify({
      aud: audience,
      exp: now + 86400,
      sub: VAPID_EMAIL,
    }))

    const unsignedToken = `${header}.${claims}`
    const keyPem = Buffer.from(VAPID_PRIVATE_KEY, 'base64url')
    const key = crypto.createPrivateKey({ key: keyPem, format: 'der', type: 'pkcs8' })
    const signature = crypto.sign('sha256', Buffer.from(unsignedToken), key)
    const token = `${unsignedToken}.${base64url(signature)}`

    const body = JSON.stringify(payload)

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Authorization': `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
      },
      body,
    })

    if (res.status === 201 || res.status === 200) return true
    if (res.status === 410 || res.status === 404) return false // Gone — subscription expired

    console.error(`[Push] Unexpected response: ${res.status}`)
    return res.status < 500 // Don't deactivate on server errors
  } catch (error) {
    console.error('[Push] Send error:', error)
    return false
  }
}

// ─── Convenience helpers for common notifications ───────────────────────────

export async function pushBookingUpdate(userId: string, trackingCode: string, status: string) {
  return sendPushToUser(userId, {
    title: `Shipment ${status.replace('_', ' ')}`,
    body: `Your shipment ${trackingCode} is now ${status.replace('_', ' ').toLowerCase()}.`,
    url: `/dashboard`,
    tag: `booking-${trackingCode}`,
    type: 'BOOKING_STATUS_UPDATE',
  })
}

export async function pushNewMessage(userId: string, senderName: string, preview: string) {
  return sendPushToUser(userId, {
    title: `Message from ${senderName}`,
    body: preview.slice(0, 100),
    url: '/messages',
    tag: `message-${senderName}`,
    type: 'MESSAGE_RECEIVED',
  })
}

export async function pushNewBid(userId: string, bidderName: string, amount: string, listingTitle: string) {
  return sendPushToUser(userId, {
    title: 'New Bid Received',
    body: `${bidderName} bid ${amount} on "${listingTitle}"`,
    url: '/dashboard',
    tag: `bid-${listingTitle}`,
    type: 'BID_RECEIVED',
    actions: [{ action: 'view', title: 'Review' }],
  })
}

export async function pushDeliveryConfirmed(userId: string, trackingCode: string) {
  return sendPushToUser(userId, {
    title: 'Delivery Confirmed',
    body: `Shipment ${trackingCode} has been delivered and signed for.`,
    url: `/dashboard`,
    tag: `delivered-${trackingCode}`,
    type: 'BOOKING_STATUS_UPDATE',
    requireInteraction: true,
    actions: [{ action: 'view', title: 'View POD' }],
  })
}
