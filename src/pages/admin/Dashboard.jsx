import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useOrders from '../../hooks/useOrders'
import OrderCard from '../../components/OrderCard'
import { generateOrderLog } from '../../lib/generateOrderLog'
import { apiUrl, adminHeaders } from '../../lib/api'

// ── Cycle grouping ─────────────────────────────────────────
function groupOrdersByCycle(orders, cycles) {
  const cycleMap = {}
  cycles.forEach(c => { cycleMap[c._id] = c })

  const groups      = {}
  const uncategorized = []

  orders.forEach(order => {
    const cid = order.cycleId?.toString()
    if (cid) {
      if (!groups[cid]) {
        const cycle = cycleMap[cid] || {
          _id: cid, label: 'Unknown Cycle',
          type: order.orderType, status: 'closed', openedAt: order.createdAt,
        }
        groups[cid] = { cycleId: cid, cycle, orders: [] }
      }
      groups[cid].orders.push(order)
    } else {
      uncategorized.push(order)
    }
  })

  const sorted = Object.values(groups).sort((a, b) => {
    const aDate = new Date(a.cycle.openedAt || 0)
    const bDate = new Date(b.cycle.openedAt || 0)
    return bDate - aDate
  })

  if (uncategorized.length > 0) {
    sorted.push({ cycleId: null, cycle: null, orders: uncategorized })
  }
  return sorted
}

// ── Cycle control hook ─────────────────────────────────────
function useCycles() {
  const [activeCycle,  setActiveCycle]  = useState(undefined) // undefined = loading
  const [allCycles,    setAllCycles]    = useState([])
  const [cycleLoading, setCycleLoading] = useState(true)

  const refresh = useCallback(async () => {
    setCycleLoading(true)
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch(apiUrl('get-active-cycle')),
        fetch(apiUrl('get-cycles'), { headers: adminHeaders() }),
      ])
      const activeData = await activeRes.json()
      const allData    = await allRes.json()
      setActiveCycle(activeData.active ? activeData.cycle : null)
      setAllCycles(allData.cycles || [])
    } catch {
      setActiveCycle(null)
      setAllCycles([])
    } finally {
      setCycleLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const openCycle = async (type, label) => {
    const res  = await fetch(apiUrl('open-cycle'), {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ type, label }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to open cycle')
    await refresh()
    return data
  }

  const closeCycle = async (cycleId) => {
    const res  = await fetch(apiUrl('close-cycle'), {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ cycleId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to close cycle')
    await refresh()
  }

  const reopenCycle = async (cycleId) => {
    const res  = await fetch(apiUrl('reopen-cycle'), {
      method: 'POST', headers: adminHeaders(),
      body: JSON.stringify({ cycleId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to reopen cycle')
    await refresh()
  }

  return { activeCycle, allCycles, cycleLoading, openCycle, closeCycle, reopenCycle, refresh }
}

// ── Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, loading, error, updateStatus, deleteOrder, stats } = useOrders()
  const { activeCycle, allCycles, cycleLoading, openCycle, closeCycle, reopenCycle } = useCycles()
  const [downloading, setDownloading] = useState(null)
  const [cycleWorking, setCycleWorking] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const itemCounts = {}
  orders.forEach(order => {
    ;(order.items || order.plates || []).forEach(p => {
      itemCounts[p.name] = (itemCounts[p.name] || 0) + 1
    })
  })
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 2)

  const groups = groupOrdersByCycle(orders, allCycles)

  const downloadGroup = async (group) => {
    const key = group.cycleId || 'uncategorized'
    setDownloading(key)
    try {
      const label = group.cycle?.label || 'Uncategorized Orders'
      await generateOrderLog(group.orders, label)
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message)
    } finally {
      setDownloading(null)
    }
  }

  const handleOpenCycle = async (type) => {
    const defaultLabel = type === 'plate'
      ? `Saturday Plates — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : `Wednesday Trays — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    const label = window.prompt('Cycle label (leave blank for default):', defaultLabel)
    if (label === null) return // cancelled
    setCycleWorking(true)
    try {
      await openCycle(type, label.trim() || defaultLabel)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setCycleWorking(false)
    }
  }

  const handleDownloadActiveCycle = async () => {
    if (!activeCycle) return
    const cycleOrders = orders.filter(o => o.cycleId?.toString() === activeCycle._id)
    if (cycleOrders.length === 0) { alert('No orders in this cycle yet.'); return }
    setDownloading('active-cycle')
    try {
      await generateOrderLog(cycleOrders, activeCycle.label)
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message)
    } finally {
      setDownloading(null)
    }
  }

  const handleCloseCycle = async () => {
    if (!activeCycle) return
    if (!window.confirm(`Close "${activeCycle.label}"? Customers will no longer be able to place orders.`)) return
    setCycleWorking(true)
    try {
      await closeCycle(activeCycle._id)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setCycleWorking(false)
    }
  }

  const handleReopenCycle = async (cycleId) => {
    if (!window.confirm('Reopen this cycle? It will become the active ordering window.')) return
    setCycleWorking(true)
    try {
      await reopenCycle(cycleId)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setCycleWorking(false)
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

      {/* ── Cycle Control Card ── */}
      {!cycleLoading && (
        <div style={{
          background: '#fff',
          border: `2px solid ${activeCycle ? '#D12918' : 'rgba(209,41,24,0.18)'}`,
          borderRadius: 20, padding: '24px 28px', marginBottom: 32,
          boxShadow: activeCycle ? '0 4px 24px rgba(209,41,24,0.12)' : '0 2px 8px rgba(209,41,24,0.05)',
        }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
            color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14,
          }}>Order Window</div>

          {activeCycle ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{
                  background: activeCycle.type === 'plate' ? '#D12918' : '#3A5A14',
                  color: '#fff', borderRadius: 99, padding: '4px 12px',
                  fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {activeCycle.type === 'plate' ? '🍽 Saturday Plates' : '🥘 Wednesday Trays'}
                </div>
                <div style={{
                  background: '#3A5A14', color: '#fff', borderRadius: 99, padding: '4px 12px',
                  fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                }}>OPEN</div>
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20, color: '#3A5A14', marginBottom: 4 }}>
                {activeCycle.label}
              </div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#6B8F3A', marginBottom: 16 }}>
                Opened {new Date(activeCycle.openedAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {' · '}
                {orders.filter(o => o.cycleId?.toString() === activeCycle._id).length} order(s)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadActiveCycle}
                  disabled={!!downloading || cycleWorking}
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: downloading === 'active-cycle' ? 'rgba(58,90,20,0.4)' : 'rgba(58,90,20,0.10)',
                    color: '#3A5A14', fontSize: 12, fontWeight: 700,
                    padding: '10px 20px', borderRadius: 8,
                    border: '1.5px solid rgba(58,90,20,0.28)',
                    cursor: (!!downloading || cycleWorking) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {downloading === 'active-cycle'
                    ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(58,90,20,0.3)', borderTopColor: '#3A5A14', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
                    : '↓ Download Order Log'}
                </button>
                <button
                  onClick={handleCloseCycle}
                  disabled={cycleWorking || !!downloading}
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: cycleWorking ? 'rgba(209,41,24,0.4)' : '#D12918',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    cursor: (cycleWorking || !!downloading) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {cycleWorking
                    ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Closing...</>
                    : '✕ Close Cycle'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#6B8F3A', marginBottom: 18, marginTop: 0 }}>
                No cycle is open. Choose a delivery type to start accepting orders.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleOpenCycle('plate')}
                  disabled={cycleWorking}
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: '#D12918', color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    padding: '11px 20px', borderRadius: 8, border: 'none',
                    cursor: cycleWorking ? 'not-allowed' : 'pointer',
                  }}
                >Open Saturday Plate Cycle</button>
                <button
                  onClick={() => handleOpenCycle('tray')}
                  disabled={cycleWorking}
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: '#3A5A14', color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    padding: '11px 20px', borderRadius: 8, border: 'none',
                    cursor: cycleWorking ? 'not-allowed' : 'pointer',
                  }}
                >Open Wednesday Tray Cycle</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 }}>
        {[
          { label: 'Pending',       value: stats.newCount,      sub: 'Awaiting payment',   accent: '#D12918' },
          { label: 'Revenue',       value: `$${stats.revenue}`, sub: 'Confirmed payments', accent: '#3A5A14' },
          { label: 'Total Orders',  value: stats.total,         sub: 'All time',           accent: '#3A5A14' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid rgba(209,41,24,0.12)',
            borderRadius: 16, padding: '18px 18px',
            boxShadow: '0 2px 8px rgba(209,41,24,0.05)',
          }}>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
              color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8,
            }}>{s.label}</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 30,
              lineHeight: 1, color: s.accent, marginBottom: 6,
            }}>{s.value}</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 10,
              color: 'rgba(107,143,58,0.7)', letterSpacing: '0.02em',
            }}>{s.sub}</div>
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

      {/* ── Grouped orders by cycle ── */}
      {!loading && !error && (
        <>
          {groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: "'Nunito', sans-serif", color: '#6B8F3A', fontSize: 15 }}>
              No orders yet.
            </div>
          ) : (
            groups.map(group => {
              const groupKey = group.cycleId || 'uncategorized'
              const cycle    = group.cycle
              const isPlate  = cycle?.type === 'plate'
              const isOpen   = cycle?.status === 'open'
              const revenue  = group.orders
                .filter(o => o.status === 'confirmed' || o.status === 'delivered' || o.paymentStatus === 'paid')
                .reduce((sum, o) => sum + (o.total || 0), 0)

              return (
                <div key={groupKey} style={{ marginBottom: 40 }}>

                  {/* Group header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14, paddingBottom: 12,
                    borderBottom: `2px solid ${cycle ? (isPlate ? '#D12918' : '#3A5A14') : '#aaa'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {/* Type pill */}
                      <div style={{
                        background: cycle ? (isPlate ? '#D12918' : '#3A5A14') : '#888',
                        color: '#fff', borderRadius: 99, padding: '4px 12px',
                        fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {!cycle ? '📦 Uncategorized' : isPlate ? '🍽 Saturday Plates' : '🥘 Wednesday Trays'}
                      </div>

                      {/* Open/closed badge */}
                      {cycle && (
                        <div style={{
                          background: isOpen ? '#3A5A14' : 'rgba(107,143,58,0.15)',
                          color: isOpen ? '#fff' : '#456D1B',
                          borderRadius: 99, padding: '4px 10px',
                          fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {isOpen ? 'Open' : 'Closed'}
                        </div>
                      )}

                      {/* Label + meta */}
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18, color: '#3A5A14' }}>
                          {cycle?.label || 'Legacy Orders'}
                        </div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#6B8F3A', marginTop: 1 }}>
                          {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
                          {revenue > 0 && <>&nbsp;·&nbsp;<strong style={{ color: '#D12918' }}>${revenue}</strong></>}
                          {!isOpen && cycle?.closedAt && (
                            <>&nbsp;· Closed {new Date(cycle.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Per-group actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {/* Reopen button — only for closed cycles that aren't the active one */}
                      {cycle && !isOpen && (
                        <button
                          onClick={() => handleReopenCycle(cycle._id)}
                          disabled={cycleWorking || !!activeCycle}
                          title={activeCycle ? 'Close the current open cycle first' : 'Reopen this cycle'}
                          style={{
                            fontFamily: "'Nunito', sans-serif",
                            background: 'rgba(58,90,20,0.08)', color: '#3A5A14',
                            fontSize: 11, fontWeight: 700,
                            padding: '6px 12px', borderRadius: 99,
                            border: '1.5px solid rgba(58,90,20,0.25)',
                            cursor: (cycleWorking || !!activeCycle) ? 'not-allowed' : 'pointer',
                            opacity: (cycleWorking || !!activeCycle) ? 0.5 : 1,
                          }}
                        >Reopen</button>
                      )}

                      {/* Download */}
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
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        {downloading === groupKey
                          ? <><span style={{ width: 9, height: 9, border: '2px solid rgba(58,90,20,0.3)', borderTopColor: '#3A5A14', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
                          : '↓ Download'}
                      </button>
                    </div>
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
