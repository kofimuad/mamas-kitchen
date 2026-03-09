// netlify/functions/get-orders.js
// Called by the Admin Dashboard to fetch all orders from MongoDB

const mongoose = require('mongoose')

let isConnected = false

async function connectDB() {
  if (isConnected) return
  await mongoose.connect(process.env.MONGODB_URI)
  isConnected = true
}

const orderSchema = new mongoose.Schema({
  stripePaymentId: String,
  customerName:    String,
  phone:           String,
  branch:          String,
  battalion:       String,
  plates:          Array,
  total:           Number,
  paymentMethod:   String,
  paymentStatus:   String,
  status:          String,
  createdAt:       Date,
})

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Basic auth check — add proper auth before going live
  // TODO: replace with a real admin authentication layer
  const authHeader = event.headers['authorization']
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  try {
    await connectDB()

    const orders = await Order
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    }
  } catch (err) {
    console.error('get-orders error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
