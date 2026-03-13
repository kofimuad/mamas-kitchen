import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiUrl, adminHeaders } from '../../lib/api'

const STATUS_LABELS = {
  pending_payment: { label: 'Awaiting Payment', color: '#F5C842', bg: 'rgba(245,200,66,0.1)' },
  confirmed:       { label: 'Confirmed',         color: '#22a85a', bg: 'rgba(34,168,90,0.1)'  },
  delivered:       { label: 'Delivered',          color: '#D4541A', bg: 'rgba(212,84,26,0.1)'  },
}

export default function OrderDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  useEffect(() => {
    fetch(apiUrl(`get-order?id=${id}`))
      .then(r => r.json())
      .then(data => { if (!data.error) setOrder(data) })
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (newStatus) => {
    setSaving(true); setMsg(null)
    try {
      const res  = await fetch(apiUrl('confirm-order'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body:    JSON.stringify({ orderId: id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(o => ({ ...o, status: newStatus }))
      setMsg({ type: 'success', text: `Order marked as ${newStatus.replace('_', ' ')}` })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-wrap" style={{ textAlign: 'center', paddingTop: 60, color: '#B07040', fontFamily: "'Lato', sans-serif" }}>Loading...</div>
  if (!order)  return <div className="page-wrap" style={{ textAlign: 'center', paddingTop: 60, color: '#c0392b', fontFamily: "'Lato', sans-serif" }}>Order not found.</div>

  const statusCfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending_payment

  return (
    <div className="page-wrap" style={{ maxWidth: 560 }}>
      <button onClick={() => navigate('/admin')} style={{
        background: 'transparent', border: 'none', color: '#B07040',
        fontFamily: "'Lato', sans-serif", fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0,
      }}>← Back to Dashboard</button>

      <div className="page-eyebrow">Admin</div>
      <h1 className="page-title">Order Detail</h1>
      <div className="title-rule" />

      {/* Status badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: statusCfg.bg, border: `1.5px solid ${statusCfg.color}40`,
        borderRadius: 99, padding: '6px 16px', marginBottom: 24,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg.color }} />
        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, fontWeight: 700, color: statusCfg.color }}>
          {statusCfg.label}
        </span>
      </div>

      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(34,168,90,0.08)' : 'rgba(192,57,43,0.08)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(34,168,90,0.3)' : 'rgba(192,57,43,0.3)'}`,
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          fontFamily: "'Lato', sans-serif", fontSize: 13,
          color: msg.type === 'success' ? '#1a6631' : '#c0392b',
        }}>{msg.text}</div>
      )}

      {/* ── CONFIRM BUTTON — prominent when pending ── */}
      {order.status === 'pending_payment' && (
        <div style={{
          background: 'rgba(34,168,90,0.06)', border: '1.5px solid rgba(34,168,90,0.3)',
          borderRadius: 16, padding: 20, marginBottom: 24,
        }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: '#1E0E04', marginBottom: 16, lineHeight: 1.6 }}>
            Confirm you have received <strong style={{ color: '#D4541A' }}>${order.total}</strong> from{' '}
            <strong>{order.customerName}</strong> before approving.
          </div>
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={saving}
            style={{
              width: '100%', padding: '16px',
              background: saving ? 'rgba(34,168,90,0.4)' : '#22a85a',
              border: 'none', borderRadius: 10,
              color: '#fff', fontFamily: "'Lato', sans-serif",
              fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#1a8048' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#22a85a' }}
          >
            {saving ? 'Confirming...' : '✓ Confirm Order — Payment Received'}
          </button>
        </div>
      )}

      {order.status === 'confirmed' && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => updateStatus('delivered')}
            disabled={saving}
            style={{
              width: '100%', padding: '14px',
              background: saving ? 'rgba(212,84,26,0.4)' : '#D4541A',
              border: 'none', borderRadius: 10,
              color: '#fff', fontFamily: "'Lato', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Updating...' : 'Mark as Delivered'}
          </button>
        </div>
      )}

      {/* Customer info */}
      <div style={{ background: '#fff', border: '1px solid rgba(212,84,26,0.12)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Customer</div>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: '#1E0E04', lineHeight: 2 }}>
          <div><strong>{order.customerName}</strong></div>
          <div style={{ color: '#7A3A10' }}>Order #{id?.slice(-8).toUpperCase()}</div>
          <div style={{ color: '#7A3A10' }}>{new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: '#fff', border: '1px solid rgba(212,84,26,0.12)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,84,26,0.08)' }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {order.orderType === 'tray' ? 'Tray Order — Wednesday' : 'Plate Order — Saturday'}
          </div>
        </div>
        {order.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(212,84,26,0.06)', fontFamily: "'Lato', sans-serif" }}>
            <span style={{ fontSize: 14, color: '#1E0E04' }}>{item.name}{item.qty > 1 ? ` × ${item.qty}` : ''}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4541A' }}>${item.price * item.qty}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, fontWeight: 700 }}>Total</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#D4541A' }}>${order.total}</span>
        </div>
      </div>

      {/* Customer status page link */}
      <div style={{ background: 'rgba(212,84,26,0.04)', border: '1px solid rgba(212,84,26,0.12)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Customer Status Page</div>
        <a
          href={`/order-status/${id}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#D4541A', wordBreak: 'break-all' }}
        >
          {window.location.origin}/order-status/{id}
        </a>
      </div>
    </div>
  )
}
