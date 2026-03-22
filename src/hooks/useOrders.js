import { useState, useEffect } from 'react'
import { apiUrl, adminHeaders } from '../lib/api'

export default function useOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(apiUrl('get-orders'), { headers: adminHeaders() })
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then(data => setOrders(data.orders || []))
      .catch(err => {
        console.warn('Orders API unavailable:', err.message)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))
    try {
      await fetch(apiUrl('orders/' + id), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body:    JSON.stringify({ status }),
      })
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order permanently? This cannot be undone.')) return
    setOrders(prev => prev.filter(o => o._id !== id))
    try {
      await fetch(apiUrl('delete-order'), {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body:    JSON.stringify({ orderId: id }),
      })
    } catch (err) {
      console.error('Failed to delete order:', err)
    }
  }

  const stats = {
    total:    orders.length,
    newCount: orders.filter(o => o.status === 'new' || o.status === 'pending_payment').length,
    revenue:  orders
      .filter(o => o.paymentStatus === 'paid' || o.status === 'confirmed' || o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    plates: {},
  }
  orders.forEach(o => {
    ;(o.items || o.plates || []).forEach(p => {
      stats.plates[p.name] = (stats.plates[p.name] || 0) + 1
    })
  })

  return { orders, loading, error, updateStatus, deleteOrder, stats }
}
