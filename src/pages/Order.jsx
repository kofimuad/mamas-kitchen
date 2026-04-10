import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { trayCategories, plateCategories, cutoffs } from '../data/menu'
import useMenu from '../hooks/useMenu'
import { apiUrl } from '../lib/api'

const BRANCHES    = ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force']
const STORAGE_KEY = 'obaa_yaa_customer_info'

function loadSavedInfo() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null }
  catch { return null }
}

export default function Order() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const preselect = location.state?.preselect  // { id?, type }
  const { plateItems, trayItems } = useMenu()

  // If a specific item was passed in, go to step 1 with it pre-selected at qty 1
  // If only a type was passed (from menu CTA), go to step 1 with order type set
  const initialType = preselect?.type || null
  const initialStep = preselect?.type ? 1 : 0

  const [step,       setStep]       = useState(initialStep)
  const [orderType,  setOrderType]  = useState(initialType)
  const [selected,   setSelected]   = useState([])      // array of item ids (unlimited)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState(() => {
    const saved = loadSavedInfo()
    return saved || { branch: '', name: '', phone: '', battalion: '', paymentMethod: 'cashapp', paymentHandle: '' }
  })

  const items  = orderType === 'tray' ? trayItems : plateItems
  const cutoff = orderType ? cutoffs[orderType] : null

  // Pre-select the item once menu data has loaded
  // If item not found (e.g. removed from menu), still land on step 1
  useEffect(() => {
    if (!preselect?.id || items.length === 0) return
    const found = items.find(i => i.id === preselect.id)
    if (found) {
      setSelected([preselect.id])
    } else {
      // Item not in active menu — just stay on step 1 so user can pick from what's available
      setSelected([])
    }
  }, [preselect?.id, items.length])

  const counts = selected.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc }, {})
  const total  = selected.reduce((sum, id) => {
    const item = items.find(m => m.id === id)
    return sum + (item?.price ?? 0)
  }, 0)

  const add    = (id) => setSelected(s => [...s, id])
  const remove = (id) => {
    const idx = selected.lastIndexOf(id)
    if (idx !== -1) setSelected(s => s.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    if (info.name) localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  }, [info])

  const next = async () => {
    if (step === 1 && selected.length === 0) { alert('Please select at least one item.'); return }
    if (step === 2) {
      if (!info.branch || !info.name || !info.battalion) { alert('Please fill in all required fields.'); return }
      if (!info.paymentHandle) { alert('Please enter your Zelle or Cash App username.'); return }
      setStep(3); return
    }
    if (step === 3) {
      setSubmitting(true)
      try {
        const itemsPayload = Object.entries(counts).map(([id, qty]) => {
          const item = items.find(m => m.id === id)
          return { id, name: item?.name || id, price: item?.price || 0, qty }
        })
        const res  = await fetch(apiUrl('submit-order'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderType, items: itemsPayload, info, total }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to submit order')
        navigate(`/order-status/${data.orderId}`, { state: { justOrdered: true, info, total, orderType } })
      } catch (err) {
        alert('Something went wrong: ' + err.message)
        setSubmitting(false)
      }
      return
    }
    setStep(s => s + 1)
  }

  const back = () => {
    if (step === 1) { setOrderType(null); setSelected([]); setStep(0); return }
    if (step > 0) setStep(s => s - 1)
  }

  const Dot  = ({ n }) => (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: step > n ? '#3A5A14' : step === n ? '#D12918' : '#F5EDCC',
      border: `2px solid ${step > n ? '#3A5A14' : step === n ? '#D12918' : 'rgba(209,41,24,0.25)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: step >= n ? '#fff' : '#6B8F3A', transition: 'all 0.3s',
    }}>{step > n ? '✓' : n}</div>
  )
  const Line = ({ n }) => (
    <div style={{ flex: 1, height: 2, background: step > n ? '#3A5A14' : 'rgba(209,41,24,0.15)', transition: 'background 0.3s' }} />
  )

  const categories = orderType === 'tray' ? trayCategories : plateCategories
  const grouped    = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && i.available && i.price != null)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="page-wrap" style={{ maxWidth: 580 }}>

      {/* ── STEP 0: Order Type ── */}
      {step === 0 && (
        <>
          <div className="page-eyebrow">Place an Order</div>
          <h1 className="page-title">What are you ordering?</h1>
          <div className="title-rule" />
          <p className="page-sub">We serve twice a week. Choose your order type to get started.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {[
              { type: 'plate', label: 'Plate Order', sub: `Individual plates · Delivered ${cutoffs.plate.delivery}`, cutoffText: `Order by ${cutoffs.plate.day} ${cutoffs.plate.time}`, accent: '#D12918' },
              { type: 'tray',  label: 'Tray Order',  sub: `Large trays · Feeds a group · Delivered ${cutoffs.tray.delivery}`, cutoffText: `Order by ${cutoffs.tray.day} ${cutoffs.tray.time}`, accent: '#3A5A14' },
            ].map(({ type, label, sub, cutoffText, accent }) => (
              <div key={type}
                onClick={() => { setOrderType(type); setStep(1) }}
                style={{
                  background: '#fff', border: `2px solid rgba(209,41,24,0.18)`,
                  borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(209,41,24,0.08)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(209,41,24,0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(209,41,24,0.08)' }}
              >
                <div style={{ height: 100, background: accent, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
                  <div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, fontWeight: 'bold', color: '#fff' }}>{label}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.80)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#456D1B' }}>{cutoffText}</div>
                  <div style={{ background: accent, color: '#fff', fontSize: 18, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Steps 1–3 header */}
      {step > 0 && (
        <>
          <div className="page-eyebrow">{orderType === 'tray' ? 'Tray Order — Wednesday' : 'Plate Order — Saturday'}</div>
          <h1 className="page-title">Place Your Order</h1>
          <div className="title-rule" />
          <div className="notice" style={{ marginBottom: 24 }}>
            <div><div className="notice-title">Cutoff: <span>{cutoff.day} {cutoff.time}</span> · Delivery: {cutoff.delivery}</div></div>
          </div>

          {/* Step bar — only show for steps 1-3 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Dot n={1} /><Line n={1} /><Dot n={2} /><Line n={2} /><Dot n={3} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            {['Items', 'Your Info', 'Summary'].map((l, i) => (
              <span key={i} style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 600,
                color: step === i + 1 ? '#D12918' : '#6B8F3A',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                width: 80, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center',
              }}>{l}</span>
            ))}
          </div>
        </>
      )}

      {/* ── STEP 1: Items ── */}
      {step === 1 && (
        <div>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#3A5A14', marginBottom: 4 }}>
            Choose your {orderType === 'tray' ? 'trays' : 'plates'}
          </h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#6B8F3A', marginBottom: 22 }}>
            Add as many items as you'd like.
          </p>

          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#D12918',
                textTransform: 'uppercase', letterSpacing: '0.10em',
                marginBottom: 12, paddingBottom: 6, borderBottom: '1.5px solid rgba(209,41,24,0.15)',
              }}>{cat}</div>

              {catItems.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 13, marginBottom: 10,
                  background: counts[item.id] ? 'rgba(209,41,24,0.03)' : '#fff',
                  border: `2px solid ${counts[item.id] ? '#D12918' : 'rgba(209,41,24,0.15)'}`,
                  borderRadius: 14, transition: 'all 0.18s',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                    backgroundImage: `url('${item.image}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: '#3A5A14' }}>{item.name}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#6B8F3A', marginTop: 2 }}>{item.tags?.slice(0, 2).join(' · ')}</div>
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, fontWeight: 700, color: '#D12918', marginRight: 4 }}>
                    {item.price !== null ? `$${item.price}` : 'TBD'}
                  </div>
                  {/* Qty controls — no max limit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => remove(item.id)} disabled={!counts[item.id]} style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: counts[item.id] ? '#D12918' : 'rgba(209,41,24,0.12)',
                      color: counts[item.id] ? '#fff' : '#6B8F3A',
                      fontSize: 16, fontWeight: 700, cursor: counts[item.id] ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3A5A14', minWidth: 14, textAlign: 'center' }}>
                      {counts[item.id] || 0}
                    </span>
                    <button onClick={() => add(item.id)} style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      background: '#D12918', color: '#fff',
                      fontSize: 16, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {selected.length > 0 && (
            <div style={{
              background: 'rgba(209,41,24,0.05)', border: '1px solid rgba(209,41,24,0.20)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 4,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#456D1B' }}>
                {selected.length} item{selected.length !== 1 ? 's' : ''} selected
              </span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, fontWeight: 700, color: '#D12918' }}>
                {total > 0 ? `$${total}` : 'TBD'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Info + Payment ── */}
      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#3A5A14', marginBottom: 4 }}>Your details</h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#6B8F3A', marginBottom: 20 }}>
            {info.name ? `Welcome back, ${info.name.split(' ')[0]}! Your details have been filled in.` : 'Fill in your details below.'}
          </p>

          <div className="field-group">
            <label className="field-label">Branch of Service *</label>
            <select className="field-select" value={info.branch} onChange={e => setInfo(i => ({ ...i, branch: e.target.value }))}>
              <option value="">Select branch...</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Full Name *</label>
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

          <div style={{ marginTop: 28, marginBottom: 8 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              How will you pay?
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {['cashapp', 'zelle'].map(method => (
                <div key={method} onClick={() => setInfo(i => ({ ...i, paymentMethod: method }))} style={{
                  flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${info.paymentMethod === method ? '#D12918' : 'rgba(209,41,24,0.18)'}`,
                  background: info.paymentMethod === method ? 'rgba(209,41,24,0.04)' : '#fff',
                  transition: 'all 0.18s', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: '#3A5A14' }}>
                    {method === 'cashapp' ? 'Cash App' : 'Zelle'}
                  </div>
                </div>
              ))}
            </div>
            <div className="field-group">
              <label className="field-label">Your {info.paymentMethod === 'cashapp' ? 'Cash App' : 'Zelle'} name / username *</label>
              <input className="field-input" type="text"
                placeholder={info.paymentMethod === 'cashapp' ? '$yourcashtag' : 'Name or phone on Zelle'}
                value={info.paymentHandle}
                onChange={e => setInfo(i => ({ ...i, paymentHandle: e.target.value }))}
              />
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#6B8F3A', marginTop: 6, lineHeight: 1.5 }}>
                This must match the name you send the payment with so Obaa Yaa can confirm it's you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Summary ── */}
      {step === 3 && (
        <div>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#3A5A14', marginBottom: 20 }}>Review your order</h3>

          <div style={{ background: '#fff', border: '1px solid rgba(209,41,24,0.15)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            {Object.entries(counts).map(([id, qty]) => {
              const item = items.find(m => m.id === id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(209,41,24,0.08)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, backgroundImage: `url('${item?.image}')`, backgroundSize: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, color: '#3A5A14' }}>{item?.name}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#6B8F3A' }}>× {qty}</div>
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15, fontWeight: 700, color: '#D12918' }}>
                    {item?.price != null ? `$${item.price * qty}` : 'TBD'}
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '2px solid rgba(209,41,24,0.12)' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3A5A14' }}>Total</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, fontWeight: 700, color: '#D12918' }}>
                {total > 0 ? `$${total}` : 'TBD'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(209,41,24,0.04)', border: '1px solid rgba(209,41,24,0.12)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your Details</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', lineHeight: 2 }}>
              <div>{info.name}</div>
              <div>{info.branch} · {info.battalion}</div>
              {info.phone && <div>{info.phone}</div>}
            </div>
          </div>

          <div style={{ background: 'rgba(209,41,24,0.04)', border: '1px solid rgba(209,41,24,0.12)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Payment</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', lineHeight: 2 }}>
              <div>Method: <strong>{info.paymentMethod === 'cashapp' ? 'Cash App' : 'Zelle'}</strong></div>
              <div>Username: <strong>{info.paymentHandle}</strong></div>
            </div>
          </div>

          <div style={{ background: 'rgba(209,41,24,0.06)', border: '1px solid rgba(209,41,24,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#456D1B', lineHeight: 1.7, margin: 0 }}>
              After placing your order, Obaa Yaa will receive a notification.
              Send <strong>${total}</strong> via {info.paymentMethod === 'cashapp' ? 'Cash App' : 'Zelle'} to confirm.
              She will approve once payment is received.
            </p>
          </div>
        </div>
      )}

      {/* ── Nav Buttons ── */}
      {step > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={back} style={{
            flex: 1, padding: 14,
            border: '1.5px solid rgba(209,41,24,0.25)', borderRadius: 12,
            background: 'transparent', color: '#3A5A14',
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>← Back</button>
          <button onClick={next} disabled={submitting} style={{
            flex: 2, padding: 14,
            background: submitting ? 'rgba(209,41,24,0.4)' : step === 3 ? '#3A5A14' : '#D12918',
            border: 'none', borderRadius: 12, color: '#fff',
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = step === 3 ? '#456D1B' : '#ED7D2B' }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = step === 3 ? '#3A5A14' : '#D12918' }}
          >
            {submitting
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Placing Order...</>
              : step === 1 ? 'Continue to Your Info →'
              : step === 2 ? 'Review Order →'
              : 'Place Order'}
          </button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
