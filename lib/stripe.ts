import Stripe from 'stripe'

function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Return a proxy that throws helpful errors when methods are called
    // This avoids the "no apiKey" error at import time
    return new Proxy({} as Stripe, {
      get(_, prop) {
        if (prop === 'webhooks') {
          return {
            constructEvent: () => { throw new Error('STRIPE_SECRET_KEY not configured') },
          }
        }
        return () => { throw new Error('STRIPE_SECRET_KEY not configured') }
      },
    })
  }
  return new Stripe(key, {
    apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion,
  })
}

const stripe = createStripeClient()
export default stripe

// Default platform fee %, overridable per-call (the admin-configured value is
// read from settings and passed in by the booking-creation routes).
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export async function getOrCreateCustomer(email: string, name: string, userId: string): Promise<string> {
  // Check if customer already exists
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    return existing.data[0].id
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  })
  return customer.id
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────

export async function createCheckoutSession(params: {
  bookingId: string
  amount: number
  currency: string
  customerEmail: string
  customerName: string
  description: string
  origin: string
  destination: string
  successUrl: string
  cancelUrl: string
  carrierStripeAccountId?: string
  vatAmount?: number
  vatRate?: number
}): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateCustomer(params.customerEmail, params.customerName, params.bookingId)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: {
          name: params.description,
          description: `${params.origin} → ${params.destination}`,
          metadata: { bookingId: params.bookingId },
        },
        unit_amount: Math.round(params.amount * 100),
      },
      quantity: 1,
    },
  ]
  // Show VAT as its own transparent line so the customer sees net + VAT.
  if (params.vatAmount && params.vatAmount > 0) {
    lineItems.push({
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: {
          name: `VAT${params.vatRate ? ` (${params.vatRate}%)` : ''}`,
          description: 'Value Added Tax',
          metadata: { bookingId: params.bookingId },
        },
        unit_amount: Math.round(params.vatAmount * 100),
      },
      quantity: 1,
    })
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Expire the Stripe session after 30 minutes to match local checkoutExpiresAt
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: {
      bookingId: params.bookingId,
    },
    // ESCROW: charge to the PLATFORM balance (no transfer_data / destination
    // charge). The carrier payout is transferred separately on delivery
    // confirmation (see lib/payout.ts). Always propagate bookingId onto the
    // PaymentIntent/Charge — Stripe does NOT copy session metadata, and the
    // payment_failed / canceled / refunded webhook handlers key on it.
    payment_intent_data: {
      metadata: { bookingId: params.bookingId },
    },
  }

  return stripe.checkout.sessions.create(sessionParams)
}

// ─── PAYMENT INTENT ───────────────────────────────────────────────────────────

export async function createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  })
  return paymentIntent
}

// ─── CONNECT ──────────────────────────────────────────────────────────────────

export async function createConnectAccount(email: string, country: string = 'FR') {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
  return account
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  }
}

// ─── TRANSFERS (escrow payout) ──────────────────────────────────────────────

/**
 * Transfer a carrier's payout from the platform balance to their connected
 * account. Used to release escrowed funds once a delivery is confirmed.
 */
export async function createTransfer(params: {
  amount: number
  currency: string
  destination: string
  bookingId: string
}): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency.toLowerCase(),
    destination: params.destination,
    metadata: { bookingId: params.bookingId },
  })
}

/**
 * Reverse a carrier payout transfer (fully or partially) — used when a
 * delivered booking is later refunded and the platform needs to claw the
 * carrier's payout back.
 */
export async function reverseTransfer(transferId: string, amount?: number): Promise<Stripe.TransferReversal> {
  return stripe.transfers.createReversal(transferId, {
    amount: amount != null ? Math.round(amount * 100) : undefined,
  })
}

// ─── REFUND ───────────────────────────────────────────────────────────────────

export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  opts?: { reverseTransfer?: boolean; refundApplicationFee?: boolean; idempotencyKey?: string },
) {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  }
  // For Connect destination charges, claw the money back from the carrier's
  // transfer and return the platform fee proportionally — otherwise the platform
  // refunds the shipper out of its own balance while the carrier keeps the payout.
  if (opts?.reverseTransfer) refundParams.reverse_transfer = true
  if (opts?.refundApplicationFee) refundParams.refund_application_fee = true
  // An idempotency key makes a retried/concurrent refund a no-op at Stripe,
  // preventing a double refund if the request is duplicated.
  return stripe.refunds.create(refundParams, opts?.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined)
}

// ─── WEBHOOK VERIFICATION ─────────────────────────────────────────────────────

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

/** Map an ISO currency code to its display symbol (EUR/GBP/USD supported). */
export function currencySymbol(currency: string | null | undefined): string {
  switch ((currency || 'EUR').toUpperCase()) {
    case 'GBP': return '£'
    case 'USD': return '$'
    default: return '€'
  }
}

export function calculatePlatformFee(amount: number, percent: number = PLATFORM_FEE_PERCENT): number {
  return Math.round(amount * (percent / 100) * 100) / 100
}

export function calculateCarrierPayout(amount: number, percent: number = PLATFORM_FEE_PERCENT): number {
  const fee = calculatePlatformFee(amount, percent)
  return Math.round((amount - fee) * 100) / 100
}
