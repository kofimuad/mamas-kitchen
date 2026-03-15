// netlify/functions/confirm-order.js
// Admin confirms/approves an order
const { MongoClient, ObjectId } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  // Admin auth
  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  try {
    const { orderId, status } = JSON.parse(event.body)
    if (!orderId || !status) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) }

    const db = await getDB()
    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, confirmedAt: new Date(), updatedAt: new Date() } }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
