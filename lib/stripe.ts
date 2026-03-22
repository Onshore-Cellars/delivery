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

const PLATFORM_FEE_PERCENT = 10 // 10% platform fee

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
}): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateCustomer(params.customerEmail, params.customerName, params.bookingId)

  const platformFee = Math.round(params.amount * 100 * (PLATFORM_FEE_PERCENT / 100))

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
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
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      bookingId: params.bookingId,
    },
  }

  // If carrier has Stripe Connect, use platform fees
  if (params.carrierStripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: params.carrierStripeAccountId,
      },
    }
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

// ─── REFUND ───────────────────────────────────────────────────────────────────

export async function createRefund(paymentIntentId: string, amount?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
}

// ─── WEBHOOK VERIFICATION ─────────────────────────────────────────────────────

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100
}

export function calculateCarrierPayout(amount: number): number {
  const fee = calculatePlatformFee(amount)
  return Math.round((amount - fee) * 100) / 100
}
