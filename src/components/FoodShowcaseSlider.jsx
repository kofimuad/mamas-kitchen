import { useState, useEffect, useLayoutEffect, useRef } from 'react'

const GAP = 16

function getVisible() {
  if (typeof window === 'undefined') return 3
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 1024) return 2
  return 3
}

export default function FoodShowcaseSlider({ plateItems = [], trayItems = [] }) {
  const allItems = [
    ...plateItems.map(i => ({ ...i, _source: 'plate' })),
    ...trayItems.map(i => ({ ...i, _source: 'tray' })),
  ]
  const total = allItems.length

  const [visible, setVisible] = useState(getVisible)
  const [cardPx, setCardPx] = useState(0)
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const trackRef = useRef(null)

  const totalPages = Math.ceil(total / visible)
  const maxPage = totalPages - 1

  useLayoutEffect(() => {
    const measure = () => {
      const v = getVisible()
      setVisible(v)
      if (trackRef.current) {
        setCardPx((trackRef.current.offsetWidth - GAP * (v - 1)) / v)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Reset page to 0 when visible changes to avoid out-of-bounds
  useEffect(() => { setPage(0) }, [visible])

  // Auto-advance
  useEffect(() => {
    if (totalPages <= 1 || paused) return
    const id = setInterval(() => {
      setPage(p => (p >= maxPage ? 0 : p + 1))
    }, 4500)
    return () => clearInterval(id)
  }, [maxPage, totalPages, paused, timerKey])

  const goPrev = () => {
    setPage(p => (p <= 0 ? maxPage : p - 1))
    setTimerKey(k => k + 1)
  }
  const goNext = () => {
    setPage(p => (p >= maxPage ? 0 : p + 1))
    setTimerKey(k => k + 1)
  }
  const goPage = i => {
    setPage(i)
    setTimerKey(k => k + 1)
  }

  if (total === 0) return null

  const translateX = cardPx > 0 ? page * visible * (cardPx + GAP) : 0
  const cardWidth = cardPx > 0
    ? cardPx
    : `calc(${100 / visible}% - ${(GAP * (visible - 1)) / visible}px)`

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div ref={trackRef} style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          gap: GAP,
          transition: cardPx > 0 ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: `translateX(-${translateX}px)`,
          willChange: 'transform',
        }}>
          {allItems.map((item, i) => (
            <div
              key={item.id || `${item.name}-${i}`}
              style={{
                flexShrink: 0,
                width: cardWidth,
                background: '#fff',
                borderRadius: 18,
                border: '1px solid rgba(209,41,24,0.12)',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(209,41,24,0.07)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '4 / 3',
                backgroundImage: item.image ? `url('${item.image}')` : 'none',
                backgroundColor: '#f5ede8',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute', top: 12, left: 12,
                  background: item._source === 'plate' ? '#D12918' : '#3A5A14',
                  color: '#fff',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 99,
                }}>
                  {item._source === 'plate' ? 'Saturday' : 'Wednesday'}
                </span>
              </div>

              <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700, fontSize: 16,
                  color: '#3A5A14', lineHeight: 1.3,
                }}>{item.name}</div>
                {item.category && (
                  <div style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    color: '#ED7D2B',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{item.category}</div>
                )}
                <p style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 13, color: '#6B8F3A',
                  lineHeight: 1.6, margin: 0, flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next arrows */}
      {totalPages > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous"
            style={{
              position: 'absolute', left: -20, top: '45%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: '#fff',
              border: '1px solid rgba(209,41,24,0.18)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2, padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="#D12918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={goNext}
            aria-label="Next"
            style={{
              position: 'absolute', right: -20, top: '45%',
              transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: '#fff',
              border: '1px solid rgba(209,41,24,0.18)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2, padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#D12918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}

      {/* Page dots */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goPage(i)}
              aria-label={`Page ${i + 1}`}
              style={{
                width: i === page ? 24 : 8,
                height: 8, borderRadius: 99,
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === page ? '#D12918' : 'rgba(209,41,24,0.22)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
