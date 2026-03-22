import { useNavigate } from 'react-router-dom'

// Maps ALL possible order statuses to a display config
const STATUS = {
  // Legacy Stripe statuses
  new:             { bg: '#FFF0E8', color: '#D12918', border: '#D12918',  label: 'New'      },
  cooking:         { bg: '#F0FAF0', color: '#1a7a3a', border: '#27ae60',  label: 'Cooking'  },
  ready:           { bg: '#FFF8E8', color: '#9a6e00', border: '#ED7D2B',  label: 'Ready'    },
  declined:        { bg: '#FDF2F2', color: '#9b2c2c', border: '#e53e3e',  label: 'Declined' },
  // New Zelle/CashApp statuses
  pending_payment: { bg: '#FFF8E7', color: '#9a6e00', border: '#ED7D2B',  label: 'Pending'  },
  confirmed:       { bg: '#F0FAF0', color: '#1a7a3a', border: '#27ae60',  label: 'Confirmed'},
  delivered:       { bg: '#FFF0E8', color: '#D12918', border: '#D12918',  label: 'Delivered'},
}

const FALLBACK_STATUS = { bg: '#F5F5F5', color: '#888', border: '#ccc', label: 'Unknown' }

export default function OrderCard({ order, onAccept, onDecline, onDelete }) {
  const navigate = useNavigate()
  const s        = STATUS[order.status] || FALLBACK_STATUS
  const isNew    = order.status === 'new'

  // Support both old shape (order.plates, order.branch) and new shape (order.items, order.info.*)
  const items     = order.items || order.plates || []
  const branch    = order.info?.branch    || order.branch    || ''
  const battalion = order.info?.battalion || order.battalion || ''
  const phone     = order.info?.phone     || order.phone     || ''
  const payMethod = order.info?.paymentMethod || order.paymentMethod || ''

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(209,41,24,0.12)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(209,41,24,0.06)',
      opacity: order.status === 'declined' ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>

      {/* ── Header row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 14px',
      }}>
        <div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 17, fontWeight: 700, color: '#3A5A14', marginBottom: 3,
          }}>{order.customerName || order.info?.name || '—'}</div>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: '#6B8F3A', letterSpacing: '0.02em',
          }}>
            {branch}{battalion ? ` · ${battalion}` : ''}
            {phone ? ` · ${phone}` : ''}
          </div>
          {order.createdAt && (
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11, color: '#6B8F3A', marginTop: 3,
              opacity: 0.75,
            }}>
              {new Date(order.createdAt).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true,
              })}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          background: s.bg, color: s.color,
          border: `1px solid ${s.border}`,
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '4px 12px', borderRadius: 99, flexShrink: 0,
        }}>{s.label}</span>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(209,41,24,0.08)', margin: '0 20px' }} />

      {/* ── Order details ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          {/* Items list */}
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 14, fontWeight: 600, color: '#3A5A14',
            marginBottom: 6, lineHeight: 1.5,
          }}>
            {items.length > 0
              ? items.map((p, i) => (
                  <span key={i}>
                    {p.name}{p.qty > 1 ? ` ×${p.qty}` : ''}
                    {i < items.length - 1 && (
                      <span style={{ color: 'rgba(209,41,24,0.35)', margin: '0 6px' }}>—</span>
                    )}
                  </span>
                ))
              : <span style={{ color: '#6B8F3A', fontWeight: 400 }}>No items</span>
            }
          </div>

          {/* Payment badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {payMethod && (
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 11, color: '#6B8F3A', textTransform: 'capitalize',
              }}>{payMethod === 'cashapp' ? 'Cash App' : payMethod}</span>
            )}
            <span style={{
              display: 'inline-block',
              background: order.status === 'confirmed' || order.status === 'delivered' ? '#F0FAF0' : '#FFF0E8',
              color:      order.status === 'confirmed' || order.status === 'delivered' ? '#1a7a3a' : '#D12918',
              border: `1px solid ${order.status === 'confirmed' || order.status === 'delivered' ? '#27ae60' : '#D12918'}`,
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 99,
              fontFamily: "'Nunito', sans-serif",
            }}>
              {order.status === 'confirmed' || order.status === 'delivered' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Total */}
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 900,
          fontSize: 26, fontWeight: 700, color: '#D12918',
          flexShrink: 0,
        }}>${order.total}</div>
      </div>

      {/* ── Legacy accept/decline actions (old Stripe orders) ── */}
      {isNew && (
        <>
          <div style={{ height: 1, background: 'rgba(209,41,24,0.08)', margin: '0 20px' }} />
          <div style={{ display: 'flex', gap: 10, padding: '14px 20px' }}>
            <button
              onClick={() => onDecline?.(order._id)}
              style={{
                flex: 1, padding: '11px 0',
                border: '1px solid rgba(209,41,24,0.20)',
                borderRadius: 10, background: 'transparent',
                fontFamily: "'Nunito', sans-serif",
                color: '#456D1B', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#D12918'; e.currentTarget.style.color = '#D12918' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(209,41,24,0.20)'; e.currentTarget.style.color = '#456D1B' }}
            >Decline</button>
            <button
              onClick={() => onAccept?.(order._id)}
              style={{
                flex: 2, padding: '11px 0',
                background: '#3A5A14', border: 'none',
                borderRadius: 10, color: '#fff',
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.2s', letterSpacing: '0.02em',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#D12918'}
              onMouseLeave={e => e.currentTarget.style.background = '#3A5A14'}
            >Accept &amp; Start Cooking</button>
          </div>
        </>
      )}

      {/* ── View detail + Delete ── */}
      <div style={{ padding: isNew ? '0 20px 14px' : '10px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => onDelete?.(order._id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: 'rgba(192,50,40,0.55)', fontWeight: 600,
            letterSpacing: '0.02em', padding: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#C03228'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(192,50,40,0.55)'}
        >🗑 Delete</button>
        <button
          onClick={() => navigate(`/admin/orders/${order._id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: '#D12918', fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >View full order →</button>
      </div>
    </div>
  )
}
