import { useState } from 'react'
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
  const [tab, setTab] = useState('plate') // 'plate' | 'tray'

  // Load from MongoDB (falls back to menu.js defaults if not saved yet)
  const { plateItems, trayItems, loading, saveMenu } = useMenu()

  // Local editable copies — initialised from the hook
  const [plates, setPlates] = useState(null)
  const [trays,  setTrays]  = useState(null)

  // Once the hook has loaded, seed the local editable copies (only once)
  if (plates === null && !loading) setPlates([...plateItems])
  if (trays  === null && !loading) setTrays([...trayItems])

  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'

  const items      = tab === 'plate' ? (plates || []) : (trays || [])
  const setItems   = tab === 'plate' ? setPlates : setTrays
  const categories = tab === 'plate' ? plateCategories : trayCategories

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

  // ── Add new item ──
  const [addingCat, setAddingCat] = useState(null)
  const [newItem,   setNewItem]   = useState({ name: '', price: '', category: '' })

  const openAdd = (cat) => {
    setAddingCat(cat)
    setNewItem({ name: '', price: '', category: cat, image: '', customName: false })
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
      await saveMenu(plates, trays)
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
          { key: 'plate', label: '🍽️ Saturday Plates' },
          { key: 'tray',  label: '🥘 Wednesday Trays' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '11px 16px',
            background: tab === t.key ? '#D12918' : 'transparent',
            color: tab === t.key ? '#fff' : '#456D1B',
            border: 'none', borderRadius: 9,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Categories */}
      {Object.entries(grouped).map(([cat, catItems]) => (
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
            <div style={{
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
