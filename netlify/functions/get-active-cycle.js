const { MongoClient } = require('mongodb')

let client
async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client.db('mamas_kitchen')
}

exports.handler = async () => {
  try {
    const db    = await getDB()
    const cycle = await db.collection('cycles').findOne({ status: 'open' })
    if (!cycle) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true, cycle: { ...cycle, _id: cycle._id.toString() } }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
