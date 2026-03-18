import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import FoodCard from '../components/FoodCard'
import { plateCategories, trayCategories } from '../data/menu'
import useMenu from '../hooks/useMenu'

export default function Menu() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('plate')
  const { plateItems, trayItems, loading } = useMenu()

  const items      = tab === 'plate' ? plateItems : trayItems
  const categories = tab === 'plate' ? plateCategories : trayCategories

  const grouped = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat && i.available)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div>
      <div className="page-wrap" style={{ maxWidth: 680 }}>

        <div className="page-eyebrow">Fresh Every Week</div>
        <h1 className="page-title">Our Menu</h1>
        <div className="title-rule" />
        <p className="page-sub">
          Cooked fresh and delivered to your base. Two delivery days every week.
        </p>

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: '#F5EDCC',
          borderRadius: 12, padding: 4, marginBottom: 36,
          border: '1px solid rgba(209,41,24,0.15)',
        }}>
          {[
            { key: 'plate', label: '🍽️ Saturday Plates',   sub: 'Order by Thu 8 PM' },
            { key: 'tray',  label: '🥘 Wednesday Trays',   sub: 'Order by Mon 8 PM' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '11px 12px',
              background: tab === t.key ? '#D12918' : 'transparent',
              color: tab === t.key ? '#fff' : '#456D1B',
              border: 'none', borderRadius: 9,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span>{t.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 400,
                opacity: tab === t.key ? 0.75 : 0.55,
              }}>{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Items grouped by category */}
        {loading ? (
          // Skeleton rows while MongoDB loads
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#fff', borderRadius: 14, padding: 12,
                border: '1px solid rgba(209,41,24,0.08)',
              }}>
                <div style={{ width: 62, height: 62, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 15, width: '50%', borderRadius: 5, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 8 }} />
                  <div style={{ height: 11, width: '75%', borderRadius: 5, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#D12918', marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1.5px solid rgba(209,41,24,0.12)',
              }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {catItems.map(item => (
                  <FoodCard key={item.id} item={{ ...item, type: tab }} compact />
                ))}
              </div>
            </div>
          ))
        )}

        {/* CTA */}
        <div style={{
          background: '#3A5A14', borderRadius: 20,
          padding: '28px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap',
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4,
            }}>Ready to order?</div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, color: 'rgba(255,255,255,0.55)',
            }}>
              {tab === 'plate' ? 'Cutoff Thursday 8 PM · Delivery Saturday' : 'Cutoff Monday 8 PM · Delivery Wednesday'}
            </div>
          </div>
          <button
            onClick={() => navigate('/order', { state: { preselect: { type: tab } } })}
            style={{
              fontFamily: "'Nunito', sans-serif",
              background: '#D12918', color: '#fff',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '14px 24px', borderRadius: 8, border: 'none',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ED7D2B'}
            onMouseLeave={e => e.currentTarget.style.background = '#D12918'}
          >Place Your Order →</button>
        </div>

      </div>
      <Footer />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
