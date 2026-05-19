import { useRef, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import chroma from 'chroma-js'

const COLOR_SCALE = chroma
  .scale(['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'])
  .domain([-55, 45])

// Pre-compute a lookup table of 1001 RGBA values for -55..45°C
const LUT = new Uint8ClampedArray(1001 * 4)
for (let i = 0; i <= 1000; i++) {
  const temp = -55 + (i / 1000) * 100
  const [r, g, b] = COLOR_SCALE(temp).rgb()
  LUT[i * 4] = r
  LUT[i * 4 + 1] = g
  LUT[i * 4 + 2] = b
  LUT[i * 4 + 3] = 180
}

function tempToLutIndex(t) {
  if (t < -55) return 0
  if (t > 45) return 1000
  return Math.round(((t + 55) / 100) * 1000)
}

function CanvasOverlay({ data, step }) {
  const map = useMap()
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)

  const { lats, lons, t2m } = data

  // Build the offscreen image for the current timestep
  const imageData = useMemo(() => {
    const h = lats.length   // 181
    const w = lons.length   // 360
    const frame = t2m[step]
    const buf = new Uint8ClampedArray(w * h * 4)

    for (let y = 0; y < h; y++) {
      const row = frame[y]
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        const li = tempToLutIndex(row[x])
        buf[idx] = LUT[li * 4]
        buf[idx + 1] = LUT[li * 4 + 1]
        buf[idx + 2] = LUT[li * 4 + 2]
        buf[idx + 3] = LUT[li * 4 + 3]
      }
    }
    return new ImageData(buf, w, h)
  }, [step, lats, lons, t2m])

  // Create canvas + overlay once
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.style.imageRendering = 'pixelated'
    canvasRef.current = canvas

    const southWest = L.latLng(lats[lats.length - 1], lons[0])
    const northEast = L.latLng(lats[0], lons[lons.length - 1])
    const bounds = L.latLngBounds(southWest, northEast)

    const overlay = L.imageOverlay(canvas.toDataURL(), bounds, {
      opacity: 0.85,
      interactive: false,
    })
    overlay.addTo(map)
    overlayRef.current = overlay

    return () => {
      map.removeLayer(overlay)
    }
  }, [map, lats, lons])

  // Paint the current frame onto the canvas and update the overlay
  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imageData, 0, 0)

    overlay.setUrl(canvas.toDataURL())
  }, [imageData])

  return null
}

export default function MapView({ data, step }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      worldCopyJump={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
      />
      <CanvasOverlay data={data} step={step} />
    </MapContainer>
  )
}
