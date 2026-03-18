import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// PIN comes from environment variable — set VITE_ADMIN_PIN in your .env
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN

export default function AdminLogin() {
  const navigate = useNavigate()
  const [pin,    setPin]    = useState('')
  const [error,  setError]  = useState(false)
  const [shake,  setShake]  = useState(false)

  const handleKey = (val) => {
    if (pin.length >= 4) return
    const next = pin + val
    setPin(next)
    setError(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          sessionStorage.setItem('mama_admin', '1')
          sessionStorage.setItem('mama_admin_pin', next)
          navigate('/admin')
        } else {
          setError(true)
          setShake(true)
          setPin('')
          setTimeout(() => setShake(false), 500)
        }
      }, 180)
    }
  }

  const del = () => setPin(p => p.slice(0, -1))

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#3A5A14',
      backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(209,41,24,0.12) 0%, transparent 60%)',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 24, padding: '44px 40px 40px',
        width: 320, textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Logo */}
        <img
          src="/images/logo-icon-inverse.png"
          alt="Obaa Yaa's Kitchen"
          style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', display: 'block' }}
        />

        <h2 style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 900,
          fontSize: 22, color: '#fff', marginBottom: 4,
        }}>Obaa Yaa's Kitchen</h2>

        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12, color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          marginBottom: 32,
        }}>Admin Access</p>

        {/* PIN dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 14,
          marginBottom: 28,
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < pin.length
                ? (error ? '#e74c3c' : '#D12918')
                : 'rgba(255,255,255,0.15)',
              transition: 'background 0.15s',
              transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
            }} />
          ))}
        </div>

        {error && (
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 12, color: '#e74c3c',
            marginBottom: 16, fontWeight: 600,
          }}>Incorrect PIN. Try again.</p>
        )}

        {/* Numpad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        }}>
          {keys.map((k, i) => (
            <button
              key={i}
              onClick={() => k === '⌫' ? del() : k ? handleKey(k) : null}
              disabled={!k}
              style={{
                height: 56, borderRadius: 12, border: 'none',
                background: k === '⌫'
                  ? 'rgba(209,41,24,0.18)'
                  : k ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: k === '⌫' ? '#D12918' : '#fff',
                fontSize: k === '⌫' ? 18 : 20,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
                cursor: k ? 'pointer' : 'default',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { if (k) e.currentTarget.style.background = k === '⌫' ? 'rgba(209,41,24,0.30)' : 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { if (k) e.currentTarget.style.background = k === '⌫' ? 'rgba(209,41,24,0.18)' : 'rgba(255,255,255,0.07)' }}
              onMouseDown={e => { if (k) e.currentTarget.style.transform = 'scale(0.93)' }}
              onMouseUp={e => { if (k) e.currentTarget.style.transform = 'scale(1)' }}
            >{k}</button>
          ))}
        </div>

        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 11, color: 'rgba(255,255,255,0.20)',
          marginTop: 28, lineHeight: 1.6,
        }}>
          This page is for Obaa Yaa only. 🍛
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
