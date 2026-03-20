// netlify/functions/save-menu.js
// Saves the full menu (plateItems + trayItems) to MongoDB.
// Called by the admin MenuEditor when Mama hits "Save Menu Changes".

const { checkAdminPin } = require('./_auth')
const { MongoClient } = require('mongodb')

let client

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
  }
  return client
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Admin auth check
  const auth = event.headers['x-admin-pin']
  if (auth !== process.env.ADMIN_PIN) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  try {
    const { plateItems, trayItems } = JSON.parse(event.body)

    if (!plateItems || !trayItems) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing plateItems or trayItems' }) }
    }

    const db = (await getClient()).db('mamas_kitchen')

    await db.collection('menu_config').updateOne(
      { _id: 'current' },
      {
        $set: {
          _id: 'current',
          plateItems,
          trayItems,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, savedAt: new Date().toISOString() }),
    }
  } catch (err) {
    console.error('save-menu error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
