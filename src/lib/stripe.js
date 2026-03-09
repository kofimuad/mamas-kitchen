// src/lib/stripe.js
// Stripe client for the frontend
// Used by Payment.jsx to initialise Stripe Elements

import { loadStripe } from '@stripe/stripe-js'

// Stripe publishable key — safe to expose on the frontend
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default stripePromise
