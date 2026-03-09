// netlify/functions/webhook.js
// Stripe calls this after every successful payment.
// Saves the order to MongoDB and sends a WhatsApp notification to Obaa Yaa.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

// ── Format a clean WhatsApp message ──────────────────────────
function buildMessage(order) {
  const divider = '─────────────────────'
  const plates  = order.plates.map(p =>
    `  • ${p.name}${p.qty > 1 ? ` ×${p.qty}` : ''} — $${p.price * p.qty}`
  ).join('\n')

  return (
    `🍛 *New Order — Obaa Yaa's Kitchen*\n` +
    `${divider}\n\n` +
    `👤 *${order.customerName}*\n` +
    `📞 ${order.phone || '—'}\n` +
    `🪖 ${order.branch} · ${order.battalion}\n\n` +
    `🍽 *Order:*\n${plates}\n\n` +
    `💳 *${order.paymentMethod}*  ✅ Paid *$${order.total}*\n` +
    `${divider}\n` +
    `🕐 ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET`
  )
}

// ── Send WhatsApp via Meta Cloud API ─────────────────────────
async function sendWhatsApp(message) {
  const url = `https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to:   process.env.MAMA_WHATSAPP_NUMBER, // format: 15551234567 (no + or spaces)
      type: 'text',
      text: { body: message },
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`WhatsApp error: ${JSON.stringify(data)}`)
  return data
}

// ── Main webhook handler ──────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Verify the request is genuinely from Stripe
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Stripe signature failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: 'Ignored' }
  }

  const pi   = stripeEvent.data.object
  const meta = pi.metadata || {}

  try {
    const db = await getDB()

    // Avoid processing duplicate webhooks
    const existing = await db.collection('orders').findOne({ stripePaymentId: pi.id })
    if (existing) {
      console.log('Duplicate webhook, skipping:', pi.id)
      return { statusCode: 200, body: 'Already processed' }
    }

    // Parse plate IDs from metadata and look up names/prices from saved menu
    const plateIds   = JSON.parse(meta.plates || '[]')
    const menuConfig = await db.collection('menu_config').findOne({ _id: 'current' })
    const allItems   = [
      ...(menuConfig?.plateItems || []),
      ...(menuConfig?.trayItems  || []),
    ]

    // Group plate IDs into counts e.g. ['jollof-chicken','jollof-chicken'] → [{name,qty,price}]
    const plateCounts = {}
    plateIds.forEach(id => { plateCounts[id] = (plateCounts[id] || 0) + 1 })

    const plates = Object.entries(plateCounts).map(([id, qty]) => {
      const item = allItems.find(m => m.id === id)
      return {
        id,
        name:  item?.name  || id,
        price: item?.price || 0,
        qty,
      }
    })

    // Determine payment method label
    const methodMap = { cashapp: 'Cash App Pay', apple_pay: 'Apple Pay', card: 'Card' }
    const paymentMethod = methodMap[pi.payment_method_types?.[0]] || 'Card'

    const order = {
      stripePaymentId: pi.id,
      customerName:    meta.customerName  || 'Unknown',
      phone:           meta.phone         || '',
      branch:          meta.branch        || '',
      battalion:       meta.battalion     || '',
      plates,
      total:           pi.amount_received / 100,
      paymentMethod,
      paymentStatus:   'paid',
      status:          'new',
      createdAt:       new Date(),
    }

    // Save order to MongoDB
    await db.collection('orders').insertOne(order)
    console.log('✓ Order saved:', pi.id)

    // Send WhatsApp to Obaa Yaa
    const message = buildMessage(order)
    await sendWhatsApp(message)
    console.log('✓ WhatsApp sent for order:', pi.id)

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, orderId: order._id }),
    }
  } catch (err) {
    console.error('Webhook error:', err)
    // Still return 200 so Stripe doesn't keep retrying
    return { statusCode: 200, body: JSON.stringify({ error: err.message }) }
  }
}
