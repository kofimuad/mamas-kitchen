import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl, adminHeaders } from '../../lib/api'

const MEDALS      = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#C8960C', '#909196', '#A0522D']
const MEDAL_BORDERS = [
  'rgba(200,150,12,0.35)',
  'rgba(144,145,150,0.35)',
  'rgba(160,82,45,0.35)',
]
const MEDAL_SHADOWS = [
  'rgba(200,150,12,0.12)',
  'rgba(144,145,150,0.12)',
  'rgba(160,82,45,0.12)',
]

export default function Insights() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    fetch(apiUrl('get-insights'), { headers: adminHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setLeaderboard(data.leaderboard || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div className="page-eyebrow">Kitchen Boss</div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Insights</h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 13,
            color: '#6B8F3A', margin: 0,
          }}>
            Top customers ranked by confirmed &amp; delivered orders
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{
            fontFamily: "'Nunito', sans-serif",
            background: 'rgba(58,90,20,0.08)', color: '#3A5A14',
            fontSize: 12, fontWeight: 700,
            padding: '7px 16px', borderRadius: 99,
            border: '1.5px solid rgba(58,90,20,0.25)',
            cursor: 'pointer', marginTop: 8, flexShrink: 0,
          }}
        >← Dashboard</button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          fontFamily: "'Nunito', sans-serif", color: '#6B8F3A', fontSize: 14,
        }}>
          Loading insights...
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: 16, background: '#fff3f3',
          border: '1px solid rgba(209,41,24,0.3)', borderRadius: 12,
          fontFamily: "'Nunito', sans-serif", color: '#D12918', fontSize: 14,
        }}>
          Error: {error}
        </div>
      )}

      {/* ── Leaderboard ── */}
      {!loading && !error && (
        leaderboard.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            fontFamily: "'Nunito', sans-serif", color: '#6B8F3A', fontSize: 15,
          }}>
            No confirmed orders yet.
          </div>
        ) : (
          <>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700,
              color: '#6B8F3A', textTransform: 'uppercase',
              letterSpacing: '0.09em', marginBottom: 14,
            }}>
              Top Customers — All Time
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaderboard.map((customer, i) => {
                const isMedal = i < 3
                return (
                  <div
                    key={customer._id || i}
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${isMedal ? MEDAL_BORDERS[i] : 'rgba(209,41,24,0.10)'}`,
                      borderRadius: 16,
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: isMedal
                        ? `0 2px 12px ${MEDAL_SHADOWS[i]}`
                        : '0 2px 8px rgba(209,41,24,0.05)',
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: isMedal ? 28 : 17,
                      fontWeight: 900,
                      color: isMedal ? MEDAL_COLORS[i] : 'rgba(107,143,58,0.4)',
                      minWidth: 44,
                      textAlign: 'center',
                      lineHeight: 1,
                    }}>
                      {isMedal ? MEDALS[i] : `#${i + 1}`}
                    </div>

                    {/* Name & phone */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                        fontSize: 17, color: '#3A5A14',
                        marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {customer.name || 'Unknown'}
                      </div>
                      {customer.phone && (
                        <div style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontSize: 12, color: '#6B8F3A',
                        }}>
                          {customer.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                          fontSize: 26, color: '#D12918', lineHeight: 1,
                        }}>
                          {customer.orderCount}
                        </div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif", fontSize: 10,
                          color: 'rgba(107,143,58,0.7)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3,
                        }}>
                          {customer.orderCount === 1 ? 'order' : 'orders'}
                        </div>
                      </div>

                      <div style={{ width: 1, height: 36, background: 'rgba(209,41,24,0.12)' }} />

                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                          fontSize: 22, color: '#3A5A14', lineHeight: 1,
                        }}>
                          ${(customer.totalSpent || 0).toFixed(0)}
                        </div>
                        <div style={{
                          fontFamily: "'Nunito', sans-serif", fontSize: 10,
                          color: 'rgba(107,143,58,0.7)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3,
                        }}>
                          spent
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
