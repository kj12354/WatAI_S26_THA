import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
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

// Oversample factor — extend canvas beyond [-90,90]x[-180,180] to bleed past viewport edges
const PAD_LAT = 60
const PAD_LNG = 60

function CanvasOverlay({ data, step }) {
  const map = useMap()
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)

  const { lats, lons, t2m } = data

  // Find the split index where lon >= 180 (these become negative longitudes)
  const splitIdx = useMemo(() => {
    for (let i = 0; i < lons.length; i++) {
      if (lons[i] >= 180) return i
    }
    return 0
  }, [lons])

  // Build the offscreen image for the current timestep
  // Remap columns: [180..360, 0..180] so output matches -180→180
  // Add padding rows/columns by clamping to edge values for full-bleed
  const imageData = useMemo(() => {
    const h = lats.length   // 181
    const w = lons.length   // 360
    const frame = t2m[step]
    const rightHalf = w - splitIdx

    // Extra padding pixels based on degrees / resolution
    const latStep = Math.abs(lats[1] - lats[0])  // ~1°
    const lonStep = Math.abs(lons[1] - lons[0])  // ~1°
    const padY = Math.ceil(PAD_LAT / latStep)
    const padX = Math.ceil(PAD_LNG / lonStep)

    const outW = w + padX * 2
    const outH = h + padY * 2
    const buf = new Uint8ClampedArray(outW * outH * 4)

    for (let oy = 0; oy < outH; oy++) {
      // Clamp source row to valid range
      const sy = Math.max(0, Math.min(h - 1, oy - padY))
      const row = frame[sy]
      for (let ox = 0; ox < outW; ox++) {
        // Map output column back to the remapped source column
        const mx = ox - padX  // column in the original w-wide image
        let srcX
        if (mx < 0) {
          // Left padding — wrap around to the right edge
          srcX = ((mx % w) + w) % w
        } else if (mx >= w) {
          // Right padding — wrap around to the left edge
          srcX = mx % w
        } else {
          srcX = mx
        }
        // Apply the 0→360 to -180→180 remap
        srcX = srcX < rightHalf ? srcX + splitIdx : srcX - rightHalf

        const idx = (oy * outW + ox) * 4
        const li = tempToLutIndex(row[srcX])
        buf[idx] = LUT[li * 4]
        buf[idx + 1] = LUT[li * 4 + 1]
        buf[idx + 2] = LUT[li * 4 + 2]
        buf[idx + 3] = LUT[li * 4 + 3]
      }
    }
    return new ImageData(buf, outW, outH)
  }, [step, lats, lons, t2m, splitIdx])

  // Create canvas + overlay once
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.style.imageRendering = 'pixelated'
    canvasRef.current = canvas

    // Extend bounds beyond the globe so edges bleed off-screen
    const bounds = L.latLngBounds(
      L.latLng(-90 - PAD_LAT, -180 - PAD_LNG),
      L.latLng(90 + PAD_LAT, 180 + PAD_LNG)
    )

    const overlay = L.imageOverlay(canvas.toDataURL(), bounds, {
      opacity: 0.78,
      interactive: false,
      className: 'heatmap-overlay',
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

function HoverTooltip({ data, step }) {
  const map = useMap()
  const [tooltip, setTooltip] = useState(null)
  const { lats, lons, t2m } = data

  const onMouseMove = useCallback((e) => {
    let lat = e.latlng.lat
    let lng = e.latlng.lng

    // Clamp latitude
    if (lat < -90 || lat > 90) {
      setTooltip(null)
      return
    }

    // Normalize longitude to -180..180
    lng = ((lng + 180) % 360 + 360) % 360 - 180

    // Convert map lng (-180..180) to data lng (0..360)
    const dataLng = lng < 0 ? lng + 360 : lng

    // Find nearest lat index (lats go 90 → -90)
    const latIdx = Math.round((90 - lat) / (180 / (lats.length - 1)))
    // Find nearest lon index (lons go 0 → ~359)
    const lonStep = lons[1] - lons[0]
    const lonIdx = Math.round(dataLng / lonStep) % lons.length

    const clampedLatIdx = Math.max(0, Math.min(lats.length - 1, latIdx))
    const clampedLonIdx = Math.max(0, Math.min(lons.length - 1, lonIdx))

    const temp = t2m[step][clampedLatIdx][clampedLonIdx]

    setTooltip({
      x: e.containerPoint.x,
      y: e.containerPoint.y,
      lat: lat.toFixed(1),
      lng: lng.toFixed(1),
      temp: temp.toFixed(1),
    })
  }, [lats, lons, t2m, step])

  const onMouseOut = useCallback(() => {
    setTooltip(null)
  }, [])

  useEffect(() => {
    map.on('mousemove', onMouseMove)
    map.on('mouseout', onMouseOut)
    return () => {
      map.off('mousemove', onMouseMove)
      map.off('mouseout', onMouseOut)
    }
  }, [map, onMouseMove, onMouseOut])

  if (!tooltip) return null

  return (
    <div style={{
      position: 'absolute',
      left: tooltip.x + 14,
      top: tooltip.y - 44,
      zIndex: 1000,
      background: 'rgba(13, 17, 23, 0.92)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(99, 110, 123, 0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 2 }}>
        {tooltip.temp}°C
      </div>
      <div style={{ fontSize: 11, color: '#8b949e' }}>
        {tooltip.lat}°{tooltip.lat >= 0 ? 'N' : 'S'}, {tooltip.lng}°{tooltip.lng >= 0 ? 'E' : 'W'}
      </div>
    </div>
  )
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
      <HoverTooltip data={data} step={step} />
    </MapContainer>
  )
}
