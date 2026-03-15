import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useOrders from '../../hooks/useOrders'
import OrderCard from '../../components/OrderCard'
import { generateOrderLog } from '../../lib/generateOrderLog'

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, loading, error, updateStatus, stats } = useOrders()
  const [downloading, setDownloading] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Build top ordered items dynamically from real order data
  const itemCounts = {}
  orders.forEach(order => {
    (order.items || order.plates || []).forEach(p => {
      itemCounts[p.name] = (itemCounts[p.name] || 0) + 1
    })
  })
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 32,
      }}>
        <div>
          <div className="page-eyebrow">Kitchen Boss</div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Today's Orders</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginTop: 8 }}>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            background: '#D4541A', color: '#fff',
            fontSize: 12, fontWeight: 700,
            padding: '7px 16px', borderRadius: 99,
          }}>{today}</span>
          <button
            onClick={() => navigate('/admin/menu')}
            style={{
              fontFamily: "'Lato', sans-serif",
              background: '#1E0E04', color: '#fff',
              fontSize: 12, fontWeight: 700,
              padding: '7px 16px', borderRadius: 99, border: 'none',
              cursor: 'pointer',
            }}
          >Manage Menu</button>
          <button
            onClick={async () => {
              if (orders.length === 0) { alert('No orders to export.'); return }
              setDownloading(true)
              try { await generateOrderLog(orders) }
              catch (e) { alert('Failed to generate PDF: ' + e.message) }
              finally { setDownloading(false) }
            }}
            disabled={downloading || loading}
            style={{
              fontFamily: "'Lato', sans-serif",
              background: downloading ? 'rgba(212,84,26,0.4)' : 'rgba(212,84,26,0.1)',
              color: '#D4541A',
              fontSize: 12, fontWeight: 700,
              padding: '7px 16px', borderRadius: 99,
              border: '1.5px solid rgba(212,84,26,0.3)',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {downloading
              ? <><span style={{ width: 10, height: 10, border: '2px solid rgba(212,84,26,0.3)', borderTopColor: '#D4541A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
              : '↓ Download Order Log'}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${2 + topItems.length}, 1fr)`,
        gap: 12, marginBottom: 36,
      }}>
        {/* Always-shown stats */}
        {[
          { label: 'New Orders',   value: stats.newCount,      accent: true },
          { label: 'Total Revenue', value: `$${stats.revenue}`, accent: true },
          { label: 'Total Orders',  value: stats.total,         accent: false },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff',
            border: '1px solid rgba(212,84,26,0.12)',
            borderRadius: 16, padding: '20px 20px',
            boxShadow: '0 2px 8px rgba(212,84,26,0.05)',
          }}>
            <div style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: 10, fontWeight: 700, color: '#B07040',
              textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10,
            }}>{s.label}</div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 34, fontWeight: 700, lineHeight: 1,
              color: s.accent ? '#D4541A' : '#1E0E04',
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Top items this week (dynamic) ── */}
      {topItems.length > 0 && (
        <div style={{
          background: '#fff',
          border: '1px solid rgba(212,84,26,0.12)',
          borderRadius: 16, padding: '18px 20px',
          marginBottom: 32,
          boxShadow: '0 2px 8px rgba(212,84,26,0.05)',
        }}>
          <div style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 10, fontWeight: 700, color: '#B07040',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14,
          }}>Most Ordered This Week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topItems.map(([name, count]) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 14, color: '#1E0E04', fontWeight: 500,
                }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Mini bar */}
                  <div style={{
                    width: 80, height: 4, borderRadius: 99,
                    background: 'rgba(212,84,26,0.10)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: '#D4541A',
                      width: `${Math.min(100, (count / (topItems[0][1] || 1)) * 100)}%`,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: 13, fontWeight: 700, color: '#D4541A', minWidth: 24,
                    textAlign: 'right',
                  }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Orders list ── */}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, color: '#1E0E04', marginBottom: 16,
      }}>
        Orders {loading ? '' : `(${orders.length})`}
      </h2>

      {loading && (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          fontFamily: "'Lato', sans-serif",
          color: '#B07040', fontSize: 14,
        }}>Loading orders...</div>
      )}

      {error && (
        <div style={{
          padding: 16, background: '#fff3f3',
          border: '1px solid rgba(212,84,26,0.3)',
          borderRadius: 12,
          fontFamily: "'Lato', sans-serif",
          color: '#D4541A', fontSize: 14,
        }}>Error loading orders: {error}</div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0',
              fontFamily: "'Lato', sans-serif",
              color: '#B07040', fontSize: 15,
            }}>No orders yet this week.</div>
          ) : (
            orders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onAccept={id => updateStatus(id, 'cooking')}
                onDecline={id => updateStatus(id, 'declined')}
              />
            ))
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
