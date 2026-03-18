import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer>
      <div style={{
        background: '#3A5A14',
        padding: '52px 40px 32px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 48,
        }}>

          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#D12918',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, flexShrink: 0,
              }}>🍛</div>
              <div>
                <div style={{
                  fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                  fontSize: 18, fontWeight: 700, color: '#fff',
                }}>Obaa Yaa's Kitchen</div>
                <div style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#D12918', marginTop: 1,
                }}>Authentic Ghanaian Cuisine</div>
              </div>
            </div>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13, color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.8, fontWeight: 300, maxWidth: 280,
              marginBottom: 20,
            }}>
              Authentic Ghanaian home cooking delivered to US military bases every Wednesday and Saturday.
            </p>
            {/* Kente accent */}
            <div style={{
              height: 3, width: 60, borderRadius: 2,
              background: 'repeating-linear-gradient(90deg, #D12918 0 8px, #ED7D2B 8px 16px, #ED7D2B 16px 24px)',
            }} />
          </div>

          {/* Quick links */}
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#ED7D2B',
              marginBottom: 18,
            }}>Quick Links</div>
            {[
              { label: 'Home',        path: '/' },
              { label: 'Menu',        path: '/menu' },
              { label: 'Place Order', path: '/order' },
              { label: 'Our Story',   path: '/about' },
            ].map(l => (
              <button key={l.path} onClick={() => navigate(l.path)} style={{
                display: 'block', background: 'none', border: 'none',
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, color: 'rgba(255,255,255,0.80)',
                cursor: 'pointer', padding: '5px 0',
                textAlign: 'left', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.80)'}
              >{l.label}</button>
            ))}
          </div>

          {/* Delivery info */}
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#ED7D2B',
              marginBottom: 18,
            }}>Delivery Days</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3,
              }}>🍽️ Saturday Plates</div>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12, color: 'rgba(255,255,255,0.75)',
              }}>Order by Thursday 8 PM</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3,
              }}>🥘 Wednesday Trays</div>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12, color: 'rgba(255,255,255,0.75)',
              }}>Order by Monday 8 PM</div>
            </div>

            {/* Payment icons */}
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.60)',
              marginBottom: 8,
            }}>We Accept</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['🍎 Apple Pay', '💚 Cash App'].map(p => (
                <span key={p} style={{
                  fontFamily: "'Nunito', sans-serif",
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: 11, color: 'rgba(255,255,255,0.82)',
                  padding: '4px 10px', borderRadius: 6,
                }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: 1100, margin: '40px auto 0',
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 300,
          }}>
            © {year} Obaa Yaa's Kitchen. Made with ❤️ for our heroes.
          </p>
          <button
            onClick={() => navigate('/admin')}
            style={{
              fontFamily: "'Nunito', sans-serif",
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'rgba(255,255,255,0.82)',
              letterSpacing: '0.06em',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.80)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.82)'}
          >Admin ↗</button>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          footer > div > div:first-of-type {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  )
}
