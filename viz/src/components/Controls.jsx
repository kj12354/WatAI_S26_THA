export default function Controls({ times, step, setStep, playing, setPlaying }) {
  const ts = times[step]
  const date = ts.slice(0, 10)
  const time = ts.slice(11, 16) + ' UTC'

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(13, 17, 23, 0.88)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(99, 110, 123, 0.15)',
      padding: '14px 24px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}>
      {/* Play/Pause */}
      <button
        onClick={() => setPlaying(p => !p)}
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          border: '1px solid rgba(99, 110, 123, 0.3)',
          background: playing
            ? 'rgba(248, 81, 73, 0.15)'
            : 'rgba(88, 166, 255, 0.15)',
          color: playing ? '#f85149' : '#58a6ff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Timestamp */}
      <div style={{ minWidth: 150, flexShrink: 0 }}>
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: '#e6edf3',
          lineHeight: 1.2,
        }}>
          {time}
        </div>
        <div style={{
          fontSize: 12,
          color: '#8b949e',
          fontWeight: 400,
        }}>
          {date}
        </div>
      </div>

      {/* Slider */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <input
          type="range"
          min={0}
          max={times.length - 1}
          value={step}
          onChange={e => setStep(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#58a6ff',
            height: 4,
            cursor: 'pointer',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#484f58',
        }}>
          <span>{times[0].slice(0, 10)}</span>
          <span style={{ color: '#8b949e', fontSize: 11 }}>
            Step {step + 1} / {times.length}
          </span>
          <span>{times[times.length - 1].slice(0, 10)}</span>
        </div>
      </div>
    </div>
  )
}
