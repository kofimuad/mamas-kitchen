// netlify/functions/create-payment-intent.js
const Stripe = require('stripe')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { amount, currency = 'usd', metadata = {} } = JSON.parse(event.body)

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 50 || amount > 100000) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) }
    }

    // Build metadata explicitly — never pass raw client object to Stripe
    const safeMetadata = {
      customerName: String(metadata.customerName || '').slice(0, 500),
      phone:        String(metadata.phone        || '').slice(0, 500),
      branch:       String(metadata.branch       || '').slice(0, 500),
      battalion:    String(metadata.battalion    || '').slice(0, 500),
      plates:       String(metadata.plates       || '[]').slice(0, 500),
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: safeMetadata,
      // Enable Apple Pay + CashApp Pay
      payment_method_types: ['card', 'cashapp'],
      // Apple Pay works automatically via 'card' type on Safari
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    }
  } catch (err) {
    console.error('PaymentIntent error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create payment intent' }),
    }
  }
}
