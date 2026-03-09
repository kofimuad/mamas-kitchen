import { useNavigate } from 'react-router-dom'

const STATUS = {
  new:      { bg: '#FFF4EF', color: '#D4541A', border: '#D4541A', label: 'New' },
  cooking:  { bg: '#F0FBF4', color: '#1a7a3a', border: '#27ae60', label: 'Cooking' },
  ready:    { bg: '#FFFBF0', color: '#9a6e00', border: '#F5C842', label: 'Ready' },
  declined: { bg: '#FDF2F2', color: '#9b2c2c', border: '#e53e3e', label: 'Declined' },
}

export default function OrderCard({ order, onAccept, onDecline }) {
  const navigate = useNavigate()
  const s     = STATUS[order.status] || STATUS.new
  const isNew = order.status === 'new'

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(212,84,26,0.12)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(212,84,26,0.06)',
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
            fontFamily: "'Playfair Display', serif",
            fontSize: 17, fontWeight: 700, color: '#1E0E04', marginBottom: 3,
          }}>{order.customerName}</div>
          <div style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 12, color: '#B07040', letterSpacing: '0.02em',
          }}>
            {order.branch} &nbsp;·&nbsp; {order.battalion}
            {order.phone ? ` · ${order.phone}` : ''}
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          fontFamily: "'Lato', sans-serif",
          background: s.bg, color: s.color,
          border: `1px solid ${s.border}`,
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '4px 12px', borderRadius: 99, flexShrink: 0,
        }}>{s.label}</span>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(212,84,26,0.08)', margin: '0 20px' }} />

      {/* ── Order details ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          {/* Plates list */}
          <div style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 14, fontWeight: 600, color: '#1E0E04',
            marginBottom: 6, lineHeight: 1.5,
          }}>
            {order.plates.map((p, i) => (
              <span key={i}>
                {p.name}
                {i < order.plates.length - 1 && (
                  <span style={{ color: 'rgba(212,84,26,0.35)', margin: '0 6px' }}>—</span>
                )}
              </span>
            ))}
          </div>

          {/* Payment row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: 11, color: '#B07040',
            }}>{order.paymentMethod}</span>
            <span style={{
              display: 'inline-block',
              background: order.paymentStatus === 'paid' ? '#F0FBF4' : '#FFF4EF',
              color: order.paymentStatus === 'paid' ? '#1a7a3a' : '#D4541A',
              border: `1px solid ${order.paymentStatus === 'paid' ? '#27ae60' : '#D4541A'}`,
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 99,
              fontFamily: "'Lato', sans-serif",
            }}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Total */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26, fontWeight: 700, color: '#D4541A',
          flexShrink: 0,
        }}>${order.total}</div>
      </div>

      {/* ── Actions ── */}
      {isNew && (
        <>
          <div style={{ height: 1, background: 'rgba(212,84,26,0.08)', margin: '0 20px' }} />
          <div style={{ display: 'flex', gap: 10, padding: '14px 20px' }}>
            <button
              onClick={() => onDecline?.(order._id)}
              style={{
                flex: 1, padding: '11px 0',
                border: '1px solid rgba(212,84,26,0.20)',
                borderRadius: 10, background: 'transparent',
                fontFamily: "'Lato', sans-serif",
                color: '#7A3A10', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4541A'; e.currentTarget.style.color = '#D4541A' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,84,26,0.20)'; e.currentTarget.style.color = '#7A3A10' }}
            >Decline</button>
            <button
              onClick={() => onAccept?.(order._id)}
              style={{
                flex: 2, padding: '11px 0',
                background: '#1E0E04', border: 'none',
                borderRadius: 10, color: '#fff',
                fontFamily: "'Lato', sans-serif",
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.2s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#D4541A'}
              onMouseLeave={e => e.currentTarget.style.background = '#1E0E04'}
            >Accept &amp; Start Cooking</button>
          </div>
        </>
      )}

      {/* ── View detail ── */}
      <div style={{
        padding: isNew ? '0 20px 14px' : '10px 20px 14px',
        textAlign: 'right',
      }}>
        <button
          onClick={() => navigate(`/admin/${order._id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Lato', sans-serif",
            fontSize: 12, color: '#D4541A', fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >View full order →</button>
      </div>
    </div>
  )
}
