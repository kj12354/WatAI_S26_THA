export default function Loader({ progress }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      gap: 24,
    }}>
      <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: '#8b949e' }}>
        Loading ERA5 Data
      </div>
      <div style={{
        width: 280,
        height: 3,
        background: 'rgba(99, 110, 123, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #58a6ff, #a371f7)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, color: '#484f58' }}>
        2m Temperature · 2020-01-15 to 2020-01-19
      </div>
    </div>
  )
}
