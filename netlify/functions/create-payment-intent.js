// netlify/functions/create-payment-intent.js
const Stripe = require('stripe')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { amount, currency = 'usd', metadata = {} } = JSON.parse(event.body)

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
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
      body: JSON.stringify({ error: err.message }),
    }
  }
}
