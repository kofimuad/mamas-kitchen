// src/lib/whatsapp.js
// Helper to format and send WhatsApp messages via Meta Cloud API
// This runs SERVER-SIDE only (inside Netlify functions)
// Never call this from the frontend — your META_WHATSAPP_TOKEN must stay secret

/**
 * Format an order into a clean WhatsApp message for Mama
 * @param {Object} order
 * @returns {string}
 */
export function formatOrderMessage(order) {
  const plateLines = order.plates
    .map(p => `  • ${p.name} — $${p.price}`)
    .join('\n')

  return (
    `🍛 *New Order — Obaa Yaa's Kitchen*\n\n` +
    `👤 *${order.customerName}*\n` +
    `📞 ${order.phone || 'No phone provided'}\n` +
    `🪖 ${order.branch} · ${order.battalion}\n\n` +
    `🍽 *Plates:*\n${plateLines}\n\n` +
    `💳 ${order.paymentMethod} · ✅ *Paid $${order.total}*\n\n` +
    `_Order ID: ${order.stripePaymentId}_`
  )
}

/**
 * Send a WhatsApp message to Mama via Meta Cloud API
 * @param {string} message
 * @param {Object} env - process.env equivalent
 * @returns {Promise}
 */
export async function sendWhatsAppMessage(message, env) {
  const url = `https://graph.facebook.com/v19.0/${env.META_PHONE_NUMBER_ID}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: env.MAMA_WHATSAPP_NUMBER,
      type: 'text',
      text: { body: message },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${errorText}`)
  }

  return res.json()
}
