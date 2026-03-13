// netlify/functions/submit-order.js
// Called when customer submits their order (no payment yet)
// Saves order to MongoDB and sends WhatsApp to Obaa Yaa

const { MongoClient, ObjectId } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

async function sendWhatsApp(message) {
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: process.env.MAMA_WHATSAPP_NUMBER,
        type: 'text',
        text: { body: message },
      }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`WhatsApp error: ${JSON.stringify(data)}`)
  return data
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { orderType, items, info, total } = JSON.parse(event.body)

    if (!items?.length || !info?.name || !info?.branch) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    const db = await getDB()

    // Build order document
    const order = {
      orderType,
      items,
      info: {
        name:           info.name,
        phone:          info.phone || '',
        branch:         info.branch,
        battalion:      info.battalion || '',
        paymentMethod:  info.paymentMethod, // 'zelle' | 'cashapp'
        paymentHandle:  info.paymentHandle, // their zelle/cashapp username
      },
      total,
      status:    'pending_payment', // pending_payment → confirmed → delivered
      createdAt: new Date(),
    }

    const result = await db.collection('orders').insertOne(order)
    const orderId = result.insertedId.toString()

    // Build WhatsApp message for Obaa Yaa
    const baseUrl   = process.env.SITE_URL || 'https://obaayaakitchen.netlify.app'
    const adminLink = `${baseUrl}/admin/orders/${orderId}`
    const statusLink = `${baseUrl}/order-status/${orderId}`

    const divider    = '─────────────────────'
    const itemsText  = items.map(p =>
      `  • ${p.name}${p.qty > 1 ? ` ×${p.qty}` : ''} — $${p.price * p.qty}`
    ).join('\n')

    const payLabel = info.paymentMethod === 'zelle' ? 'Zelle' : 'Cash App'

    const message =
      `🍛 *New Order — Obaa Yaa's Kitchen*\n` +
      `${divider}\n\n` +
      `👤 *${info.name}*\n` +
      `📞 ${info.phone || '—'}\n` +
      `🪖 ${info.branch}${info.battalion ? ' · ' + info.battalion : ''}\n\n` +
      `🍽 *Order (${orderType === 'tray' ? 'Tray — Wed' : 'Plate — Sat'}):*\n` +
      `${itemsText}\n\n` +
      `💰 *Total: $${total}*\n` +
      `💳 Paying via *${payLabel}*\n` +
      `   Handle: *${info.paymentHandle}*\n\n` +
      `${divider}\n` +
      `✅ *Confirm order here:*\n${adminLink}\n\n` +
      `📋 Customer status page:\n${statusLink}`

    await sendWhatsApp(message)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, orderId }),
    }
  } catch (err) {
    console.error('submit-order error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
