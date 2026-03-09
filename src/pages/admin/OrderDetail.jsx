import { useParams, useNavigate } from 'react-router-dom'
import useOrders from '../../hooks/useOrders'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, loading, updateStatus } = useOrders()

  const order = orders.find(o => o._id === id)

  if (loading) return (
    <div className="page-wrap" style={{ textAlign: 'center', color: '#B07040', paddingTop: 120 }}>
      Loading...
    </div>
  )

  if (!order) return (
    <div className="page-wrap" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontFamily: 'Georgia, serif', color: '#1E0E04', marginBottom: 8 }}>Order not found</h2>
      <button
        onClick={() => navigate('/admin')}
        style={{ background: 'none', border: 'none', color: '#D4541A', cursor: 'pointer', fontWeight: 700 }}
      >← Back to Dashboard</button>
    </div>
  )

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(order.createdAt)) / 60000)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  })()

  return (
    <div className="page-wrap" style={{ maxWidth: 620 }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: '#D4541A', marginBottom: 24,
        }}
      >← Back to Dashboard</button>

      <div className="page-eyebrow">Order Detail</div>
      <h1 className="page-title" style={{ marginBottom: 6 }}>{order.customerName}</h1>
      <p style={{ fontSize: 13, color: '#B07040', marginBottom: 28 }}>Placed {timeAgo}</p>

      {/* Order items */}
      <div style={{
        background: '#fff', border: '1px solid rgba(212,84,26,0.15)',
        borderRadius: 18, overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(212,84,26,0.10)', fontWeight: 700, fontSize: 12, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Plates Ordered
        </div>
        {order.plates.map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: i < order.plates.length - 1 ? '1px solid rgba(212,84,26,0.08)' : 'none',
          }}>
            <span style={{ fontSize: 14, color: '#1E0E04' }}>🍽 {p.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4541A' }}>${p.price}</span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px',
          borderTop: '2px solid rgba(212,84,26,0.12)',
          background: 'rgba(212,84,26,0.03)',
        }}>
          <span style={{ fontWeight: 700, color: '#1E0E04' }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#D4541A' }}>${order.total}</span>
        </div>
      </div>

      {/* Customer info */}
      <div style={{
        background: '#fff', border: '1px solid rgba(212,84,26,0.15)',
        borderRadius: 18, overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(212,84,26,0.10)', fontWeight: 700, fontSize: 12, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Customer Info
        </div>
        {[
          { label: 'Name',        value: order.customerName },
          { label: 'Branch',      value: order.branch },
          { label: 'Battalion',   value: order.battalion },
          { label: 'Phone',       value: order.phone },
          { label: 'Payment',     value: `${order.paymentMethod} · ${order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}` },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(212,84,26,0.08)',
          }}>
            <span style={{ fontSize: 12, color: '#B07040', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
            <span style={{ fontSize: 14, color: '#1E0E04', fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {order.status === 'new' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { updateStatus(order._id, 'declined'); navigate('/admin') }}
            style={{
              flex: 1, padding: 14,
              border: '1.5px solid rgba(212,84,26,0.25)', borderRadius: 12,
              background: 'transparent', color: '#1E0E04',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Decline Order</button>
          <button
            onClick={() => { updateStatus(order._id, 'cooking'); navigate('/admin') }}
            style={{
              flex: 2, padding: 14,
              background: '#D4541A', border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F08030'}
            onMouseLeave={e => e.currentTarget.style.background = '#D4541A'}
          >✓ Accept &amp; Start Cooking</button>
        </div>
      )}

      {order.status === 'cooking' && (
        <div style={{
          padding: 16, background: '#d1f5e0',
          border: '1px solid #a3e6c0',
          borderRadius: 12, textAlign: 'center',
          fontSize: 14, fontWeight: 700, color: '#1a7a3a',
        }}>
          🍳 Cooking in progress
        </div>
      )}
    </div>
  )
}
