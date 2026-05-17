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

  const { type, label, cutoffAt, deliveryDate } = body
  if (!['plate', 'tray'].includes(type)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid cycle type' }) }
  }

  try {
    const db = await getDB()

    const existing = await db.collection('cycles').findOne({ status: 'open' })
    if (existing) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Another cycle is already open', cycleId: existing._id.toString() }),
      }
    }

    const now          = new Date()
    const defaultLabel = type === 'plate'
      ? `Saturday Plates — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : `Wednesday Trays — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

    const cycle = {
      type,
      status:       'open',
      label:        label || defaultLabel,
      openedAt:     now,
      closedAt:     null,
      cutoffAt:     cutoffAt    ? new Date(cutoffAt)    : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    }

    const result = await db.collection('cycles').insertOne(cycle)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        cycleId: result.insertedId.toString(),
        cycle:   { ...cycle, _id: result.insertedId.toString() },
      }),
    }
  } catch (err) {
    console.error('open-cycle error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to open cycle' }) }
  }
}
