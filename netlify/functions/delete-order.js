const { checkAdminPin } = require('./_auth')
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
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, body: 'Method Not Allowed' }

  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }

  try {
    const { orderId } = JSON.parse(event.body)
    if (!orderId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId' }) }

    const db = await getDB()
    await db.collection('orders').deleteOne({ _id: new ObjectId(orderId) })

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
