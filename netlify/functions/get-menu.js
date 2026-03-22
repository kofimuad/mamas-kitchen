// netlify/functions/get-menu.js
// Returns the current menu from MongoDB.
// If no menu has been saved yet, returns null so the frontend falls back to menu.js defaults.

const { MongoClient } = require('mongodb')

let client

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client
}

exports.handler = async () => {
  try {
    const db = (await getClient()).db('mamas_kitchen')
    const doc = await db.collection('menu_config').findOne({ _id: 'current' })

    if (!doc) {
      // No menu saved yet — tell frontend to use defaults
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exists: false }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exists: true,
        plateItems: doc.plateItems  || [],
        trayItems:  doc.trayItems   || [],
        updatedAt:  doc.updatedAt,
      }),
    }
  } catch (err) {
    console.error('get-menu error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
