import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
})

export default stripe

// Create a payment intent for booking
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Create a Connect account for carriers
export async function createConnectAccount(email: string, country: string = 'FR') {
  try {
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
  } catch (error) {
    console.error('Error creating Connect account:', error)
    throw error
  }
}

// Create account link for onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

// Transfer funds to carrier
export async function transferToCarrier(amount: number, connectedAccountId: string, metadata: Record<string, string>) {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      destination: connectedAccountId,
      metadata,
    })
    return transfer
  } catch (error) {
    console.error('Error transferring to carrier:', error)
    throw error
  }
}
