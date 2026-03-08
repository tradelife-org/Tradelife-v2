import Stripe from 'stripe'

// Prevent build failure if key is missing. 
// Runtime validation should happen when actions are called.
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia' as any, 
  typescript: true,
})
