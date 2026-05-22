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
    const db = await getDB()
    const leaderboard = await db.collection('orders').aggregate([
      { $match: { status: { $in: ['confirmed', 'delivered'] } } },
      {
        $group: {
          _id:        '$info.phone',
          name:       { $first: '$info.name' },
          phone:      { $first: '$info.phone' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrder:  { $max: '$createdAt' },
        },
      },
      { $sort: { orderCount: -1, totalSpent: -1 } },
      { $limit: 20 },
    ]).toArray()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaderboard }),
    }
  } catch (err) {
    console.error('get-insights error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
