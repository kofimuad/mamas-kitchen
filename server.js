// server.js — local dev backend
// Run with: node server.js
// Handles: /api/get-menu, /api/save-menu, /api/get-orders, /api/create-payment-intent, /api/webhook

import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import Stripe from 'stripe'
import * as dotenv from 'dotenv'
dotenv.config()

const app  = express()
const PORT = 3001

app.use(cors())

// ── IMPORTANT: webhook needs raw body for signature verification ──
// Must be registered BEFORE express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))

// ── MongoDB connection ──────────────────────────────────────
let client
async function db() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    console.log('✓ MongoDB connected')
  }
  return client.db('mamas_kitchen')
}

// ── Auth middleware for admin routes ───────────────────────
function adminOnly(req, res, next) {
  const secret = req.headers['x-admin-secret']
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ── POST /api/webhook ─────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.json({ ignored: true })
  }

  const pi   = event.data.object
  const meta = pi.metadata || {}

  try {
    const database = await db()

    // Avoid duplicate processing
    const existing = await database.collection('orders').findOne({ stripePaymentId: pi.id })
    if (existing) {
      console.log('Duplicate webhook, skipping:', pi.id)
      return res.json({ received: true })
    }

    // Look up menu items to get plate names
    const menuConfig = await database.collection('menu_config').findOne({ _id: 'current' })
    const allItems   = [...(menuConfig?.plateItems || []), ...(menuConfig?.trayItems || [])]

    const plateIds    = JSON.parse(meta.plates || '[]')
    const plateCounts = {}
    plateIds.forEach(id => { plateCounts[id] = (plateCounts[id] || 0) + 1 })

    const plates = Object.entries(plateCounts).map(([id, qty]) => {
      const item = allItems.find(m => m.id === id)
      return { id, name: item?.name || id, price: item?.price || 0, qty }
    })

    const methodMap     = { cashapp: 'Cash App Pay', apple_pay: 'Apple Pay', card: 'Card' }
    const paymentMethod = methodMap[pi.payment_method_types?.[0]] || 'Card'

    const order = {
      stripePaymentId: pi.id,
      customerName:    meta.customerName || 'Unknown',
      phone:           meta.phone        || '',
      branch:          meta.branch       || '',
      battalion:       meta.battalion    || '',
      plates,
      total:           pi.amount_received / 100,
      paymentMethod,
      paymentStatus:   'paid',
      status:          'new',
      createdAt:       new Date(),
    }

    await database.collection('orders').insertOne(order)
    console.log('✓ Order saved:', pi.id)

    // Send WhatsApp to Obaa Yaa
    const divider = '─────────────────────'
    const platesText = plates.map(p =>
      `  • ${p.name}${p.qty > 1 ? ` ×${p.qty}` : ''} — $${p.price * p.qty}`
    ).join('\n')

    const message =
      `🍛 *New Order — Obaa Yaa's Kitchen*\n` +
      `${divider}\n\n` +
      `👤 *${order.customerName}*\n` +
      `📞 ${order.phone || '—'}\n` +
      `🪖 ${order.branch} · ${order.battalion}\n\n` +
      `🍽 *Order:*\n${platesText}\n\n` +
      `💳 *${paymentMethod}*  ✅ Paid *$${order.total}*\n` +
      `${divider}`

    const waRes = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:   process.env.MAMA_WHATSAPP_NUMBER,
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const waData = await waRes.json()
    if (waRes.ok) {
      console.log('✓ WhatsApp sent for order:', pi.id)
      console.log('  WhatsApp response:', JSON.stringify(waData))
    } else {
      console.error('✗ WhatsApp FAILED:', JSON.stringify(waData))
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    res.status(200).json({ error: err.message }) // 200 so Stripe doesn't retry
  }
})

// ── POST /api/submit-order ─────────────────────────────────
app.post('/api/submit-order', async (req, res) => {
  try {
    const { orderType, items, info, total } = req.body
    if (!items?.length || !info?.name || !info?.branch) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const database = await db()
    const order = {
      orderType, items, total,
      info: {
        name:          info.name,
        phone:         info.phone || '',
        branch:        info.branch,
        battalion:     info.battalion || '',
        paymentMethod: info.paymentMethod,
        paymentHandle: info.paymentHandle,
      },
      status:    'pending_payment',
      createdAt: new Date(),
    }

    const result  = await database.collection('orders').insertOne(order)
    const orderId = result.insertedId.toString()

    // WhatsApp notification
    const baseUrl    = process.env.SITE_URL || `http://localhost:5173`
    const adminLink  = `${baseUrl}/admin/orders/${orderId}`
    const statusLink = `${baseUrl}/order-status/${orderId}`
    const itemsText  = items.map(p => `  • ${p.name}${p.qty > 1 ? ` ×${p.qty}` : ''} — $${p.price * p.qty}`).join('\n')
    const payLabel   = info.paymentMethod === 'zelle' ? 'Zelle' : 'Cash App'
    const divider    = '─────────────────────'

    const message =
      `🍛 *New Order — Obaa Yaa's Kitchen*\n${divider}\n\n` +
      `👤 *${info.name}*\n📞 ${info.phone || '—'}\n🪖 ${info.branch}${info.battalion ? ' · ' + info.battalion : ''}\n\n` +
      `🍽 *Order (${orderType === 'tray' ? 'Tray — Wed' : 'Plate — Sat'}):*\n${itemsText}\n\n` +
      `💰 *Total: $${total}*\n💳 Paying via *${payLabel}*\n   Handle: *${info.paymentHandle}*\n\n` +
      `${divider}\n✅ *Confirm order here:*\n${adminLink}\n\n📋 Customer status:\n${statusLink}`

    try {
      const waRes = await fetch(`https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: process.env.MAMA_WHATSAPP_NUMBER, type: 'text', text: { body: message } }),
      })
      if (waRes.ok) console.log('✓ WhatsApp sent for order:', orderId)
      else console.error('WhatsApp failed:', await waRes.text())
    } catch (waErr) { console.error('WhatsApp error:', waErr.message) }

    res.json({ success: true, orderId })
  } catch (err) {
    console.error('submit-order error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/get-order?id=xxx ──────────────────────────────
app.get('/api/get-order', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const database = await db()
    const order = await database.collection('orders').findOne({ _id: new ObjectId(id) })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({
      orderId:      order._id.toString(),
      status:       order.status,
      orderType:    order.orderType,
      items:        order.items,
      total:        order.total,
      customerName: order.info?.name,
      createdAt:    order.createdAt,
      confirmedAt:  order.confirmedAt || null,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/confirm-order ────────────────────────────────
app.post('/api/confirm-order', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { orderId, status } = req.body
    if (!orderId || !status) return res.status(400).json({ error: 'Missing fields' })
    const database = await db()
    await database.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, confirmedAt: new Date(), updatedAt: new Date() } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/create-payment-intent (DISABLED) ─────────────
// Stripe payments removed — using Zelle/CashApp direct payment
// app.post('/api/create-payment-intent', async (req, res) => { ... })

// ── POST /api/test-whatsapp ────────────────────────────────
// Test your WhatsApp config without needing a real payment
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const url = `https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:   process.env.MAMA_WHATSAPP_NUMBER,
        type: 'text',
        text: { body: `🍛 *Test Message — Obaa Yaa's Kitchen*\n\nWhatsApp notifications are working! ✅` },
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(data))
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/create-payment-intent ───────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const { amount, currency = 'usd', metadata = {} } = req.body

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      payment_method_types: ['card', 'cashapp'],
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('PaymentIntent error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/get-menu ──────────────────────────────────────
app.get('/api/get-menu', async (req, res) => {
  try {
    const doc = await (await db()).collection('menu_config').findOne({ _id: 'current' })
    if (!doc) return res.json({ exists: false })
    res.json({ exists: true, plateItems: doc.plateItems, trayItems: doc.trayItems, updatedAt: doc.updatedAt })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/save-menu ────────────────────────────────────
app.post('/api/save-menu', async (req, res) => {
  try {
    const { plateItems, trayItems } = req.body
    if (!plateItems || !trayItems) return res.status(400).json({ error: 'Missing data' })

    await (await db()).collection('menu_config').updateOne(
      { _id: 'current' },
      { $set: { _id: 'current', plateItems, trayItems, updatedAt: new Date() } },
      { upsert: true }
    )
    res.json({ success: true, savedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/get-orders ────────────────────────────────────
app.get('/api/get-orders', async (req, res) => {
  try {
    const orders = await (await db()).collection('orders')
      .find({}).sort({ createdAt: -1 }).limit(100).toArray()
    res.json({ orders })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/orders/:id ──────────────────────────────────
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const { status } = req.body
    await (await db()).collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`✓ API server running at http://localhost:${PORT}`)
  console.log(`  GET  http://localhost:${PORT}/api/get-menu`)
  console.log(`  POST http://localhost:${PORT}/api/save-menu`)
  console.log(`  GET  http://localhost:${PORT}/api/get-orders`)
})

// ── RATE LIMITING (uncomment when ready to deploy) ─────────
// npm install express-rate-limit
// import rateLimit from 'express-rate-limit'
//
// const orderLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10,                   // max 10 requests per IP
//   message: { error: 'Too many requests, please try again later.' },
// })
// const whatsappLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5,                    // max 5 WhatsApp tests per hour
//   message: { error: 'Too many requests.' },
// })
//
// Apply like this:
// app.post('/api/create-payment-intent', orderLimiter, async (req, res) => { ... })
// app.post('/api/test-whatsapp', whatsappLimiter, async (req, res) => { ... })
