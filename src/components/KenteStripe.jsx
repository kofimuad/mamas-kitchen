export default function KenteStripe({ height = 5 }) {
  return (
    <div style={{
      height,
      background: 'repeating-linear-gradient(90deg, #D12918 0 10px, #ED7D2B 10px 20px, #ED7D2B 20px 30px, #3A5A14 30px 40px)',
      width: '100%',
      flexShrink: 0,
    }} />
  )
}
