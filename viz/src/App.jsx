import { useState, useEffect } from 'react'
import pako from 'pako'
import MapView from './components/MapView'
import Controls from './components/Controls'
import Legend from './components/Legend'
import Loader from './components/Loader'

export default function App() {
  const [data, setData] = useState(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    async function load() {
      setProgress(10)
      const res = await fetch('/era5_t2m.json.gz')
      setProgress(30)
      const buf = await res.arrayBuffer()
      setProgress(60)
      const json = pako.inflate(new Uint8Array(buf), { to: 'string' })
      setProgress(80)
      const parsed = JSON.parse(json)
      setProgress(100)
      setData(parsed)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!playing || !data) return
    const id = setInterval(() => {
      setStep(s => (s + 1) % data.times.length)
    }, 500)
    return () => clearInterval(id)
  }, [playing, data])

  if (loading) return <Loader progress={progress} />

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapView data={data} step={step} />
      <Legend />
      <Controls
        times={data.times}
        step={step}
        setStep={setStep}
        playing={playing}
        setPlaying={setPlaying}
      />
    </div>
  )
}
