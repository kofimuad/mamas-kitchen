const { MongoClient } = require('mongodb')
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
  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  try {
    const db     = await getDB()
    const cycles = await db.collection('cycles').find({}).sort({ openedAt: -1 }).toArray()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycles: cycles.map(c => ({ ...c, _id: c._id.toString() })) }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
