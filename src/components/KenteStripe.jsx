export default function KenteStripe({ height = 5 }) {
  return (
    <div style={{
      height,
      background: 'repeating-linear-gradient(90deg, #D4541A 0 10px, #F08030 10px 20px, #F5C842 20px 30px, #1E0E04 30px 40px)',
      width: '100%',
      flexShrink: 0,
    }} />
  )
}
