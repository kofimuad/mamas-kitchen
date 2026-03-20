const { MongoClient } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

// Simple in-memory rate limiter — max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map()
function isRateLimited(ip) {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000 // 10 minutes
  const maxRequests = 5

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [])
  }
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs)
  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return timestamps.length > maxRequests
}

// Sanitise a string — strip HTML tags, limit length
function sanitise(str, maxLen = 200) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, maxLen)
}

// ── TEMPLATE VERSION (uncomment when new_order_notification template is approved) ──
// async function sendWhatsAppTemplate(order, adminLink) {
//   const items     = order.items || []
//   const info      = order.info  || {}
//   const itemsText = items.map(p => `${p.name}${p.qty > 1 ? ` x${p.qty}` : ''}`).join(', ')
//   const payLabel  = info.paymentMethod === 'cashapp' ? 'Cash App' : 'Zelle'
//   const res = await fetch(
//     `https://graph.facebook.com/v22.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
//     {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         messaging_product: 'whatsapp',
//         to:   process.env.MAMA_WHATSAPP_NUMBER,
//         type: 'template',
//         template: {
//           name:     'new_order_notification',
//           language: { code: 'en' },
//           components: [{
//             type:       'body',
//             parameters: [
//               { type: 'text', text: info.name          || '—' },
//               { type: 'text', text: `${info.branch || '—'}${info.battalion ? ' · ' + info.battalion : ''}` },
//               { type: 'text', text: itemsText           || '—' },
//               { type: 'text', text: String(order.total || 0) },
//               { type: 'text', text: payLabel },
//               { type: 'text', text: info.paymentHandle  || '—' },
//               { type: 'text', text: adminLink },
//             ],
//           }],
//         },
//       }),
//     }
//   )
//   const data = await res.json()
//   if (!res.ok) throw new Error(`WhatsApp error: ${JSON.stringify(data)}`)
//   return data
// }

// ── FREE-FORM VERSION (active — works within 24hr window) ──
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
        to:   process.env.MAMA_WHATSAPP_NUMBER,
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

  // Rate limiting
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown'
  if (isRateLimited(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests. Please wait before submitting again.' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  const { orderType, items, info, total } = body

  // Validate required fields
  if (!['plate', 'tray'].includes(orderType)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid order type' }) }
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid items' }) }
  }
  if (!info?.name || !info?.branch) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }
  if (typeof total !== 'number' || total < 0 || total > 10000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid total' }) }
  }

  // Sanitise all string inputs
  const cleanInfo = {
    name:          sanitise(info.name, 100),
    phone:         sanitise(info.phone, 20),
    branch:        sanitise(info.branch, 50),
    battalion:     sanitise(info.battalion, 100),
    paymentMethod: ['zelle', 'cashapp'].includes(info.paymentMethod) ? info.paymentMethod : 'zelle',
    paymentHandle: sanitise(info.paymentHandle, 100),
  }

  const cleanItems = items.slice(0, 20).map(p => ({
    id:    sanitise(p.id, 100),
    name:  sanitise(p.name, 150),
    price: typeof p.price === 'number' ? Math.max(0, Math.min(p.price, 1000)) : 0,
    qty:   typeof p.qty === 'number'   ? Math.max(1, Math.min(p.qty, 50))     : 1,
  }))

  try {
    const db = await getDB()
    const order = {
      orderType,
      items:     cleanItems,
      total,
      info:      cleanInfo,
      status:    'pending_payment',
      createdAt: new Date(),
    }

    const result  = await db.collection('orders').insertOne(order)
    const orderId = result.insertedId.toString()

    const baseUrl    = process.env.SITE_URL || 'https://obaayaakitchen.netlify.app'
    const adminLink  = `${baseUrl}/admin/orders/${orderId}`
    const statusLink = `${baseUrl}/order-status/${orderId}`
    const divider    = '─────────────────────'
    const itemsText  = cleanItems.map(p =>
      `  • ${p.name}${p.qty > 1 ? ` ×${p.qty}` : ''} — $${p.price * p.qty}`
    ).join('\n')
    const payLabel = cleanInfo.paymentMethod === 'zelle' ? 'Zelle' : 'Cash App'

    const message =
      `🍛 *New Order — Obaa Yaa's Kitchen*\n${divider}\n\n` +
      `👤 *${cleanInfo.name}*\n📞 ${cleanInfo.phone || '—'}\n` +
      `🪖 ${cleanInfo.branch}${cleanInfo.battalion ? ' · ' + cleanInfo.battalion : ''}\n\n` +
      `🍽 *Order (${orderType === 'tray' ? 'Tray — Wed' : 'Plate — Sat'}):*\n${itemsText}\n\n` +
      `💰 *Total: $${total}*\n💳 Paying via *${payLabel}*\n   Handle: *${cleanInfo.paymentHandle}*\n\n` +
      `${divider}\n✅ *Confirm order here:*\n${adminLink}\n\n📋 Customer status:\n${statusLink}`

    try {
      await sendWhatsApp(message)
    } catch (waErr) {
      console.error('WhatsApp send failed:', waErr.message)
      // Don't fail the order if WhatsApp fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, orderId }),
    }
  } catch (err) {
    console.error('submit-order error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to place order' }) }
  }
}
