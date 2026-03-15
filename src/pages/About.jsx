import Footer from '../components/Footer'

const values = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Homemade Always',
    desc: 'Every recipe has been in the family for generations. No shortcuts, ever.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'For Our Heroes',
    desc: 'Serving those who serve — this is our honour and our calling.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Cooked with Love',
    desc: 'Every plate carries the warmth of a mother\'s kitchen, made just for you.',
  },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <div style={{
        position: 'relative',
        minHeight: 460,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 72,
      }}>
        <img
          src="/images/cooking-pot.jpg"
          alt="Mama cooking"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(18,7,0,0.45) 0%, rgba(18,7,0,0.78) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '36px 40px' }}>
          <span style={{
            display: 'inline-block',
            background: '#F5C842', color: '#1E0E04',
            fontFamily: "'Lato', sans-serif",
            fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.10em',
            padding: '5px 14px', borderRadius: 99, marginBottom: 16,
          }}>Meet the Chef</span>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(30px, 4.5vw, 52px)',
            color: '#fff', lineHeight: 1.18,
          }}>The Heart Behind<br />Every Plate</h1>
          <div style={{ width: 40, height: 1, background: '#F5C842', opacity: 0.7, margin: '18px auto 0' }} />
        </div>
      </div>


      {/* Body — all centered */}
      <div style={{ padding: '52px 40px 60px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>

        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: '#7A3A10', lineHeight: 1.9, marginBottom: 20, fontWeight: 300 }}>
          Growing up in Ghana, food was never just sustenance — it was the heartbeat of community, of celebrations, and of comfort. Every meal told a story passed down through generations.
        </p>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: '#7A3A10', lineHeight: 1.9, marginBottom: 20, fontWeight: 300 }}>
          When African service members began expressing how much they missed the taste of home, Obaa Yaa's Kitchen was born. The mission was simple: cook with the same love she'd always cooked with, and bring it to those who serve.
        </p>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: '#7A3A10', lineHeight: 1.9, marginBottom: 44, fontWeight: 300 }}>
          Every week, every plate is prepared by hand. No shortcuts. No compromises. Just authentic Ghanaian cooking delivered with care to bases across the US.
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12, marginBottom: 52,
        }}>
          {[
            { num: '100+', label: 'Happy\nCustomers' },
            { num: '3+',   label: 'Years\nServing' },
            { num: '52',   label: 'Weeks\na Year' },
            { num: '∞',    label: 'Made with\nLove' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff',
              border: '1px solid rgba(212,84,26,0.12)',
              borderRadius: 14,
              padding: '24px 8px',
              textAlign: 'center',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10,
            }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 34, fontWeight: 700,
                color: '#D4541A', lineHeight: 1,
              }}>{s.num}</div>
              <div style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: 9, fontWeight: 700, color: '#B07040',
                textTransform: 'uppercase', letterSpacing: '0.10em',
                lineHeight: 1.5, whiteSpace: 'pre-line',
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#1E0E04', marginBottom: 20 }}>
          Our Values
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 44, textAlign: 'left', border: '1px solid rgba(212,84,26,0.12)', borderRadius: 16, overflow: 'hidden' }}>
          {values.map((v, i) => (
            <div key={v.title} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              background: '#fff',
              borderBottom: i < values.length - 1 ? '1px solid rgba(212,84,26,0.08)' : 'none',
              padding: '22px 24px',
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                border: '1.5px solid rgba(212,84,26,0.25)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#D4541A',
              }}>{v.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: '#1E0E04', marginBottom: 4 }}>{v.title}</div>
                <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#B07040', lineHeight: 1.65 }}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={{
          background: '#1E0E04',
          borderRadius: 22, padding: '38px 40px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 20,
            fontFamily: "'Playfair Display', serif", fontSize: 130,
            color: 'rgba(255,255,255,0.04)', lineHeight: 1,
          }}>"</div>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.90)',
            lineHeight: 1.7, position: 'relative', marginBottom: 16,
          }}>
            "I don't just cook food. I send a little piece of home to every soldier who misses their mother's kitchen."
          </p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, fontWeight: 700, color: '#F5C842', letterSpacing: '0.06em' }}>— Obaa Yaa</p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
