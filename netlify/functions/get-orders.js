const { checkAdminPin } = require('./_auth')
const { MongoClient } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  try {
    const db     = await getDB()
    const orders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    }
  } catch (err) {
    console.error('get-orders error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
