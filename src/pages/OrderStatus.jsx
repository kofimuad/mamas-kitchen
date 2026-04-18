import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'

const STATUS_CONFIG = {
  pending_payment: {
    label:    'Awaiting Payment',
    sublabel: 'Send your payment via Zelle or Cash App to confirm your order.',
    color:    '#ED7D2B',
    bg:       'rgba(237,125,43,0.08)',
    border:   'rgba(237,125,43,0.3)',
  },
  confirmed: {
    label:    'Order Confirmed',
    sublabel: 'Obaa Yaa has received your payment and confirmed your order.',
    color:    '#22a85a',
    bg:       'rgba(34,168,90,0.07)',
    border:   'rgba(34,168,90,0.25)',
  },
  delivered: {
    label:    'Delivered',
    sublabel: 'Your order has been delivered. Enjoy your meal!',
    color:    '#D12918',
    bg:       'rgba(209,41,24,0.06)',
    border:   'rgba(209,41,24,0.2)',
  },
}

export default function OrderStatus() {
  const { id }       = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const justOrdered  = location.state?.justOrdered
  const [order,      setOrder]  = useState(null)
  const [loading,    setLoading] = useState(true)
  const [error,      setError]  = useState(null)
  const [copied,     setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(apiUrl(`get-order?id=${id}`))
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setOrder(data)
      })
      .catch(() => setError('Could not load order'))
      .finally(() => setLoading(false))
  }, [id])

  // Poll every 30 seconds for status updates
  useEffect(() => {
    if (!id) return
    const interval = setInterval(() => {
      fetch(apiUrl(`get-order?id=${id}`))
        .then(r => r.json())
        .then(data => { if (!data.error) setOrder(data) })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [id])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const status = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment) : null

  return (
    <div className="page-wrap" style={{ maxWidth: 520, textAlign: 'center' }}>

      {loading && (
        <div style={{ padding: '60px 0', color: '#6B8F3A' }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(209,41,24,0.2)', borderTopColor: '#D12918', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'Nunito', sans-serif" }}>Loading your order...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '40px 0' }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#c0392b', marginBottom: 20 }}>{error}</p>
          <button onClick={() => navigate('/')} style={{ background: '#D12918', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Go Home</button>
        </div>
      )}

      {order && status && (
        <>
          {justOrdered && (
            <div style={{
              background: 'rgba(34,168,90,0.08)', border: '1px solid rgba(34,168,90,0.25)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 28, textAlign: 'left',
            }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#1a6631', margin: 0, lineHeight: 1.6 }}>
                ✓ Your order has been placed! Obaa Yaa has been notified on WhatsApp.
                Bookmark this page to check your order status.
              </p>
            </div>
          )}

          {/* Status badge */}
          <div style={{
            display: 'inline-block',
            background: status.bg, border: `1.5px solid ${status.border}`,
            borderRadius: 99, padding: '8px 20px', marginBottom: 24,
          }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: status.color, letterSpacing: '0.04em' }}>
              {status.label}
            </span>
          </div>

          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 30, color: '#3A5A14', marginBottom: 10, fontWeight: 700 }}>
            {order.status === 'confirmed' ? 'Order Confirmed!' : order.status === 'delivered' ? 'Delivered!' : 'Order Received'}
          </h1>

          <div style={{ width: 40, height: 1.5, background: '#D12918', margin: '0 auto 16px' }} />

          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#456D1B', lineHeight: 1.8, marginBottom: 28 }}>
            {status.sublabel}
          </p>

          {/* Payment instructions — only show if pending */}
          {order.status === 'pending_payment' && (
            <div style={{
              background: 'rgba(237,125,43,0.08)', border: '1px solid rgba(237,125,43,0.35)',
              borderRadius: 14, padding: '18px 20px', marginBottom: 24, textAlign: 'left',
            }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#456D1B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Next Step — Send Payment
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', lineHeight: 1.7, margin: '0 0 14px' }}>
                Send <strong style={{ color: '#D12918' }}>${order.total}</strong> to Obaa Yaa via Zelle or Cash App.
                Once she receives it, she will confirm your order and this page will update automatically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: '#456D1B', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 56 }}>Zelle</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', fontWeight: 600 }}>706-577-3297 · Mayfred Mensah</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: '#456D1B', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 56 }}>Cash App</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', fontWeight: 600 }}>$mayfredmensah</span>
                </div>
              </div>
            </div>
          )}

          {/* Order details */}
          <div style={{ background: '#fff', border: '1px solid rgba(209,41,24,0.12)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(209,41,24,0.08)' }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Details</div>
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 16px', borderBottom: '1px solid rgba(209,41,24,0.06)',
                fontFamily: "'Nunito', sans-serif",
              }}>
                <span style={{ fontSize: 14, color: '#3A5A14' }}>{item.name}{item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#D12918' }}>${item.price * item.qty}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderTop: '2px solid rgba(209,41,24,0.10)' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3A5A14' }}>Total</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, fontWeight: 700, color: '#D12918' }}>${order.total}</span>
            </div>
          </div>

          {/* Order ID + copy link */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#6B8F3A', marginBottom: 10 }}>
              Order #{id?.slice(-8).toUpperCase()} · Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <button onClick={copyLink} style={{
              background: 'transparent', border: '1.5px solid rgba(209,41,24,0.25)',
              borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 600, color: '#456D1B',
              transition: 'all 0.2s',
            }}>
              {copied ? '✓ Link Copied!' : 'Copy Status Page Link'}
            </button>
          </div>

          <button onClick={() => navigate('/')} style={{
            padding: '14px 36px', background: '#3A5A14', border: 'none', borderRadius: 4,
            color: '#fff', fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#D12918'}
            onMouseLeave={e => e.currentTarget.style.background = '#3A5A14'}
          >Back to Home</button>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
