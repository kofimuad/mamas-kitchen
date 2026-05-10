const { MongoClient, ObjectId } = require('mongodb')
const { checkAdminPin } = require('./_auth')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  let body
  try { body = JSON.parse(event.body) }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) } }

  const { cycleId } = body
  if (!cycleId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing cycleId' }) }
  }

  try {
    const db = await getDB()
    await db.collection('cycles').updateOne(
      { _id: new ObjectId(cycleId) },
      { $set: { status: 'closed', closedAt: new Date() } }
    )
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
