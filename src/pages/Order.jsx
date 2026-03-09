import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { trayCategories, plateCategories, cutoffs } from '../data/menu'
import useMenu from '../hooks/useMenu'

const BRANCHES = ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force']

export default function Order() {
  const navigate = useNavigate()
  const { plateItems, trayItems } = useMenu()
  const location = useLocation()

  // Step 0 = pick order type, Step 1 = items, Step 2 = info, Step 3 = summary
  const [step,      setStep]      = useState(0)
  const [orderType, setOrderType] = useState(null) // 'plate' | 'tray'
  const [selected,  setSelected]  = useState([])   // array of item ids
  const [info,      setInfo]      = useState({ branch: '', name: '', phone: '', battalion: '' })

  const items   = orderType === 'tray' ? trayItems : plateItems
  const cutoff  = orderType ? cutoffs[orderType] : null
  const maxQty  = orderType === 'tray' ? 1 : 3

  // ── Item counts ──
  const counts = selected.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const total = selected.reduce((sum, id) => {
    const item = items.find(m => m.id === id)
    return sum + (item?.price ?? 0)
  }, 0)

  const add = (id) => {
    if (selected.length >= maxQty) return
    setSelected(s => [...s, id])
  }

  const remove = (id) => {
    const idx = selected.lastIndexOf(id)
    if (idx === -1) return
    setSelected(s => s.filter((_, i) => i !== idx))
  }

  // ── Navigation ──
  const next = () => {
    if (step === 1 && selected.length === 0) { alert('Please select at least one item.'); return }
    if (step === 2 && (!info.branch || !info.name || !info.battalion)) { alert('Please fill in all required fields.'); return }
    if (step === 3) {
      navigate('/payment', { state: { orderType, selected, info, total } })
      return
    }
    setStep(s => s + 1)
  }

  const back = () => {
    if (step === 0) return
    if (step === 1) { setOrderType(null); setSelected([]); setStep(0); return }
    setStep(s => s - 1)
  }

  // ── Step dot indicator ──
  const Dot = ({ n }) => (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: step > n ? '#1E0E04' : step === n ? '#D4541A' : '#FFF1E0',
      border: `2px solid ${step > n ? '#1E0E04' : step === n ? '#D4541A' : 'rgba(212,84,26,0.25)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
      color: step >= n ? '#fff' : '#B07040',
      transition: 'all 0.3s',
    }}>{step > n ? '✓' : n}</div>
  )

  const Line = ({ n }) => (
    <div style={{
      flex: 1, height: 2,
      background: step > n ? '#1E0E04' : 'rgba(212,84,26,0.15)',
      transition: 'background 0.3s',
    }} />
  )

  // ── Group items by category ──
  const categories = orderType === 'tray' ? trayCategories : plateCategories
  const grouped = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && i.available)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="page-wrap" style={{ maxWidth: 580 }}>

      {/* ── STEP 0: Order Type Selection ── */}
      {step === 0 && (
        <>
          <div className="page-eyebrow">Place an Order</div>
          <h1 className="page-title">What are you ordering?</h1>
          <div className="title-rule" />
          <p className="page-sub">We serve twice a week. Choose your order type to get started.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>

            {/* Plate card */}
            <div
              onClick={() => { setOrderType('plate'); setStep(1) }}
              style={{
                background: '#fff',
                border: `2px solid ${orderType === 'plate' ? '#D4541A' : 'rgba(212,84,26,0.18)'}`,
                borderRadius: 20, overflow: 'hidden',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(212,84,26,0.08)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(212,84,26,0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,84,26,0.08)' }}
            >
              <div style={{
                height: 140,
                backgroundImage: `linear-gradient(to right, rgba(212,84,26,0.88), rgba(240,128,48,0.75)),
                  url('https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=800&q=80')`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
              }}>
                <div style={{ fontSize: 42 }}>🍽️</div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
                    Plate Order
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>
                    Individual plates · Delivered Saturday
                  </div>
                </div>
              </div>
              <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#7A3A10', lineHeight: 1.6 }}>
                    Up to 3 plates per order. Order by <strong style={{ color: '#D4541A' }}>Thursday 8 PM</strong>.
                  </div>
                  <div style={{ fontSize: 12, color: '#B07040', marginTop: 4 }}>
                    Jollof · Fufu · Check Check · Red Red & more
                  </div>
                </div>
                <div style={{
                  background: '#D4541A', color: '#fff',
                  fontSize: 20, width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginLeft: 16,
                }}>→</div>
              </div>
            </div>

            {/* Tray card */}
            <div
              onClick={() => { setOrderType('tray'); setStep(1) }}
              style={{
                background: '#fff',
                border: `2px solid ${orderType === 'tray' ? '#D4541A' : 'rgba(212,84,26,0.18)'}`,
                borderRadius: 20, overflow: 'hidden',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(212,84,26,0.08)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(212,84,26,0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,84,26,0.08)' }}
            >
              <div style={{
                height: 140,
                backgroundImage: `linear-gradient(to right, rgba(30,14,4,0.88), rgba(122,58,16,0.75)),
                  url('https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80')`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
              }}>
                <div style={{ fontSize: 42 }}>🥘</div>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
                    Tray Order
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>
                    Large trays · Feeds a group · Delivered Wednesday
                  </div>
                </div>
              </div>
              <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#7A3A10', lineHeight: 1.6 }}>
                    Perfect for groups. Order by <strong style={{ color: '#D4541A' }}>Monday 8 PM</strong>.
                  </div>
                  <div style={{ fontSize: 12, color: '#B07040', marginTop: 4 }}>
                    Jollof Trays · Fried Rice Trays · Egusi · Chicken · Goat
                  </div>
                </div>
                <div style={{
                  background: '#1E0E04', color: '#fff',
                  fontSize: 20, width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginLeft: 16,
                }}>→</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Steps 1–3 header */}
      {step > 0 && (
        <>
          <div className="page-eyebrow">
            {orderType === 'tray' ? '🥘 Tray Order — Wednesday' : '🍽️ Plate Order — Saturday'}
          </div>
          <h1 className="page-title">Place Your Order</h1>
          <div className="title-rule" />

          {/* Cutoff notice */}
          <div className="notice" style={{ marginBottom: 24 }}>
            <div className="notice-icon">⏰</div>
            <div>
              <div className="notice-title">
                Cutoff: <span>{cutoff.day} {cutoff.time}</span> · Delivery: {cutoff.delivery}
              </div>
            </div>
          </div>

          {/* Step bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Dot n={1} /><Line n={1} />
            <Dot n={2} /><Line n={2} />
            <Dot n={3} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            {['Items', 'Your Info', 'Summary'].map((l, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 600,
                color: step === i + 1 ? '#D4541A' : '#B07040',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                width: 80,
                textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center',
              }}>{l}</span>
            ))}
          </div>
        </>
      )}

      {/* ── STEP 1: Item Selection ── */}
      {step === 1 && (
        <div>
          <h3 style={{ fontSize: 17, color: '#1E0E04', marginBottom: 4 }}>
            Choose your {orderType === 'tray' ? 'tray' : 'plates'}
          </h3>
          <p style={{ fontSize: 13, color: '#B07040', marginBottom: 22 }}>
            {orderType === 'tray'
              ? 'Select 1 tray per order.'
              : 'Select up to 3 plates. You can order the same item more than once.'}
          </p>

          {/* Grouped by category */}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#D4541A',
                textTransform: 'uppercase', letterSpacing: '0.10em',
                marginBottom: 12, paddingBottom: 6,
                borderBottom: '1.5px solid rgba(212,84,26,0.15)',
              }}>{cat}</div>

              {catItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 13, marginBottom: 10,
                  background: counts[item.id] ? 'rgba(212,84,26,0.03)' : '#fff',
                  border: `2px solid ${counts[item.id] ? '#D4541A' : 'rgba(212,84,26,0.15)'}`,
                  borderRadius: 14, transition: 'all 0.18s',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                    backgroundImage: `url('${item.image}')`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E0E04' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#B07040', marginTop: 2 }}>
                      {item.tags.slice(0, 2).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#D4541A', marginRight: 4 }}>
                    {item.price !== null ? `$${item.price}` : 'TBD'}
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => remove(item.id)} disabled={!counts[item.id]} style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: counts[item.id] ? '#D4541A' : 'rgba(212,84,26,0.12)',
                      color: counts[item.id] ? '#fff' : '#B07040',
                      fontSize: 16, fontWeight: 700, cursor: counts[item.id] ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1E0E04', minWidth: 14, textAlign: 'center' }}>
                      {counts[item.id] || 0}
                    </span>
                    <button onClick={() => add(item.id)} disabled={selected.length >= maxQty} style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: selected.length < maxQty ? '#D4541A' : 'rgba(212,84,26,0.12)',
                      color: selected.length < maxQty ? '#fff' : '#B07040',
                      fontSize: 16, fontWeight: 700, cursor: selected.length < maxQty ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {selected.length > 0 && (
            <div style={{
              background: 'rgba(212,84,26,0.05)',
              border: '1px solid rgba(212,84,26,0.20)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 4,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, color: '#7A3A10' }}>
                {selected.length}/{maxQty} {orderType === 'tray' ? 'tray' : 'plates'} selected
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#D4541A' }}>
                {total > 0 ? `$${total}` : 'TBD'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Personal Info ── */}
      {step === 2 && (
        <div>
          <h3 style={{ fontSize: 17, color: '#1E0E04', marginBottom: 20 }}>Your details</h3>
          <div className="field-group">
            <label className="field-label">Branch of Service *</label>
            <select className="field-select" value={info.branch} onChange={e => setInfo(i => ({ ...i, branch: e.target.value }))}>
              <option value="">Select branch...</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Name / WhatsApp Name *</label>
            <input className="field-input" type="text" placeholder="Your full name" value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Phone Number</label>
            <input className="field-input" type="tel" placeholder="+1 (555) 000-0000" value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Company &amp; Battalion *</label>
            <input className="field-input" type="text" placeholder="e.g. Delta 264" value={info.battalion} onChange={e => setInfo(i => ({ ...i, battalion: e.target.value }))} />
          </div>
        </div>
      )}

      {/* ── STEP 3: Summary ── */}
      {step === 3 && (
        <div>
          <h3 style={{ fontSize: 17, color: '#1E0E04', marginBottom: 20 }}>Review your order</h3>

          {/* Order type badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: orderType === 'tray' ? '#1E0E04' : '#D4541A',
            color: '#fff', fontSize: 12, fontWeight: 700,
            padding: '5px 14px', borderRadius: 99, marginBottom: 16,
          }}>
            {orderType === 'tray' ? '🥘 Tray Order · Wednesday' : '🍽️ Plate Order · Saturday'}
          </div>

          {/* Items */}
          <div style={{ background: '#fff', border: '1px solid rgba(212,84,26,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            {Object.entries(counts).map(([id, qty]) => {
              const item = items.find(m => m.id === id)
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid rgba(212,84,26,0.08)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    backgroundImage: `url('${item.image}')`, backgroundSize: 'cover',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0E04' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#B07040' }}>× {qty}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#D4541A' }}>
                    {item.price !== null ? `$${item.price * qty}` : 'TBD'}
                  </div>
                </div>
              )
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              borderTop: '2px solid rgba(212,84,26,0.12)',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1E0E04' }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#D4541A' }}>
                {total > 0 ? `$${total}` : 'TBD — price to be confirmed'}
              </span>
            </div>
          </div>

          {/* Delivery info */}
          <div style={{
            background: 'rgba(212,84,26,0.04)', border: '1px solid rgba(212,84,26,0.15)',
            borderRadius: 14, padding: 16, marginBottom: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#B07040', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Delivery Info</div>
            <div style={{ fontSize: 14, color: '#1E0E04', lineHeight: 2.0 }}>
              <div>👤 {info.name}</div>
              <div>🪖 {info.branch} · {info.battalion}</div>
              {info.phone && <div>📞 {info.phone}</div>}
              <div>📅 Delivery: <strong>{cutoff.delivery}</strong></div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#B07040', marginTop: 12, lineHeight: 1.6 }}>
            You'll be taken to a secure payment page. Your order is only confirmed after payment.
          </p>
        </div>
      )}

      {/* ── Nav buttons ── */}
      {step > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={back} style={{
            flex: 1, padding: 14,
            border: '1.5px solid rgba(212,84,26,0.25)', borderRadius: 12,
            background: 'transparent', color: '#1E0E04',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>← Back</button>
          <button onClick={next} style={{
            flex: 2, padding: 14,
            background: step === 3 ? '#1E0E04' : '#D4541A',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = step === 3 ? '#7A3A10' : '#F08030'}
            onMouseLeave={e => e.currentTarget.style.background = step === 3 ? '#1E0E04' : '#D4541A'}
          >
            {step === 1 ? 'Continue to Your Info →'
              : step === 2 ? 'Review Order →'
              : '🔒 Proceed to Payment'}
          </button>
        </div>
      )}
    </div>
  )
}
