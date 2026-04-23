import { useNavigate } from 'react-router-dom'
import FoodCard from '../components/FoodCard'
import FoodShowcaseSlider from '../components/FoodShowcaseSlider'
import Footer from '../components/Footer'
import useMenu from '../hooks/useMenu'
import { getNextDeliveryLabel } from '../lib/weekUtils'

export default function Home() {
  const navigate  = useNavigate()
  const { plateItems, trayItems, loading } = useMenu()
  const nextDelivery = getNextDeliveryLabel()

  // Show items for the next upcoming delivery
  const previewItems = nextDelivery.type === 'tray' ? trayItems : plateItems
  const previewLabel = nextDelivery.type === 'tray' ? 'Wednesday Trays' : 'Saturday Plates'
  const availablePreview = previewItems.filter(i => i.available && i.price != null)
  const showShowcase = !loading && availablePreview.length === 0

  return (
    <div>

      {/* ══════════════════════════════
          HERO — full viewport
      ══════════════════════════════ */}
      <div style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* ── HERO IMAGE — change src to any URL or local path ── */}
        <img
          src="https://res.cloudinary.com/dx5tbpgob/image/upload/v1773097016/Coconut_Curry_Rice_with_Grilled_Chicken_-_KikiFoodies_1_mt6jbm.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,5,0,0.75) 0%, rgba(80,20,10,0.55) 60%, rgba(15,5,0,0.78) 100%)',
        }} />

        {/* Glass card — compact to fit on first load */}
        <div style={{
          position: 'relative', zIndex: 2,
          marginTop: 64,
          background: 'rgba(20,8,0,0.52)',
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: '1px solid rgba(255,255,255,0.20)',
          borderRadius: 16,
          padding: '36px 40px 32px',
          maxWidth: 440,
          width: 'calc(100% - 48px)',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}>

          {/* Eyebrow */}
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.26em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 14,
          }}>GH &nbsp; Serving Our Heroes</p>

          {/* Gold rule */}
          <div style={{ width: 36, height: 1, background: '#ED7D2B', opacity: 0.8, margin: '0 auto 18px' }} />

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 'clamp(26px, 3.5vw, 42px)',
            color: '#fff', lineHeight: 1.2, fontWeight: 700,
            margin: '0 0 4px', letterSpacing: '-0.01em',
          }}>Authentic Ghanaian Cuisine,</h1>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 'clamp(26px, 3.5vw, 42px)',
            color: '#fff', lineHeight: 1.2, fontWeight: 700,
            margin: '0 0 4px', letterSpacing: '-0.01em',
          }}>with{' '}<em style={{ color: '#ED7D2B', fontStyle: 'italic' }}>Homemade</em></h1>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 'clamp(26px, 3.5vw, 42px)',
            color: '#fff', lineHeight: 1.2, fontWeight: 700,
            margin: 0, letterSpacing: '-0.01em',
          }}>Love.</h1>

          {/* Gold rule */}
          <div style={{ width: 36, height: 1, background: '#ED7D2B', opacity: 0.8, margin: '16px auto 18px' }} />

          {/* Subtext */}
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(255,255,255,0.72)',
            fontSize: 13, lineHeight: 1.75, fontWeight: 300,
            marginBottom: 24, letterSpacing: '0.01em',
          }}>
            Authentic Ghanaian home cooking prepared fresh every week —
            exclusively for our service members and their families.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/order')}
              style={{
                fontFamily: "'Nunito', sans-serif",
                background: '#D12918', color: '#fff',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                padding: '15px 28px', borderRadius: 4, border: 'none',
                cursor: 'pointer', transition: 'all 0.22s',
                boxShadow: '0 6px 24px rgba(209,41,24,0.45)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ED7D2B'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#D12918'; e.currentTarget.style.transform = 'translateY(0)' }}
            >Place Your Order</button>

            <button
              onClick={() => navigate('/menu')}
              style={{
                fontFamily: "'Nunito', sans-serif",
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                padding: '14px 28px', borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.28)',
                cursor: 'pointer', transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)' }}
            >View This Week's Menu</button>
          </div>
        </div>

      </div>


      {/* ══════════════════════════════
          DELIVERY SCHEDULE
      ══════════════════════════════ */}
      <div style={{ padding: '48px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: '#D12918', marginBottom: 8,
          }}>When We Deliver</p>
          <h2 style={{
            fontFamily: "'Nunito', sans-serif", fontWeight: 900,
            fontSize: 32, color: '#3A5A14',
          }}>Two Delivery Days a Week</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720, margin: '0 auto' }}
          className="delivery-grid"
        >
          {[
            {
              day: 'Wednesday',
              orderType: 'tray',
              type: 'Tray Orders',
              cutoff: 'Order by Monday 8 PM',
              desc: 'Large trays for groups — perfect for sharing with your unit.',
              bg: '#3A5A14',
            },
            {
              day: 'Saturday',
              orderType: 'plate',
              type: 'Plate Orders',
              cutoff: 'Order by Friday 6 PM',
              desc: 'Individual plates — your personal taste of home every week.',
              bg: '#D12918',
            },
          ].map(d => (
            <div
              key={d.day}
              onClick={() => navigate('/menu', { state: { tab: d.orderType } })}
              style={{
                background: d.bg,
                borderRadius: 20, padding: '28px 24px',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#ED7D2B', marginBottom: 8,
              }}>{d.type}</div>
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 10, lineHeight: 1,
              }}>{d.day}</div>
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, color: 'rgba(255,255,255,0.60)',
                lineHeight: 1.7, marginBottom: 18,
              }}>{d.desc}</p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '7px 14px',
              }}>
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '0.03em',
                }}>{d.cutoff}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          THIS WEEK'S MENU / FOOD SHOWCASE
      ══════════════════════════════ */}
      <div style={{ padding: '52px 40px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#D12918', marginBottom: 6,
            }}>{showShowcase ? 'What We Make' : previewLabel}</p>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 32, color: '#3A5A14', margin: 0 }}>
              {showShowcase ? 'Our Menu' : "This Week's Menu"}
            </h2>
          </div>
          {showShowcase ? (
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, color: '#6B8F3A',
              textAlign: 'right', maxWidth: 240, margin: 0, lineHeight: 1.6,
            }}>Ordering is closed — check back soon for the next drop!</p>
          ) : (
            <button
              onClick={() => navigate('/menu', { state: { tab: nextDelivery.tab } })}
              style={{
                fontFamily: "'Nunito', sans-serif",
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#D12918',
                letterSpacing: '0.04em',
              }}
            >View full menu →</button>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                borderRadius: 16, overflow: 'hidden',
                background: '#fff',
                border: '1px solid rgba(209,41,24,0.08)',
              }}>
                <div style={{ height: 200, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 18, width: '70%', borderRadius: 6, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: 10 }} />
                  <div style={{ height: 13, width: '90%', borderRadius: 6, background: 'linear-gradient(90deg, #f0e8e0 25%, #e8ddd5 50%, #f0e8e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : showShowcase ? (
          <FoodShowcaseSlider plateItems={plateItems} trayItems={trayItems} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {availablePreview.slice(0, 5).map(item => (
              <FoodCard key={item.id} item={{ ...item, type: nextDelivery.tab }} />
            ))}
          </div>
        )}
      </div>



      {/* ══════════════════════════════
          COMMUNITY BANNER
      ══════════════════════════════ */}
      <div style={{ padding: '48px 40px 60px' }}>
        <div style={{
          borderRadius: 24, overflow: 'hidden',
          background: '#3A5A14',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ padding: '44px 48px', maxWidth: 580 }}>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              display: 'inline-block', background: '#ED7D2B', color: '#3A5A14',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.10em', padding: '4px 12px', borderRadius: 99, marginBottom: 16,
            }}>🪖 Military Community</span>
            <h3 style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900,
              fontSize: 30, color: '#fff', marginBottom: 14, lineHeight: 1.25,
            }}>Bringing the Taste<br />of Home to Base</h3>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.8, fontWeight: 300, margin: 0,
            }}>
              We deliver every Wednesday and Saturday to service members of African descent.
              Your order isn't just a meal — it's a piece of home.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 640px) {
          .delivery-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
