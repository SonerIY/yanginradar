'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, AttributionControl } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import MapLegend from './MapLegend'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FirePoint } from '@/types'
import { formatSatellite, frpLabel, frpColor, frpOpacity, frpRadius, frpCategory } from '@/lib/firms'
import IlBoundariesLayer, { type IlSummary } from './IlBoundariesLayer'

export interface WindPoint {
  lat: number
  lon: number
  speed: number       // m/s
  direction: number   // 0-360, meteorological (rüzgarın geldiği yön)
  ilName?: string
}

// Leaflet'in default marker icon path bug fix (webpack)
// react-leaflet circle marker kullandığı için kritik değil ama
// ileride DivIcon/Marker kullanırsak gerekli
type LeafletDefaultIconProto = { _getIconUrl?: () => string }
delete (L.Icon.Default.prototype as LeafletDefaultIconProto)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  fires: FirePoint[]
  showWind?: boolean
  windPoints?: WindPoint[]
  showBoundaries?: boolean
  ilStats?: Record<string, IlSummary>
  center?: [number, number]
  zoom?: number
  minZoom?: number
}

function windArrowIcon(speed: number, direction: number, ilName?: string): L.DivIcon {
  // Meteorological "geldiği yön" → gittiği yön için 180° döndür
  const rotation = (direction + 180) % 360
  const opacity = Math.min(0.4 + speed * 0.06, 0.95)
  const stroke = speed >= 8 ? '#E24B4A' : speed >= 4 ? '#EF9F27' : '#9bc5e8'
  // Hız arttıkça çizgi uzar; min 22px, max 48px
  const len = Math.min(22 + speed * 2.6, 48)
  // Çizgi ortalanır; SVG tam ekran içinde ortada
  const width = 56
  const height = 12
  const cy = height / 2
  const x1 = (width - len) / 2
  const x2 = x1 + len

  const html = `
    <div style="transform: rotate(${rotation - 90}deg); transform-origin: center; opacity: ${opacity};" title="${ilName ?? ''} · ${speed.toFixed(1)} m/s">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <line
          class="wind-flow-line"
          x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}"
          stroke="${stroke}" stroke-width="1.6"
          stroke-dasharray="8 6" stroke-linecap="round"
        />
        <polyline
          points="${x2 - 5},${cy - 3} ${x2},${cy} ${x2 - 5},${cy + 3}"
          fill="none" stroke="${stroke}" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round"
        />
      </svg>
    </div>
  `

  return L.divIcon({
    html,
    className: 'wind-arrow-icon',
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  })
}

function formatDateTime(date: string, time: string): string {
  const padded = time.padStart(4, '0')
  const hh = padded.slice(0, 2)
  const mm = padded.slice(2, 4)
  return `${date} ${hh}:${mm} UTC`
}

export default function FireMap({
  fires,
  showWind = false,
  windPoints = [],
  showBoundaries = false,
  ilStats,
  center = [39.0, 35.0],
  zoom = 6,
  minZoom = 5,
}: Props) {
  // Resize fix: Leaflet harita konteyneri boyut hesabı için
  useEffect(() => {
    const t = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={14}
      scrollWheelZoom
      attributionControl={false}
      style={{ height: '100%', width: '100%', background: '#081421' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains={['a', 'b', 'c', 'd']}
      />

      {/* OSM + CARTO attribution zorunlu — sadece "Leaflet" prefix kaldırıldı */}
      <AttributionControl position="bottomright" prefix={false} />

      <MapLegend />

      {showBoundaries && ilStats && <IlBoundariesLayer ilStats={ilStats} />}

      {showWind &&
        windPoints.map((wp, idx) => (
          <Marker
            key={`wind-${idx}`}
            position={[wp.lat, wp.lon]}
            icon={windArrowIcon(wp.speed, wp.direction, wp.ilName)}
            interactive={false}
          />
        ))}

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={45}
      >
        {fires.map((fire, idx) => {
          const color = frpColor(fire.frp)
          const radius = frpRadius(fire.frp)
          const fillOpacity = frpOpacity(fire.frp) * 0.85
          const label = frpLabel(fire.frp)
          const category = frpCategory(fire.frp)
          const key = fire.id ?? `${fire.lat}-${fire.lon}-${fire.acq_date}-${fire.acq_time}-${idx}`

          return (
            <CircleMarker
              key={key}
              center={[fire.lat, fire.lon]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity,
                weight: 1.2,
                opacity: Math.min(fillOpacity + 0.1, 1),
              }}
            >
              <Popup>
                <div style={{ minWidth: 200, fontSize: 12, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: color, marginBottom: 4 }}>
                    {fire.il_name ?? 'Konum Bilinmiyor'}
                  </div>
                  <div
                    style={{
                      padding: '4px 6px',
                      marginBottom: 6,
                      background: color + '22',
                      border: `1px solid ${color}55`,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: color,
                    }}
                  >
                    {label}
                  </div>
                  <div>
                    <strong>Tarih:</strong> {formatDateTime(fire.acq_date, fire.acq_time)}
                  </div>
                  <div>
                    <strong>Uydu:</strong> {formatSatellite(fire.satellite)}
                  </div>
                  <div>
                    <strong>FRP:</strong> {fire.frp?.toFixed?.(1) ?? fire.frp} MW
                  </div>
                  <div>
                    <strong>Güven:</strong>{' '}
                    {fire.confidence === 'h' ? 'Yüksek' : fire.confidence === 'n' ? 'Orta' : 'Düşük'}
                  </div>
                  <div style={{ marginTop: 4, color: '#666' }}>
                    {fire.lat.toFixed(3)}°N, {fire.lon.toFixed(3)}°E
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${fire.lat},${fire.lon}&z=15&t=k`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      padding: '5px 8px',
                      background: '#EF9F27',
                      color: '#1a1a18',
                      fontWeight: 800,
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 11,
                    }}
                  >
                    Uydudan doğrula ↗
                  </a>
                  {category === 'industrial' && (
                    <div style={{ marginTop: 6, fontSize: 10, color: '#888', lineHeight: 1.3 }}>
                      Düşük FRP değeri (&lt;5 MW) genelde anız yakma veya
                      endüstriyel ısı kaynağına işaret eder.
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
