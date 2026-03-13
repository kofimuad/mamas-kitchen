// netlify/functions/get-order.js
// Fetches a single order by ID — used by order status page
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
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  const id = event.queryStringParameters?.id
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing order id' }) }

  try {
    const db    = await getDB()
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) })
    if (!order) return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) }

    // Only return safe fields to customer
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId:       order._id.toString(),
        status:        order.status,
        orderType:     order.orderType,
        items:         order.items,
        total:         order.total,
        customerName:  order.info?.name,
        createdAt:     order.createdAt,
        confirmedAt:   order.confirmedAt || null,
      }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
