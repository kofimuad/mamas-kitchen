import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { plateItems } from '../data/menu'
import { apiUrl } from '../lib/api'

// Load Stripe outside component to avoid re-creating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ── Inner form — uses Stripe hooks ──────────────────────────
function CheckoutForm({ total, info, plates }) {
  const stripe     = useStripe()
  const elements   = useElements()
  const navigate   = useNavigate()
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
    } else {
      // Payment succeeded — navigate to confirmation
      navigate('/confirmation', { state: { info, total, plates } })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Stripe PaymentElement — renders Apple Pay, CashApp Pay, card, etc. */}
      <div style={{ marginBottom: 24 }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay:  'auto',
              googlePay: 'never',
            },
          }}
        />
      </div>

      {error && (
        <div style={{
          background: '#fff3f3', border: '1px solid rgba(209,41,24,0.3)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 13, color: '#c0392b',
        }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%', padding: 16,
          background: loading ? 'rgba(209,41,24,0.4)' : '#3A5A14',
          border: 'none', borderRadius: 12,
          color: '#fff',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 15, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#D12918' }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3A5A14' }}
      >
        {loading ? (
          <>
            <span style={{
              width: 18, height: 18,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block', flexShrink: 0,
            }} />
            Processing...
          </>
        ) : (
          <>Pay ${total}</>
        )}
      </button>
    </form>
  )
}

// ── Outer page — creates PaymentIntent, wraps with Elements ─
export default function Payment() {
  const navigate        = useNavigate()
  const location        = useLocation()
  const { plates = [], info = {}, total = 0 } = location.state || {}

  const [clientSecret, setClientSecret] = useState(null)
  const [initError,    setInitError]    = useState(null)

  const plateCounts = plates.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  // Create PaymentIntent on mount
  useEffect(() => {
    if (!total || total <= 0) return

    fetch(apiUrl('create-payment-intent'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   Math.round(total * 100), // Stripe uses cents
        currency: 'usd',
        metadata: {
          customerName: info.name     || '',
          phone:        info.phone    || '',
          branch:       info.branch   || '',
          battalion:    info.battalion || '',
          plates:       JSON.stringify(plates), // array of plate IDs
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setInitError(data.error || 'Could not initialise payment.')
        }
      })
      .catch(() => setInitError('Could not connect to payment server.'))
  }, [total])

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary:    '#D12918',
        colorBackground: '#ffffff',
        colorText:       '#3A5A14',
        colorDanger:     '#c0392b',
        fontFamily:      'Lato, sans-serif',
        borderRadius:    '10px',
        spacingUnit:     '4px',
      },
    },
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 520 }}>
      <div className="page-eyebrow">Secure Checkout</div>
      <h1 className="page-title">Payment</h1>
      <div className="title-rule" />

      {/* Order summary */}
      <div style={{
        background: '#fff', border: '1px solid rgba(209,41,24,0.15)',
        borderRadius: 16, padding: 16, marginBottom: 28,
      }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 11, fontWeight: 700, color: '#6B8F3A',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
        }}>Order Summary</div>

        {Object.entries(plateCounts).map(([id, qty]) => {
          const item = plateItems.find(m => m.id === id)
          return (
            <div key={id} style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14, color: '#456D1B', marginBottom: 6,
            }}>
              <span>{item?.name} × {qty}</span>
              <span>${(item?.price ?? 0) * qty}</span>
            </div>
          )
        })}

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1.5px solid rgba(209,41,24,0.12)', paddingTop: 12, marginTop: 8,
        }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: '#3A5A14' }}>Total</span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 22, fontWeight: 700, color: '#D12918' }}>${total}</span>
        </div>
      </div>

      {/* Security note */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px',
        background: 'rgba(209,41,24,0.04)',
        border: '1px solid rgba(209,41,24,0.12)',
        borderRadius: 12, marginBottom: 24,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12, color: '#456D1B', lineHeight: 1.6, margin: 0,
        }}>
          Payments processed securely by <strong>Stripe</strong>.
          Apple Pay and Cash App Pay are available based on your device.
          Your order is only confirmed once payment succeeds.
        </p>
      </div>

      {/* Stripe Elements or loading/error states */}
      {initError ? (
        <div style={{
          background: '#fff3f3', border: '1px solid rgba(209,41,24,0.3)',
          borderRadius: 12, padding: 16, marginBottom: 16,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, color: '#c0392b', textAlign: 'center',
        }}>
          {initError}
        </div>
      ) : !clientSecret ? (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          fontFamily: "'Nunito', sans-serif",
          color: '#6B8F3A', fontSize: 14,
        }}>
          <span style={{
            display: 'inline-block',
            width: 24, height: 24,
            border: '2px solid rgba(209,41,24,0.2)',
            borderTopColor: '#D12918',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ marginTop: 12 }}>Preparing secure checkout...</div>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={stripeOptions}>
          <CheckoutForm total={total} info={info} plates={plates} />
        </Elements>
      )}

      <button
        onClick={() => navigate('/order')}
        style={{
          width: '100%', marginTop: 12, padding: 14,
          background: 'transparent',
          border: '1.5px solid rgba(209,41,24,0.25)',
          borderRadius: 12, color: '#456D1B',
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >← Edit Order</button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
