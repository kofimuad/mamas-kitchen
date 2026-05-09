import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  plateCategories, trayCategories,
  foodSuggestions,
} from '../../data/menu'
import { masterFoods } from '../../data/masterFoodList'
import useMenu from '../../hooks/useMenu'
import { adminHeaders } from '../../lib/api'

export default function MenuEditor() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('plate') // 'plate' | 'tray' | 'addons'

  // Load from MongoDB (falls back to menu.js defaults if not saved yet)
  const { plateItems, trayItems, addOns: menuAddOns, loading, saveMenu } = useMenu()

  // Local editable copies — initialised from the hook
  const [plates,     setPlates]     = useState(null)
  const [trays,      setTrays]      = useState(null)
  const [localAddOns, setLocalAddOns] = useState(null)

  // Once the hook has loaded, seed the local editable copies (only once)
  if (plates      === null && !loading) setPlates([...plateItems])
  if (trays       === null && !loading) setTrays([...trayItems])
  if (localAddOns === null && !loading) setLocalAddOns([...(menuAddOns || [])])

  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [pendingSpecific, setPendingSpecific] = useState(new Set()) // addon IDs in specific mode with 0 items yet

  const items      = tab === 'plate' ? (plates || []) : (trays || [])
  const setItems   = tab === 'plate' ? setPlates : setTrays
  const categories = tab === 'plate' ? plateCategories : trayCategories

  // All menu items combined — used for add-on trigger item picker
  const allMenuItems = [...(plates || []), ...(trays || [])]

  // ── Track which items are in "custom name" text input mode ──
  const [customizing, setCustomizing] = useState({}) // { [itemId]: true }

  // ── Update a single field on an item ──
  const update = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
    setSaveState('idle')
  }

  // ── Toggle availability ──
  const toggle = (id) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ))
    setSaveState('idle')
  }

  // ── Remove item ──
  const remove = (id) => {
    if (!confirm('Remove this item from the menu?')) return
    setItems(prev => prev.filter(item => item.id !== id))
    setSaveState('idle')
  }

  // ── Add-on helpers ──
  const updateAddOn = (id, field, value) => {
    setLocalAddOns(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
    setSaveState('idle')
  }
  const toggleAddOnOrderType = (id, type) => {
    setLocalAddOns(prev => prev.map(a => {
      if (a.id !== id) return a
      const types = a.orderTypes || ['plate', 'tray']
      return { ...a, orderTypes: types.includes(type) ? types.filter(t => t !== type) : [...types, type] }
    }))
    setSaveState('idle')
  }
  const addTriggerItem = (id, itemId) => {
    setLocalAddOns(prev => prev.map(a => {
      if (a.id !== id) return a
      const existing = a.triggerItems || []
      if (existing.includes(itemId)) return a
      return { ...a, triggerItems: [...existing, itemId] }
    }))
    setSaveState('idle')
  }
  const removeTriggerItem = (id, itemId) => {
    setLocalAddOns(prev => prev.map(a =>
      a.id === id ? { ...a, triggerItems: (a.triggerItems || []).filter(t => t !== itemId) } : a
    ))
    setSaveState('idle')
  }
  const removeAddOn = (id) => {
    if (!confirm('Remove this add-on?')) return
    setLocalAddOns(prev => prev.filter(a => a.id !== id))
    setSaveState('idle')
  }

  // ── New add-on form ──
  const [addingAddOn, setAddingAddOn] = useState(false)
  const [newAddOn, setNewAddOn] = useState({
    name: '', price: '', description: '', image: '',
    triggerItems: [], orderTypes: ['plate', 'tray'], available: true,
  })

  const confirmAddAddOn = () => {
    if (!newAddOn.name.trim()) { alert('Please enter a name for the add-on.'); return }
    if (!newAddOn.price) { alert('Please enter a price.'); return }
    const id = `addon-${newAddOn.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setLocalAddOns(prev => [...prev, {
      id,
      name:        newAddOn.name.trim(),
      price:       Number(newAddOn.price),
      description: newAddOn.description || '',
      image:       newAddOn.image || '',
      triggerItems: newAddOn.triggerItems,
      orderTypes:   newAddOn.orderTypes,
      available:    true,
    }])
    setNewAddOn({ name: '', price: '', description: '', image: '', triggerItems: [], orderTypes: ['plate', 'tray'], available: true })
    setAddingAddOn(false)
    setSaveState('idle')
  }

  // ── Add new item ──
  const [addingCat, setAddingCat] = useState(null)
  const [newItem,   setNewItem]   = useState({ name: '', price: '', category: '' })
  const addFormRefs = useRef({}) // one ref per category

  const openAdd = (cat) => {
    setAddingCat(cat)
    setNewItem({ name: '', price: '', category: cat, image: '', customName: false })
    // Scroll to form after React renders it
    setTimeout(() => {
      addFormRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const confirmAdd = () => {
    if (!newItem.name) { alert('Please choose a food name.'); return }
    const id = `${tab}-${newItem.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    setItems(prev => [...prev, {
      id,
      name:        newItem.name,
      price:       newItem.price ? Number(newItem.price) : null,
      available:   true,
      description: newItem.description || '',
      tags:        newItem.tags || [newItem.category],
      category:    newItem.category,
      image:       newItem.image || '/images/jollof-plate.jpg',
    }])
    setAddingCat(null)
    setNewItem({ name: '', price: '', category: '' })
    setSaveState('idle')
  }

  // ── Save to MongoDB ──
  const save = async () => {
    if (!plates || !trays) return
    setSaveState('saving')
    try {
      await saveMenu(plates, trays, localAddOns || [])
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 3000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 4000)
    }
  }

  const grouped = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length || true) acc[cat] = catItems // always show category even if empty
    return acc
  }, {})

  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <button onClick={() => navigate('/admin')} style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'none',
        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        color: '#D12918', marginBottom: 24,
      }}>← Back to Dashboard</button>

      <div className="page-eyebrow">Admin</div>
      <h1 className="page-title">Manage Menu</h1>
      <div className="title-rule" />
      <p className="page-sub">Turn items on or off, update prices, or add new dishes. Changes go live immediately.</p>

      {/* Tab toggle */}
      <div style={{
        display: 'flex', background: '#F5EDCC',
        borderRadius: 12, padding: 4, marginBottom: 28,
        border: '1px solid rgba(209,41,24,0.15)',
      }}>
        {[
          { key: 'plate',  label: '🍽️ Plates' },
          { key: 'tray',   label: '🥘 Trays' },
          { key: 'addons', label: '✨ Add-ons' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '11px 10px',
            background: tab === t.key ? '#D12918' : 'transparent',
            color: tab === t.key ? '#fff' : '#456D1B',
            border: 'none', borderRadius: 9,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── ADD-ONS TAB ── */}
      {tab === 'addons' && (
        <div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: '#6B8F3A', marginBottom: 20 }}>
            Add-ons appear on the order review screen. Leave "Triggered by" empty to show them on every order.
          </p>

          {(localAddOns || []).length === 0 && !addingAddOn && (
            <p style={{ fontSize: 13, color: '#6B8F3A', padding: '10px 0' }}>
              No add-ons yet. Tap "New Add-on" to create your first one.
            </p>
          )}

          {(localAddOns || []).map(addon => {
            const triggerMode = (addon.triggerItems?.length || pendingSpecific.has(addon.id)) ? 'specific' : 'all'
            const availableTriggerItems = allMenuItems.filter(m => !(addon.triggerItems || []).includes(m.id))
            return (
              <div key={addon.id} style={{
                background: addon.available ? '#fff' : 'rgba(0,0,0,0.03)',
                border: `1.5px solid ${addon.available ? 'rgba(209,41,24,0.15)' : 'rgba(0,0,0,0.10)'}`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 12,
                opacity: addon.available ? 1 : 0.6,
              }}>
                {/* Row 1: thumbnail + name + price + toggles + remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {/* Clickable image thumbnail */}
                  <label title="Click to change image" style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                      backgroundImage: addon.image
                        ? `url('${addon.image}')`
                        : 'linear-gradient(135deg, #C0392B 0%, #D12918 35%, #ED7D2B 70%, #F5A623 100%)',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: '2px dashed rgba(209,41,24,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, transition: 'background 0.2s', fontSize: 16,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.firstChild.style.opacity = 1 }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.firstChild.style.opacity = 0 }}
                      >
                        <span style={{ opacity: 0, transition: 'opacity 0.2s' }}>📷</span>
                      </div>
                    </div>
                    <input
                      type="file" accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async ev => {
                          const imageData = ev.target.result
                          updateAddOn(addon.id, 'image', imageData)
                          try {
                            const res = await fetch('/.netlify/functions/upload-menu-image', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...adminHeaders() },
                              body: JSON.stringify({ imageData, itemId: addon.id }),
                            })
                            const data = await res.json()
                            if (data.imageUrl) updateAddOn(addon.id, 'image', data.imageUrl)
                          } catch (err) {
                            console.error('Upload failed, using local preview:', err)
                          }
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    value={addon.name}
                    onChange={e => updateAddOn(addon.id, 'name', e.target.value)}
                    style={{
                      flex: 1, fontSize: 14, fontWeight: 700, color: '#3A5A14',
                      border: 'none', borderBottom: '1.5px solid rgba(209,41,24,0.2)',
                      outline: 'none', padding: '2px 0', background: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(209,41,24,0.06)', border: '1px solid rgba(209,41,24,0.18)',
                    borderRadius: 8, padding: '4px 8px', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#D12918' }}>$</span>
                    <input
                      type="number" min="0" placeholder="0"
                      value={addon.price ?? ''}
                      onChange={e => updateAddOn(addon.id, 'price', e.target.value === '' ? null : Number(e.target.value))}
                      style={{
                        width: 48, fontSize: 14, fontWeight: 700, color: '#D12918',
                        background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {/* Available toggle */}
                  <button
                    onClick={() => updateAddOn(addon.id, 'available', !addon.available)}
                    title={addon.available ? 'Mark unavailable' : 'Mark available'}
                    style={{
                      width: 44, height: 26, borderRadius: 13, border: 'none',
                      background: addon.available ? '#27ae60' : '#ccc',
                      position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: addon.available ? 21 : 3,
                      transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                  <button
                    onClick={() => removeAddOn(addon.id)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'rgba(209,41,24,0.08)', color: '#D12918',
                      border: 'none', fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >×</button>
                </div>

                {/* Row 2: order types */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Shows for:</span>
                  {[{ key: 'plate', label: 'Plates' }, { key: 'tray', label: 'Trays' }].map(t => {
                    const active = (addon.orderTypes || ['plate', 'tray']).includes(t.key)
                    return (
                      <button key={t.key} onClick={() => toggleAddOnOrderType(addon.id, t.key)} style={{
                        padding: '3px 10px', borderRadius: 6, border: `1.5px solid ${active ? '#D12918' : 'rgba(209,41,24,0.25)'}`,
                        background: active ? 'rgba(209,41,24,0.08)' : 'transparent',
                        color: active ? '#D12918' : '#6B8F3A',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>{t.label}</button>
                    )
                  })}
                </div>

                {/* Row 3: trigger items */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Triggered by:</span>
                    {[{ key: 'all', label: 'All orders' }, { key: 'specific', label: 'Specific items' }].map(opt => (
                      <button key={opt.key} onClick={() => {
                        if (opt.key === 'all') {
                          updateAddOn(addon.id, 'triggerItems', [])
                          setPendingSpecific(prev => { const next = new Set(prev); next.delete(addon.id); return next })
                        } else {
                          setPendingSpecific(prev => new Set([...prev, addon.id]))
                        }
                      }} style={{
                        padding: '3px 10px', borderRadius: 6,
                        border: `1.5px solid ${triggerMode === opt.key ? '#3A5A14' : 'rgba(0,0,0,0.15)'}`,
                        background: triggerMode === opt.key ? 'rgba(58,90,20,0.1)' : 'transparent',
                        color: triggerMode === opt.key ? '#3A5A14' : '#6B8F3A',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>{opt.label}</button>
                    ))}
                  </div>

                  {/* Trigger chips */}
                  {triggerMode === 'specific' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {(addon.triggerItems || []).map(tid => {
                        const menuItem = allMenuItems.find(m => m.id === tid)
                        return (
                          <span key={tid} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(58,90,20,0.1)', border: '1px solid rgba(58,90,20,0.25)',
                            borderRadius: 6, padding: '2px 8px',
                            fontSize: 12, fontWeight: 600, color: '#3A5A14',
                          }}>
                            {menuItem?.name || tid}
                            <button onClick={() => removeTriggerItem(addon.id, tid)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#D12918', fontSize: 14, lineHeight: 1, padding: 0,
                            }}>×</button>
                          </span>
                        )
                      })}
                      {availableTriggerItems.length > 0 && (
                        <select
                          value=""
                          onChange={e => { if (e.target.value) addTriggerItem(addon.id, e.target.value) }}
                          style={{
                            fontSize: 12, fontWeight: 600, color: '#3A5A14',
                            border: '1px dashed rgba(58,90,20,0.4)', borderRadius: 6,
                            padding: '2px 8px', background: 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <option value="">+ Add item...</option>
                          {availableTriggerItems.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* New add-on form */}
          {addingAddOn ? (
            <div style={{
              padding: 16, background: 'rgba(209,41,24,0.04)',
              border: '1.5px dashed rgba(209,41,24,0.30)', borderRadius: 14, marginTop: 4,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D12918', marginBottom: 14 }}>New Add-on</div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Add-on name (e.g. Extra Chicken)"
                  value={newAddOn.name}
                  onChange={e => setNewAddOn(n => ({ ...n, name: e.target.value }))}
                  className="field-input"
                  style={{ flex: 1, boxSizing: 'border-box' }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(209,41,24,0.06)', border: '1px solid rgba(209,41,24,0.18)',
                  borderRadius: 8, padding: '4px 10px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#D12918' }}>$</span>
                  <input
                    type="number" min="0" placeholder="Price"
                    value={newAddOn.price}
                    onChange={e => setNewAddOn(n => ({ ...n, price: e.target.value }))}
                    style={{
                      width: 60, fontSize: 14, fontWeight: 700, color: '#D12918',
                      background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shows for:</span>
                {[{ key: 'plate', label: 'Plates' }, { key: 'tray', label: 'Trays' }].map(t => {
                  const active = newAddOn.orderTypes.includes(t.key)
                  return (
                    <button key={t.key} onClick={() => setNewAddOn(n => ({
                      ...n,
                      orderTypes: active ? n.orderTypes.filter(x => x !== t.key) : [...n.orderTypes, t.key],
                    }))} style={{
                      padding: '3px 10px', borderRadius: 6,
                      border: `1.5px solid ${active ? '#D12918' : 'rgba(209,41,24,0.25)'}`,
                      background: active ? 'rgba(209,41,24,0.08)' : 'transparent',
                      color: active ? '#D12918' : '#6B8F3A',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>{t.label}</button>
                  )
                })}
              </div>

              {/* Image thumbnail for new add-on */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <label title="Click to add image" style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 10,
                    backgroundImage: newAddOn.image
                      ? `url('${newAddOn.image}')`
                      : 'linear-gradient(135deg, #C0392B 0%, #D12918 35%, #ED7D2B 70%, #F5A623 100%)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '2px dashed rgba(209,41,24,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 10, transition: 'background 0.2s', fontSize: 16,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.firstChild.style.opacity = 1 }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.firstChild.style.opacity = 0 }}
                    >
                      <span style={{ opacity: 0, transition: 'opacity 0.2s' }}>📷</span>
                    </div>
                  </div>
                  <input
                    type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = async ev => {
                        const imageData = ev.target.result
                        setNewAddOn(n => ({ ...n, image: imageData }))
                        try {
                          const tempId = `addon-new-${Date.now()}`
                          const res = await fetch('/.netlify/functions/upload-menu-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...adminHeaders() },
                            body: JSON.stringify({ imageData, itemId: tempId }),
                          })
                          const data = await res.json()
                          if (data.imageUrl) setNewAddOn(n => ({ ...n, image: data.imageUrl }))
                        } catch (err) {
                          console.error('Upload failed, using local preview:', err)
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
                <span style={{ fontSize: 11, color: '#6B8F3A', fontFamily: "'Nunito', sans-serif" }}>
                  {newAddOn.image ? 'Image added — click to change' : 'Click to add image (optional)'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8F3A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Triggered by (leave empty = all orders):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {newAddOn.triggerItems.map(tid => {
                    const menuItem = allMenuItems.find(m => m.id === tid)
                    return (
                      <span key={tid} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(58,90,20,0.1)', border: '1px solid rgba(58,90,20,0.25)',
                        borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, color: '#3A5A14',
                      }}>
                        {menuItem?.name || tid}
                        <button onClick={() => setNewAddOn(n => ({ ...n, triggerItems: n.triggerItems.filter(t => t !== tid) }))} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#D12918', fontSize: 14, lineHeight: 1, padding: 0,
                        }}>×</button>
                      </span>
                    )
                  })}
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return
                      setNewAddOn(n => ({ ...n, triggerItems: [...n.triggerItems, e.target.value] }))
                    }}
                    style={{
                      fontSize: 12, fontWeight: 600, color: '#3A5A14',
                      border: '1px dashed rgba(58,90,20,0.4)', borderRadius: 6,
                      padding: '2px 8px', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <option value="">+ Add trigger item...</option>
                    {allMenuItems
                      .filter(m => !newAddOn.triggerItems.includes(m.id))
                      .map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setAddingAddOn(false); setNewAddOn({ name: '', price: '', description: '', image: '', triggerItems: [], orderTypes: ['plate', 'tray'], available: true }) }} style={{
                  flex: 1, padding: 11, border: '1.5px solid rgba(209,41,24,0.25)',
                  borderRadius: 10, background: 'transparent', color: '#456D1B',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={confirmAddAddOn} style={{
                  flex: 2, padding: 11, background: '#D12918', border: 'none',
                  borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>Add Add-on ✓</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingAddOn(true)} style={{
              width: '100%', padding: '12px 16px', marginTop: 4,
              border: '1.5px dashed rgba(209,41,24,0.35)', borderRadius: 12,
              background: 'rgba(209,41,24,0.03)', color: '#D12918',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>+ New Add-on</button>
          )}
        </div>
      )}

      {/* Categories */}
      {tab !== 'addons' && Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: 28 }}>

          {/* Category header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12, paddingBottom: 8,
            borderBottom: '2px solid rgba(209,41,24,0.12)',
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#D12918',
              textTransform: 'uppercase', letterSpacing: '0.10em',
            }}>{cat}</div>
            <button onClick={() => openAdd(cat)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(209,41,24,0.08)', color: '#D12918',
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer',
            }}>+ Add item</button>
          </div>

          {/* Items */}
          {catItems.length === 0 && (
            <p style={{ fontSize: 13, color: '#6B8F3A', padding: '10px 0' }}>
              No items in this category yet. Tap "+ Add item" to add one.
            </p>
          )}

          {catItems.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', marginBottom: 10,
              background: item.available ? '#fff' : 'rgba(0,0,0,0.03)',
              border: `1.5px solid ${item.available ? 'rgba(209,41,24,0.15)' : 'rgba(0,0,0,0.10)'}`,
              borderRadius: 14,
              opacity: item.available ? 1 : 0.55,
              transition: 'all 0.2s',
            }}>

              {/* Thumbnail — click to upload new image */}
              <label title="Click to change image" style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 10,
                  backgroundImage: `url('${item.image}')`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: item.available ? 'none' : 'grayscale(80%)',
                  border: '2px dashed rgba(209,41,24,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10, transition: 'background 0.2s',
                    fontSize: 18,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                  >
                    <span style={{ opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >📷</span>
                  </div>
                </div>
                <input
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files[0]
                    if (!file) return

                    // Show local preview immediately
                    const reader = new FileReader()
                    reader.onload = async ev => {
                      const imageData = ev.target.result
                      update(item.id, 'image', imageData) // local preview

                      // Upload to Cloudinary in background
                      try {
                        const res = await fetch('/.netlify/functions/upload-menu-image', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...adminHeaders(),
                          },
                          body: JSON.stringify({ imageData, itemId: item.id }),
                        })
                        const data = await res.json()
                        if (data.imageUrl) {
                          update(item.id, 'image', data.imageUrl) // replace with Cloudinary URL
                        }
                      } catch (err) {
                        console.error('Upload failed, using local preview:', err)
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </label>

              {/* Name — dropdown OR text input if customising */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {customizing[item.id] ? (
                  <input
                    autoFocus
                    type="text"
                    value={item.name}
                    placeholder="Type food name..."
                    onChange={e => update(item.id, 'name', e.target.value)}
                    onBlur={() => {
                      if (item.name) setCustomizing(c => ({ ...c, [item.id]: false }))
                    }}
                    style={{
                      width: '100%', fontSize: 14, fontWeight: 700, color: '#3A5A14',
                      border: 'none', borderBottom: '2px solid #D12918',
                      outline: 'none', padding: '2px 0', background: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <select
                    value={item.name}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        update(item.id, 'name', '')
                        setCustomizing(c => ({ ...c, [item.id]: true }))
                      } else {
                        update(item.id, 'name', e.target.value)
                      }
                    }}
                    style={{
                      width: '100%', fontSize: 14, fontWeight: 700, color: '#3A5A14',
                      background: 'none', border: 'none', outline: 'none',
                      cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                      appearance: 'auto',
                    }}
                  >
                    <option value={item.name}>{item.name}</option>
                    {(foodSuggestions[cat] || [])
                      .filter(s => s !== item.name)
                      .map(s => <option key={s} value={s}>{s}</option>)
                    }
                    <option value="__custom__">✏️ Type custom name...</option>
                  </select>
                )}
                <div style={{ fontSize: 11, color: '#6B8F3A', marginTop: 2 }}>
                  {item.tags.slice(0, 2).join(' · ')}
                </div>
              </div>

              {/* Price input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(209,41,24,0.06)',
                border: '1px solid rgba(209,41,24,0.18)',
                borderRadius: 8, padding: '5px 10px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D12918' }}>$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="TBD"
                  value={item.price ?? ''}
                  onChange={e => update(item.id, 'price', e.target.value === '' ? null : Number(e.target.value))}
                  style={{
                    width: 52, fontSize: 14, fontWeight: 700, color: '#D12918',
                    background: 'none', border: 'none', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Toggle availability */}
              <button
                onClick={() => toggle(item.id)}
                title={item.available ? 'Mark as unavailable' : 'Mark as available'}
                style={{
                  width: 44, height: 26, borderRadius: 13, border: 'none',
                  background: item.available ? '#27ae60' : '#ccc',
                  position: 'relative', cursor: 'pointer', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute', top: 3,
                  left: item.available ? 21 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>

              {/* Remove */}
              <button
                onClick={() => remove(item.id)}
                title="Remove from menu"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(209,41,24,0.08)', color: '#D12918',
                  border: 'none', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >×</button>
            </div>
          ))}

          {/* Add item inline form */}
          {addingCat === cat && (
            <div
              ref={el => addFormRefs.current[cat] = el}
              style={{
                padding: 16, background: 'rgba(209,41,24,0.04)',
                border: '1.5px dashed rgba(209,41,24,0.30)',
                borderRadius: 14, marginTop: 4,
              }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D12918', marginBottom: 14 }}>
                New {cat} Item
              </div>

              {/* ── Step 1: pick from master list or type custom ── */}
              {!newItem.customName ? (
                <select
                  value={newItem.masterId || ''}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setNewItem(n => ({ ...n, masterId: '', name: '', price: '', image: '', customName: true }))
                      return
                    }
                    const master = masterFoods.find(f => f.id === e.target.value)
                    if (master) {
                      setNewItem(n => ({
                        ...n,
                        masterId:    master.id,
                        name:        master.name,
                        price:       master.defaultPrice ?? '',
                        image:       master.image || '',
                        tags:        master.tags || [cat],
                        description: master.description || '',
                      }))
                    } else {
                      setNewItem(n => ({ ...n, masterId: '', name: '', price: '', image: '' }))
                    }
                  }}
                  className="field-select"
                  style={{ width: '100%', marginBottom: 14 }}
                >
                  <option value="">Choose a dish...</option>
                  {masterFoods
                    .filter(f => f.type === tab && f.category === cat)
                    .map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                  }
                  <option value="__custom__">✏️ Type a custom name...</option>
                </select>
              ) : (
                <input
                  autoFocus
                  type="text"
                  placeholder="Type food name..."
                  value={newItem.name}
                  onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                  className="field-input"
                  style={{ width: '100%', marginBottom: 14, boxSizing: 'border-box' }}
                />
              )}

              {/* ── Preview card — shows once a dish is selected ── */}
              {(newItem.name || newItem.image) && (
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  background: '#fff', border: '1px solid rgba(209,41,24,0.18)',
                  borderRadius: 12, padding: 12, marginBottom: 14,
                }}>

                  {/* Image — click to replace */}
                  <label title="Click to upload a different photo" style={{ flexShrink: 0, cursor: 'pointer' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 10,
                      backgroundImage: newItem.image ? `url('${newItem.image}')` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      background: newItem.image ? undefined : 'rgba(209,41,24,0.08)',
                      border: '2px dashed rgba(209,41,24,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, color: '#6B8F3A',
                    }}>
                      {!newItem.image && '📷'}
                    </div>
                    <input
                      type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async ev => {
                          const imageData = ev.target.result
                          setNewItem(n => ({ ...n, image: imageData }))
                          try {
                            const res = await fetch('/.netlify/functions/upload-menu-image', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...adminHeaders() },
                              body: JSON.stringify({ imageData, itemId: `new-${Date.now()}` }),
                            })
                            const data = await res.json()
                            if (data.imageUrl) setNewItem(n => ({ ...n, image: data.imageUrl }))
                          } catch (err) { console.error('Upload failed:', err) }
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>

                  <div style={{ flex: 1 }}>
                    {/* Name — editable inline */}
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                      style={{
                        width: '100%', fontSize: 14, fontWeight: 700, color: '#3A5A14',
                        border: 'none', borderBottom: '1.5px solid rgba(209,41,24,0.2)',
                        outline: 'none', padding: '2px 0', background: 'none',
                        fontFamily: 'inherit', marginBottom: 8,
                      }}
                    />

                    {/* Price — editable inline */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(209,41,24,0.06)', border: '1px solid rgba(209,41,24,0.18)',
                      borderRadius: 8, padding: '4px 10px',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#D12918' }}>$</span>
                      <input
                        type="number" min="0" placeholder="Price"
                        value={newItem.price}
                        onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))}
                        style={{
                          width: 60, fontSize: 14, fontWeight: 700, color: '#D12918',
                          background: 'none', border: 'none', outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#6B8F3A', marginLeft: 8 }}>tap photo or name to edit</span>

                    {/* Description */}
                    <textarea
                      placeholder="Description (optional but recommended)..."
                      value={newItem.description || ''}
                      onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%', marginTop: 10,
                        fontSize: 12, color: '#456D1B', lineHeight: 1.6,
                        border: '1px solid rgba(209,41,24,0.18)', borderRadius: 8,
                        padding: '7px 10px', outline: 'none', resize: 'vertical',
                        fontFamily: 'inherit', background: 'rgba(209,41,24,0.02)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => { setAddingCat(null); setNewItem({ name: '', price: '', category: '' }) }} style={{
                  flex: 1, padding: 11, border: '1.5px solid rgba(209,41,24,0.25)',
                  borderRadius: 10, background: 'transparent', color: '#456D1B',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={confirmAdd} style={{
                  flex: 2, padding: 11, background: '#D12918', border: 'none',
                  borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>Add to Menu ✓</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div style={{
        position: 'sticky', bottom: 20,
        background: '#FCF8E6', paddingTop: 12,
        borderTop: '1px solid rgba(209,41,24,0.12)',
      }}>
        <button
          onClick={save}
          disabled={saveState === 'saving'}
          style={{
            width: '100%', padding: 16,
            background: saveState === 'saved' ? '#27ae60'
                      : saveState === 'error'  ? '#c0392b'
                      : '#3A5A14',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
            opacity: saveState === 'saving' ? 0.7 : 1,
            transition: 'background 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
          {saveState === 'saving' ? 'Saving...'
         : saveState === 'saved'  ? '✓ Saved to Menu!'
         : saveState === 'error'  ? '✗ Save Failed — Try Again'
         : 'Save Menu Changes'}
        </button>
      </div>
    </div>
  )
}
