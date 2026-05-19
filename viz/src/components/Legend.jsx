import chroma from 'chroma-js'
import { useMemo } from 'react'

const SCALE = chroma.scale(['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']).domain([-55, 45])

export default function Legend() {
  const gradient = useMemo(() => {
    const stops = []
    for (let i = 0; i <= 20; i++) {
      const t = -55 + (i / 20) * 100
      stops.push(`${SCALE(t).hex()} ${(i / 20) * 100}%`)
    }
    return `linear-gradient(to right, ${stops.join(', ')})`
  }, [])

  const ticks = [-50, -30, -10, 0, 10, 30, 45]

  return (
    <div style={{
      position: 'absolute',
      bottom: 90,
      right: 16,
      zIndex: 1000,
      background: 'rgba(13, 17, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      borderRadius: 10,
      padding: '12px 16px',
      border: '1px solid rgba(99, 110, 123, 0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: 200,
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#8b949e',
        marginBottom: 8,
        fontWeight: 500,
      }}>
        Temperature (°C)
      </div>
      <div style={{
        height: 12,
        borderRadius: 6,
        background: gradient,
        marginBottom: 6,
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: '#8b949e',
      }}>
        {ticks.map(t => (
          <span key={t} style={{
            position: 'relative',
            left: `${((t + 55) / 100) * 0}px`,
          }}>
            {t}°
          </span>
        ))}
      </div>
    </div>
  )
}
