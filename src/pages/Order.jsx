import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { trayCategories, plateCategories } from '../data/menu'
import useMenu from '../hooks/useMenu'
import useActiveCycle from '../hooks/useActiveCycle'
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
  const { plateItems, trayItems, addOns } = useMenu()
  const { cycle, loading: cycleLoading } = useActiveCycle()

  // When a cycle is open, skip step 0 and lock the type to the cycle's type.
  // preselect.type (from Menu CTA) still lands on step 1 as before.
  const initialType = preselect?.type || null
  const initialStep = preselect?.type ? 1 : 0

  const [step,         setStep]         = useState(initialStep)
  const [orderType,    setOrderType]    = useState(initialType)
  const [selected,     setSelected]     = useState([])      // array of item ids (unlimited)
  const [addOnCounts,  setAddOnCounts]  = useState({})      // { [addOnId]: qty }
  const [submitting,   setSubmitting]   = useState(false)
  const [showCustomUnit, setShowCustomUnit] = useState(() => {
    const saved = loadSavedInfo()
    return !!(saved?.armyUnit && !['264', '233'].includes(saved.armyUnit))
  })
  const [info, setInfo] = useState(() => {
    const saved = loadSavedInfo()
    return saved
      ? { armyCompany: '', armyUnit: '', ...saved }
      : { branch: '', name: '', phone: '', battalion: '', armyCompany: '', armyUnit: '', paymentMethod: 'cashapp', paymentHandle: '' }
  })

  // When cycle loads and step 0 is still showing, jump straight to step 1 locked to cycle type
  useEffect(() => {
    if (cycleLoading || !cycle) return
    if (step === 0) {
      setOrderType(cycle.type)
      setStep(1)
    }
  }, [cycleLoading, cycle])

  const items = orderType === 'tray' ? trayItems : plateItems

  // Build cutoff / delivery text from cycle data when available
  const cutoffText = cycle?.cutoffAt
    ? new Date(cycle.cutoffAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : orderType === 'tray' ? 'Monday 8 PM' : 'Friday 6 PM'
  const deliveryText = cycle?.deliveryDate
    ? new Date(cycle.deliveryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : orderType === 'tray' ? 'Wednesday' : 'Saturday'

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

  // Add-ons relevant to this order (available, correct type, trigger matches)
  const relevantAddOns = (addOns || []).filter(a =>
    a.available &&
    (a.orderTypes || ['plate', 'tray']).includes(orderType) &&
    (!a.triggerItems?.length || a.triggerItems.some(tid => counts[tid] > 0))
  )

  const addOnTotal = Object.entries(addOnCounts).reduce((sum, [id, qty]) => {
    const addOn = relevantAddOns.find(a => a.id === id)
    return sum + (addOn ? addOn.price * qty : 0)
  }, 0)

  const grandTotal  = total + addOnTotal
  const hasAddOns   = relevantAddOns.length > 0
  const summaryStep = 4

  const add    = (id) => setSelected(s => [...s, id])
  const remove = (id) => {
    const idx = selected.lastIndexOf(id)
    if (idx !== -1) setSelected(s => s.filter((_, i) => i !== idx))
  }
  const addAddOn    = (id) => setAddOnCounts(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeAddOn = (id) => setAddOnCounts(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }))

  useEffect(() => {
    if (info.name) localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  }, [info])

  const next = async () => {
    if (step === 1 && selected.length === 0) { alert('Please select at least one item.'); return }
    if (step === 2) {
      if (!info.branch || !info.name) { alert('Please fill in all required fields.'); return }
      if (info.branch === 'Army') {
        if (!info.armyCompany) { alert('Please select your company (Alpha, Beta, Charlie, Delta, or Echo).'); return }
        if (!info.armyUnit) { alert('Please select or enter your unit number.'); return }
      } else {
        if (!info.battalion) { alert('Please fill in your company & battalion.'); return }
      }
      if (!info.paymentHandle) { alert('Please enter your Zelle or Cash App username.'); return }
      setStep(hasAddOns ? 3 : 4); return
    }
    if (step === 3 && hasAddOns) { setStep(4); return }
    if (step === summaryStep) {
      setSubmitting(true)
      try {
        const itemsPayload = Object.entries(counts).map(([id, qty]) => {
          const item = items.find(m => m.id === id)
          return { id, name: item?.name || id, price: item?.price || 0, qty }
        })
        const addOnsPayload = Object.entries(addOnCounts)
          .filter(([id, qty]) => qty > 0 && relevantAddOns.find(a => a.id === id))
          .map(([id, qty]) => {
            const addOn = relevantAddOns.find(a => a.id === id)
            return { id, name: addOn.name, price: addOn.price, qty }
          })
        const effectiveBattalion = info.branch === 'Army'
          ? `${info.armyCompany} ${info.armyUnit}`.trim()
          : info.battalion
        const submittedInfo = { ...info, battalion: effectiveBattalion }
        const res  = await fetch(apiUrl('submit-order'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderType, items: itemsPayload, addOns: addOnsPayload, info: submittedInfo, total: grandTotal }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to submit order')
        navigate(`/order-status/${data.orderId}`, { state: { justOrdered: true, info: submittedInfo, total: grandTotal, orderType } })
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
    if (step === 4 && !hasAddOns) { setStep(2); return }
    if (step > 0) setStep(s => s - 1)
  }

  const vsStep = hasAddOns ? step : (step === 4 ? 3 : step)
  const Dot  = ({ n }) => (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: vsStep > n ? '#3A5A14' : vsStep === n ? '#D12918' : '#F5EDCC',
      border: `2px solid ${vsStep > n ? '#3A5A14' : vsStep === n ? '#D12918' : 'rgba(209,41,24,0.25)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: vsStep >= n ? '#fff' : '#6B8F3A', transition: 'all 0.3s',
    }}>{vsStep > n ? '✓' : n}</div>
  )
  const Line = ({ n }) => (
    <div style={{ flex: 1, height: 2, background: vsStep > n ? '#3A5A14' : 'rgba(209,41,24,0.15)', transition: 'background 0.3s' }} />
  )

  const categories = orderType === 'tray' ? trayCategories : plateCategories
  const grouped    = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && i.available && i.price != null)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  // Ordering closed screen — shown when cycle fetch is done and no cycle is open
  if (!cycleLoading && !cycle) {
    return (
      <div className="page-wrap" style={{ maxWidth: 580 }}>
        <div className="page-eyebrow">Place an Order</div>
        <h1 className="page-title">Ordering Closed</h1>
        <div className="title-rule" />
        <div style={{
          background: 'rgba(237, 125, 43, 0.08)',
          border: '1px solid rgba(237, 125, 43, 0.22)',
          borderRadius: 14, padding: '24px 28px', marginTop: 8,
        }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 15, fontWeight: 600,
            color: '#8B5525', margin: '0 0 12px', lineHeight: 1.6,
          }}>
            Ordering is currently closed — check back soon for the next drop!
          </p>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13, color: '#A0724A', margin: 0, lineHeight: 1.6,
          }}>
            Obaa Yaa opens ordering windows before each delivery. When an order window is open you'll be able to place your order here.
          </p>
        </div>
        <button
          onClick={() => navigate('/menu')}
          style={{
            marginTop: 24,
            fontFamily: "'Nunito', sans-serif",
            background: '#3A5A14', color: '#fff',
            fontSize: 13, fontWeight: 700,
            padding: '14px 24px', borderRadius: 10, border: 'none',
            cursor: 'pointer',
          }}
        >Browse the Menu</button>
      </div>
    )
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 580 }}>

      {/* ── STEP 0: loading skeleton while cycle resolves ── */}
      {step === 0 && cycleLoading && (
        <div style={{ paddingTop: 40 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              borderRadius: 20, overflow: 'hidden', marginBottom: 16,
              border: '2px solid rgba(209,41,24,0.12)',
            }}>
              <div style={{ height: 100, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              <div style={{ height: 56, background: '#fff' }} />
            </div>
          ))}
        </div>
      )}

      {/* Steps 1–3 header */}
      {step > 0 && (
        <>
          <div className="page-eyebrow">{orderType === 'tray' ? 'Tray Order — Wednesday' : 'Plate Order — Saturday'}</div>
          <h1 className="page-title">Place Your Order</h1>
          <div className="title-rule" />
          <div className="notice" style={{ marginBottom: 24 }}>
            <div><div className="notice-title">Cutoff: <span>{cutoffText}</span> · Delivery: {deliveryText}</div></div>
          </div>

          {/* Step bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <Dot n={1} /><Line n={1} /><Dot n={2} /><Line n={2} /><Dot n={3} />
            {hasAddOns && <><Line n={3} /><Dot n={4} /></>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
            {(hasAddOns ? ['Items', 'Your Info', 'Extras', 'Summary'] : ['Items', 'Your Info', 'Summary']).map((l, i, arr) => (
              <span key={i} style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 600,
                color: vsStep === i + 1 ? '#D12918' : '#6B8F3A',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                width: 80, textAlign: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
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

          {info.branch === 'Army' && (
            <>
              <div className="field-group">
                <label className="field-label">Company *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo'].map(co => (
                    <div key={co} onClick={() => setInfo(i => ({ ...i, armyCompany: co }))} style={{
                      padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${info.armyCompany === co ? '#D12918' : 'rgba(209,41,24,0.18)'}`,
                      background: info.armyCompany === co ? 'rgba(209,41,24,0.04)' : '#fff',
                      transition: 'all 0.18s', textAlign: 'center',
                      fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
                      color: info.armyCompany === co ? '#D12918' : '#3A5A14',
                    }}>
                      {co}
                    </div>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Unit Number *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: showCustomUnit ? 10 : 0 }}>
                  {['264', '233'].map(num => (
                    <div key={num}
                      onClick={() => { setShowCustomUnit(false); setInfo(i => ({ ...i, armyUnit: num })) }}
                      style={{
                        flex: 1, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${info.armyUnit === num && !showCustomUnit ? '#D12918' : 'rgba(209,41,24,0.18)'}`,
                        background: info.armyUnit === num && !showCustomUnit ? 'rgba(209,41,24,0.04)' : '#fff',
                        transition: 'all 0.18s', textAlign: 'center',
                        fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
                        color: info.armyUnit === num && !showCustomUnit ? '#D12918' : '#3A5A14',
                      }}>
                      {num}
                    </div>
                  ))}
                  <div
                    onClick={() => { setShowCustomUnit(true); setInfo(i => ({ ...i, armyUnit: '' })) }}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${showCustomUnit ? '#D12918' : 'rgba(209,41,24,0.18)'}`,
                      background: showCustomUnit ? 'rgba(209,41,24,0.04)' : '#fff',
                      transition: 'all 0.18s', textAlign: 'center',
                      fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
                      color: showCustomUnit ? '#D12918' : '#3A5A14',
                    }}>
                    Other
                  </div>
                </div>
                {showCustomUnit && (
                  <input className="field-input" type="text"
                    placeholder="Enter your unit number"
                    value={info.armyUnit}
                    onChange={e => setInfo(i => ({ ...i, armyUnit: e.target.value }))}
                    autoFocus
                  />
                )}
              </div>
            </>
          )}

          <div className="field-group">
            <label className="field-label">Full Name *</label>
            <input className="field-input" type="text" placeholder="Your full name" value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Phone Number</label>
            <input className="field-input" type="tel" placeholder="+1 (555) 000-0000" value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
          </div>
          {info.branch !== 'Army' && (
            <div className="field-group">
              <label className="field-label">Company &amp; Battalion *</label>
              <input className="field-input" type="text" placeholder="e.g. 2nd Battalion" value={info.battalion} onChange={e => setInfo(i => ({ ...i, battalion: e.target.value }))} />
            </div>
          )}

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

      {/* ── STEP 3: Extras / Add-ons ── */}
      {step === 3 && hasAddOns && (
        <div>
          <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 17, color: '#3A5A14', marginBottom: 4 }}>
            Make it even better
          </h3>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#6B8F3A', marginBottom: 24 }}>
            Add a little something extra to your order.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 12 }}>
            {relevantAddOns.map(addOn => {
              const qty = addOnCounts[addOn.id] || 0
              return (
                <div key={addOn.id} style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: `2px solid ${qty > 0 ? '#D12918' : 'rgba(209,41,24,0.12)'}`,
                  background: '#fff',
                  boxShadow: qty > 0 ? '0 6px 24px rgba(209,41,24,0.18)' : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.22s',
                  display: 'flex', alignItems: 'stretch',
                }}>
                  {/* Square image panel */}
                  <div style={{
                    width: 110, flexShrink: 0, position: 'relative',
                    background: addOn.image
                      ? '#f5f0eb'
                      : 'linear-gradient(135deg, #C0392B 0%, #D12918 35%, #ED7D2B 70%, #F5A623 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {addOn.image && (
                      <img
                        src={addOn.image} alt={addOn.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    )}
                    {qty > 0 && (
                      <div style={{
                        position: 'absolute', top: 7, left: 7,
                        background: '#D12918', color: '#fff',
                        borderRadius: 99, padding: '3px 8px',
                        fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800,
                      }}>×{qty}</div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, color: '#2A4A08', lineHeight: 1.3 }}>
                          {addOn.name}
                        </div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 17, color: '#D12918', marginLeft: 8, flexShrink: 0 }}>
                          +${addOn.price}
                        </div>
                      </div>
                      {addOn.description && (
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#6B7F4A', lineHeight: 1.5, margin: '0 0 10px' }}>
                          {addOn.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => removeAddOn(addOn.id)} disabled={!qty} style={{
                        width: 34, height: 34, borderRadius: '50%', border: 'none',
                        background: qty ? '#D12918' : 'rgba(209,41,24,0.10)',
                        color: qty ? '#fff' : '#6B8F3A',
                        fontSize: 18, fontWeight: 700, cursor: qty ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.18s',
                      }}>−</button>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: '#2A4A08', minWidth: 20, textAlign: 'center' }}>
                        {qty}
                      </span>
                      <button onClick={() => addAddOn(addOn.id)} style={{
                        width: 34, height: 34, borderRadius: '50%', border: 'none',
                        background: '#D12918', color: '#fff',
                        fontSize: 18, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.18s',
                      }}>+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#9AAD7A', textAlign: 'center', margin: 0 }}>
            No extras needed? Just continue to review your order.
          </p>
        </div>
      )}

      {/* ── STEP 4: Summary ── */}
      {step === summaryStep && (
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
            {/* Add-on line items */}
            {Object.entries(addOnCounts).filter(([id, qty]) => qty > 0 && relevantAddOns.find(a => a.id === id)).map(([id, qty]) => {
              const addOn = relevantAddOns.find(a => a.id === id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(209,41,24,0.06)', background: 'rgba(209,41,24,0.02)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: '#456D1B' }}>{addOn?.name}</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#6B8F3A' }}>Add-on × {qty}</div>
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: '#D12918' }}>${addOn.price * qty}</div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '2px solid rgba(209,41,24,0.12)' }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3A5A14' }}>Total</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, fontWeight: 700, color: '#D12918' }}>
                {grandTotal > 0 ? `$${grandTotal}` : 'TBD'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(209,41,24,0.04)', border: '1px solid rgba(209,41,24,0.12)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your Details</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: '#3A5A14', lineHeight: 2 }}>
              <div>{info.name}</div>
              {info.branch === 'Army' ? (
                <div>
                  {info.branch}
                  {info.armyCompany ? ` · ${info.armyCompany}` : ''}
                  {info.armyUnit ? ` · Unit ${info.armyUnit}` : ''}
                </div>
              ) : (
                <div>{info.branch}{info.battalion ? ` · ${info.battalion}` : ''}</div>
              )}
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
              Send <strong>${grandTotal}</strong> via {info.paymentMethod === 'cashapp' ? 'Cash App' : 'Zelle'} to confirm.
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
            background: submitting ? 'rgba(209,41,24,0.4)' : step === summaryStep ? '#3A5A14' : '#D12918',
            border: 'none', borderRadius: 12, color: '#fff',
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = step === summaryStep ? '#456D1B' : '#ED7D2B' }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = step === summaryStep ? '#3A5A14' : '#D12918' }}
          >
            {submitting
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Placing Order...</>
              : step === 1 ? 'Continue to Your Info →'
              : step === 2 ? (hasAddOns ? 'Add Extras →' : 'Review Order →')
              : step === 3 && hasAddOns ? 'Review Order →'
              : 'Place Order'}
          </button>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}
