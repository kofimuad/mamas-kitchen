import { useNavigate } from 'react-router-dom'

export default function FoodCard({ item, compact = false }) {
  const navigate = useNavigate()

  // Pass the item id and type so Order page can pre-select it
  const goToOrder = () => navigate('/order', { state: { preselect: { id: item.id, type: item.type || 'plate' } } })

  // ── COMPACT — horizontal row for Menu page ──
  if (compact) return (
    <div
      onClick={goToOrder}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#fff', borderRadius: 14,
        border: '1px solid rgba(212,84,26,0.12)',
        padding: '12px 14px', cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        boxShadow: '0 2px 8px rgba(212,84,26,0.05)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,84,26,0.13)'; e.currentTarget.style.borderColor = 'rgba(212,84,26,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(212,84,26,0.05)'; e.currentTarget.style.borderColor = 'rgba(212,84,26,0.12)' }}
    >
      <div style={{
        width: 62, height: 62, borderRadius: 10, flexShrink: 0,
        backgroundImage: `url('${item.image}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700,
          color: '#1E0E04', marginBottom: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.name}</div>
        <div style={{
          fontFamily: "'Lato', sans-serif", fontSize: 12, color: '#B07040', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.description}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, fontWeight: 700, color: '#D4541A' }}>
          {item.price !== null ? `$${item.price}` : 'TBD'}
        </span>
        <span style={{
          fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700,
          color: '#D4541A', borderBottom: '1px solid rgba(212,84,26,0.35)', paddingBottom: 1,
        }}>Order →</span>
      </div>
    </div>
  )

  // ── FULL — tall card for Home page ──
  return (
    <div
      onClick={goToOrder}
      style={{
        background: '#fff', borderRadius: 18,
        border: '1px solid rgba(212,84,26,0.12)',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
        boxShadow: '0 2px 12px rgba(212,84,26,0.07)',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 32px rgba(212,84,26,0.16)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(212,84,26,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(212,84,26,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(212,84,26,0.12)' }}
    >
      <div style={{
        width: '100%', aspectRatio: '4 / 3',
        backgroundImage: `url('${item.image}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          background: '#D4541A', color: '#fff',
          fontFamily: "'Lato', sans-serif", fontSize: 15, fontWeight: 700,
          padding: '5px 13px', borderRadius: 99,
          boxShadow: '0 3px 10px rgba(212,84,26,0.4)',
        }}>{item.price !== null ? `$${item.price}` : 'TBD'}</div>
      </div>
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
          color: '#1E0E04', lineHeight: 1.3,
        }}>{item.name}</div>
        <p style={{
          fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#B07040',
          lineHeight: 1.6, flex: 1, margin: 0,
        }}>{item.description}</p>
        <div style={{
          fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700,
          color: '#D4541A', borderBottom: '1px solid rgba(212,84,26,0.35)',
          display: 'inline-block', paddingBottom: 1, marginTop: 4, alignSelf: 'flex-start',
        }}>Order →</div>
      </div>
    </div>
  )
}
