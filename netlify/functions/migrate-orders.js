// ONE-TIME migration: groups legacy orders by (weekKey, orderType), creates a
// synthetic closed cycle for each group, and stamps each order with cycleId.
// Call this endpoint once via: POST /.netlify/functions/migrate-orders
// with header x-admin-pin: <your pin>
// Safe to re-run: orders that already have a cycleId are skipped.

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

// Mirrors the old weekUtils.js getWeekStart — Thursday-anchored week
function getWeekStart(date) {
  const d   = new Date(date)
  const day = d.getDay()
  const diff = day >= 4 ? day - 4 : day + 3
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekLabel(date) {
  const thursday = getWeekStart(date)
  return `Week of ${thursday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const auth = checkAdminPin(event.headers)
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  try {
    const db = await getDB()

    // Only migrate orders that don't yet have a cycleId
    const orders = await db.collection('orders')
      .find({ cycleId: { $exists: false } })
      .sort({ createdAt: 1 })
      .toArray()

    if (orders.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'No orders to migrate', cyclesCreated: 0, ordersStamped: 0 }),
      }
    }

    // Group by (weekKey, orderType)
    const groups = {}
    orders.forEach(order => {
      const created = order.createdAt ? new Date(order.createdAt) : new Date()
      if (isNaN(created.getTime())) return
      const thursday = getWeekStart(created)
      const weekKey  = thursday.toISOString().slice(0, 10)
      const type     = order.orderType || 'plate'
      const key      = `${weekKey}__${type}`
      if (!groups[key]) {
        groups[key] = { weekKey, thursday, type, orders: [] }
      }
      groups[key].orders.push(order)
    })

    let cyclesCreated = 0
    let ordersStamped = 0

    for (const [, group] of Object.entries(groups)) {
      const { thursday, type, orders: groupOrders } = group

      // Infer delivery date from group type
      const deliveryDate = new Date(thursday)
      if (type === 'tray') {
        deliveryDate.setDate(thursday.getDate() + 6) // Wednesday = Thu + 6
      } else {
        deliveryDate.setDate(thursday.getDate() + 2) // Saturday  = Thu + 2
      }

      const openedAt = groupOrders.reduce((earliest, o) => {
        const d = new Date(o.createdAt)
        return d < earliest ? d : earliest
      }, new Date(groupOrders[0].createdAt))

      const closedAt = groupOrders.reduce((latest, o) => {
        const d = new Date(o.createdAt)
        return d > latest ? d : latest
      }, new Date(groupOrders[0].createdAt))

      const label = type === 'plate'
        ? `Saturday Plates — ${weekLabel(thursday)} (migrated)`
        : `Wednesday Trays — ${weekLabel(thursday)} (migrated)`

      const cycle = {
        type,
        status:       'closed',
        label,
        openedAt,
        closedAt,
        cutoffAt:     null,
        deliveryDate,
      }

      const result = await db.collection('cycles').insertOne(cycle)
      const cycleId    = result.insertedId
      const cycleLabel = label
      cyclesCreated++

      // Stamp each order in this group
      const orderIds = groupOrders.map(o => o._id)
      await db.collection('orders').updateMany(
        { _id: { $in: orderIds } },
        { $set: { cycleId, cycleLabel } }
      )
      ordersStamped += orderIds.length
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, cyclesCreated, ordersStamped }),
    }
  } catch (err) {
    console.error('migrate-orders error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
