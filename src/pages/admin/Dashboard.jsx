import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useOrders from '../../hooks/useOrders'
import OrderCard from '../../components/OrderCard'
import { generateOrderLog } from '../../lib/generateOrderLog'
import { groupOrdersByWeekAndType } from '../../lib/weekUtils'

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, loading, error, updateStatus, deleteOrder, stats } = useOrders()
  const [downloading, setDownloading] = useState(null) // stores group key being downloaded

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const itemCounts = {}
  orders.forEach(order => {
    (order.items || order.plates || []).forEach(p => {
      itemCounts[p.name] = (itemCounts[p.name] || 0) + 1
    })
  })
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 2)

  const groups = groupOrdersByWeekAndType(orders)

  const downloadGroup = async (group) => {
    setDownloading(group.weekKey + group.type)
    try {
      await generateOrderLog(group.orders, `${group.label} — ${group.weekLabel}`)
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div className="page-eyebrow">Kitchen Boss</div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Orders</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginTop: 8 }}>
          <span style={{
            fontFamily: "'Nunito', sans-serif", background: '#D12918', color: '#fff',
            fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 99,
          }}>{today}</span>
          <button onClick={() => navigate('/admin/menu')} style={{
            fontFamily: "'Nunito', sans-serif", background: '#3A5A14', color: '#fff',
            fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 99,
            border: 'none', cursor: 'pointer',
          }}>Manage Menu</button>
          <button
            onClick={async () => {
              if (orders.length === 0) { alert('No orders to export.'); return }
              setDownloading('all')
              try { await generateOrderLog(orders, 'All Orders') }
              catch (e) { alert('Failed to generate PDF: ' + e.message) }
              finally { setDownloading(null) }
            }}
            disabled={!!downloading || loading}
            style={{
              fontFamily: "'Nunito', sans-serif",
              background: downloading === 'all' ? 'rgba(209,41,24,0.4)' : 'rgba(209,41,24,0.1)',
              color: '#D12918', fontSize: 12, fontWeight: 700,
              padding: '7px 16px', borderRadius: 99,
              border: '1.5px solid rgba(209,41,24,0.3)',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {downloading === 'all'
              ? <><span style={{ width: 10, height: 10, border: '2px solid rgba(209,41,24,0.3)', borderTopColor: '#D12918', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
              : '↓ Download All Orders'}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
        {[
          { label: 'Pending',       value: stats.newCount,      accent: true  },
          { label: 'Total Revenue', value: `$${stats.revenue}`, accent: true  },
          { label: 'Total Orders',  value: stats.total,         accent: false },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid rgba(209,41,24,0.12)',
            borderRadius: 16, padding: '20px 20px',
            boxShadow: '0 2px 8px rgba(209,41,24,0.05)',
          }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
              color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10,
            }}>{s.label}</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 34,
              lineHeight: 1, color: s.accent ? '#D12918' : '#3A5A14',
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Top items ── */}
      {topItems.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid rgba(209,41,24,0.12)',
          borderRadius: 16, padding: '18px 20px', marginBottom: 32,
          boxShadow: '0 2px 8px rgba(209,41,24,0.05)',
        }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
            color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14,
          }}>Most Ordered</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topItems.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', fontWeight: 500 }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, height: 4, borderRadius: 99, background: 'rgba(209,41,24,0.10)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: '#D12918', width: `${Math.min(100, (count / (topItems[0][1] || 1)) * 100)}%` }} />
                  </div>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: '#D12918', minWidth: 24, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: "'Nunito', sans-serif", color: '#6B8F3A', fontSize: 14 }}>
          Loading orders...
        </div>
      )}
      {error && (
        <div style={{ padding: 16, background: '#fff3f3', border: '1px solid rgba(209,41,24,0.3)', borderRadius: 12, fontFamily: "'Nunito', sans-serif", color: '#D12918', fontSize: 14 }}>
          Error loading orders: {error}
        </div>
      )}

      {/* ── Grouped orders ── */}
      {!loading && !error && (
        <>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: "'Nunito', sans-serif", color: '#6B8F3A', fontSize: 15 }}>
              No orders yet.
            </div>
          ) : (
            groups.map(group => {
              const groupKey = group.weekKey + group.type
              const isPlate  = group.type === 'plate'
              const revenue  = group.orders
                .filter(o => o.status === 'confirmed' || o.status === 'delivered' || o.paymentStatus === 'paid')
                .reduce((sum, o) => sum + (o.total || 0), 0)

              return (
                <div key={groupKey} style={{ marginBottom: 40 }}>

                  {/* Group header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14, paddingBottom: 12,
                    borderBottom: `2px solid ${isPlate ? '#D12918' : '#3A5A14'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Colour pill */}
                      <div style={{
                        background: isPlate ? '#D12918' : '#3A5A14',
                        color: '#fff', borderRadius: 99,
                        padding: '4px 12px',
                        fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {isPlate ? '🍽 Saturday Plates' : '🥘 Wednesday Trays'}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18, color: '#3A5A14' }}>
                          {group.weekLabel}
                        </div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#6B8F3A', marginTop: 1 }}>
                          {group.deliveryDate && !isNaN(group.deliveryDate)
                            ? `Delivery: ${group.deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · `
                            : ''}
                          {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
                          {revenue > 0 && <>&nbsp;·&nbsp;<strong style={{ color: '#D12918' }}>${revenue}</strong></>}
                        </div>
                      </div>
                    </div>

                    {/* Per-group download */}
                    <button
                      onClick={() => downloadGroup(group)}
                      disabled={!!downloading}
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        background: downloading === groupKey ? 'rgba(58,90,20,0.4)' : 'rgba(58,90,20,0.08)',
                        color: '#3A5A14', fontSize: 11, fontWeight: 700,
                        padding: '6px 14px', borderRadius: 99,
                        border: '1.5px solid rgba(58,90,20,0.25)',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      }}
                    >
                      {downloading === groupKey
                        ? <><span style={{ width: 9, height: 9, border: '2px solid rgba(58,90,20,0.3)', borderTopColor: '#3A5A14', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
                        : '↓ Download'}
                    </button>
                  </div>

                  {/* Orders in group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {group.orders.map(order => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        onAccept={id => updateStatus(id, 'cooking')}
                        onDecline={id => updateStatus(id, 'declined')}
                        onDelete={deleteOrder}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
