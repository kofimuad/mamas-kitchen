import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const links = [
  { label: 'Home',      path: '/' },
  { label: 'Menu',      path: '/menu' },
  { label: 'Our Story', path: '/about' },
]

export default function Navbar() {
  const [solid, setSolid]       = useState(false)
  const [drawerOpen, setDrawer] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const onHome = location.pathname === '/'

  // go solid when not on home, or when scrolled past 60px on home
  useEffect(() => {
    function handleScroll() {
      setSolid(!onHome || window.scrollY > 60)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onHome])

  // close drawer on route change
  useEffect(() => { setDrawer(false) }, [location.pathname])

  const go = (path) => { navigate(path); setDrawer(false) }
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      transition: 'background 0.35s, box-shadow 0.35s, border-color 0.35s',
      background: solid ? 'rgba(255,250,244,0.97)' : 'transparent',
      backdropFilter: solid ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: solid ? 'blur(16px)' : 'none',
      borderBottom: solid ? '1px solid rgba(209,41,24,0.15)' : '1px solid rgba(255,255,255,0.10)',
      boxShadow: solid ? '0 2px 24px rgba(209,41,24,0.07)' : 'none',
    }}>

      {/* ── Inner ── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 40px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <button onClick={() => go('/')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <img
            src="/images/logo-icon.png"
            alt="Obaa Yaa's Kitchen"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}>
            <span style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18,
              color: solid ? '#3A5A14' : '#fff',
              transition: 'color 0.3s',
            }}>Obaa Yaa's Kitchen</span>
            <span style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', marginTop: 2,
              color: solid ? '#D12918' : 'rgba(237,125,43,0.85)',
              transition: 'color 0.3s',
            }}>Authentic Ghanaian Cuisine</span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(({ label, path }) => (
            <button key={path} onClick={() => go(path)} style={{
              position: 'relative',
              padding: '8px 16px',
              fontSize: 12, fontWeight: 600,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: 6,
              color: solid
                ? (isActive(path) ? '#D12918' : '#456D1B')
                : (isActive(path) ? '#fff' : 'rgba(255,255,255,0.75)'),
              transition: 'color 0.2s',
            }}>
              {label}
              {/* Active underline */}
              <span style={{
                position: 'absolute', bottom: 2, left: 16, right: 16,
                height: 1.5, borderRadius: 2,
                background: solid ? '#D12918' : '#ED7D2B',
                transform: isActive(path) ? 'scaleX(1)' : 'scaleX(0)',
                transition: 'transform 0.25s ease',
                transformOrigin: 'center',
              }} />
            </button>
          ))}

          {/* CTA */}
          <button onClick={() => go('/order')} style={{
            marginLeft: 16,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '11px 22px', borderRadius: 4, border: 'none',
            background: '#D12918', color: '#fff',
            boxShadow: '0 4px 16px rgba(209,41,24,0.35)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ED7D2B'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(209,41,24,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#D12918'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(209,41,24,0.35)' }}
          >
            Place Order
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setDrawer(d => !d)}
          style={{
            display: 'none',
            flexDirection: 'column', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block', width: 22, height: 2, borderRadius: 2,
              background: solid ? '#3A5A14' : '#fff',
              transition: 'background 0.3s',
            }} />
          ))}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{
          background: 'rgba(255,250,244,0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(209,41,24,0.15)',
          padding: '12px 16px 20px',
          boxShadow: '0 8px 32px rgba(209,41,24,0.12)',
        }}>
          {links.map(({ label, path }) => (
            <button key={path} onClick={() => go(path)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '14px 16px',
              fontSize: 13, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isActive(path) ? '#D12918' : '#456D1B',
              background: 'none', border: 'none',
              borderBottom: '1px solid rgba(209,41,24,0.12)',
              cursor: 'pointer',
            }}>{label}</button>
          ))}
          <button onClick={() => go('/order')} style={{
            display: 'block', width: '100%', marginTop: 12,
            background: '#D12918', color: '#fff',
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: 14, borderRadius: 6, border: 'none',
            cursor: 'pointer', textAlign: 'center',
          }}>Place Saturday Order</button>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
