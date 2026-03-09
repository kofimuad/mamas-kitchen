// netlify/functions/get-menu-image.js
// Serves a base64-stored image from MongoDB by itemId

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
  const { id } = event.queryStringParameters || {}

  if (!id) {
    return { statusCode: 400, body: 'Missing id' }
  }

  try {
    const db = (await getClient()).db('mamas_kitchen')
    const doc = await db.collection('menu_images').findOne({ itemId: id })

    if (!doc) {
      return { statusCode: 404, body: 'Image not found' }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': doc.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
      body: doc.base64,
      isBase64Encoded: true,
    }
  } catch (err) {
    console.error('Image fetch error:', err)
    return { statusCode: 500, body: 'Server error' }
  }
}
