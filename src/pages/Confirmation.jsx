import { useNavigate, useLocation } from 'react-router-dom'

const CheckIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="18" fill="rgba(209,41,24,0.12)" />
    <path d="M10 18.5L15.5 24L26 13" stroke="#D12918" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const steps = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B8F3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    text: 'Obaa Yaa receives your order on WhatsApp right now',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B8F3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    text: 'She cooks fresh Saturday morning',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B8F3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    ),
    text: 'Your order is delivered to your base',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B8F3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    text: 'Enjoy a taste of home',
  },
]

export default function Confirmation() {
  const navigate   = useNavigate()
  const { info = {}, total = 0, method = '' } = useLocation().state || {}
  const methodLabel = method === 'apple' ? 'Apple Pay' : method === 'cashapp' ? 'Cash App Pay' : method || 'Card'

  return (
    <div className="page-wrap" style={{ maxWidth: 520, textAlign: 'center' }}>

      {/* Check icon */}
      <div style={{
        width: 72, height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
      }}>
        <CheckIcon />
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Nunito', sans-serif", fontWeight: 900,
        fontSize: 34, color: '#3A5A14', marginBottom: 12, fontWeight: 700,
      }}>Order Confirmed</h1>

      <div style={{ width: 40, height: 1.5, background: '#D12918', margin: '0 auto 20px' }} />

      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 15, color: '#456D1B', lineHeight: 1.8, marginBottom: 8,
      }}>
        Payment received. Obaa Yaa's got your order and will start cooking Saturday morning.
      </p>

      {info.name && (
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, color: '#6B8F3A', marginBottom: 32,
        }}>
          You paid{' '}
          <strong style={{ color: '#D12918', fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>${total}</strong>
          {methodLabel ? ` via ${methodLabel}` : ''}{info.name ? `, ${info.name}` : ''}.
        </p>
      )}

      {/* What happens next */}
      <div style={{
        background: '#fff',
        border: '1px solid rgba(209,41,24,0.12)',
        borderRadius: 16, padding: '20px 24px',
        marginBottom: 20, textAlign: 'left',
      }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 10, fontWeight: 700, color: '#6B8F3A',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16,
        }}>
          What happens next
        </div>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 0',
            borderBottom: i < steps.length - 1 ? '1px solid rgba(209,41,24,0.07)' : 'none',
          }}>
            <div style={{ flexShrink: 0, opacity: 0.75 }}>{step.icon}</div>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14, color: '#456D1B', lineHeight: 1.5,
            }}>{step.text}</span>
          </div>
        ))}
      </div>

      {/* WhatsApp note */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px',
        background: 'rgba(209,41,24,0.04)',
        border: '1px solid rgba(209,41,24,0.12)',
        borderRadius: 12, marginBottom: 32, textAlign: 'left',
      }}>
        <svg style={{ flexShrink: 0, marginTop: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D12918" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13, color: '#456D1B', lineHeight: 1.7, margin: 0,
        }}>
          Obaa Yaa has been notified on WhatsApp with your full order details.
          If you have any questions, reach out to her directly on WhatsApp.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '15px 40px',
          background: '#3A5A14', border: 'none', borderRadius: 4,
          color: '#fff',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#D12918'}
        onMouseLeave={e => e.currentTarget.style.background = '#3A5A14'}
      >Back to Home</button>

    </div>
  )
}
