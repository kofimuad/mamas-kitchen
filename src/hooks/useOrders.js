import { useState, useEffect } from 'react'
import { apiUrl } from '../lib/api'

export default function useOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(apiUrl('get-orders'))
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
      await fetch(apiUrl(`orders/${id}`), {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
    } catch (err) {
      console.error('Failed to update order status:', err)
    }
  }

  const stats = {
    total:    orders.length,
    newCount: orders.filter(o => o.status === 'new').length,
    revenue:  orders.filter(o => o.paymentStatus === 'paid')
                    .reduce((sum, o) => sum + (o.total || 0), 0),
    plates:   {},
  }
  orders.forEach(o => {
    (o.items || o.plates || []).forEach(p => {
      stats.plates[p.name] = (stats.plates[p.name] || 0) + 1
    })
  })

  return { orders, loading, error, updateStatus, stats }
}
