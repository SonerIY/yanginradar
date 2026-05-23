'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { FirePoint } from '@/types'

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
}

function formatDateTime(date: string, time: string): string {
  const padded = time.padStart(4, '0')
  const hh = padded.slice(0, 2)
  const mm = padded.slice(2, 4)
  return `${date} ${hh}:${mm} UTC`
}

export default function FireMap({ fires }: Props) {
  // Resize fix: Leaflet harita konteyneri boyut hesabı için
  useEffect(() => {
    const t = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <MapContainer
      center={[39.0, 35.0]}
      zoom={6}
      minZoom={5}
      maxZoom={14}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', background: '#081421' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains={['a', 'b', 'c', 'd']}
      />

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={45}
      >
        {fires.map((fire, idx) => {
          const isHigh = fire.confidence === 'h'
          const color = isHigh ? '#E24B4A' : '#EF9F27'
          const radius = isHigh ? 8 : 6
          const key = fire.id ?? `${fire.lat}-${fire.lon}-${fire.acq_date}-${fire.acq_time}-${idx}`

          return (
            <CircleMarker
              key={key}
              center={[fire.lat, fire.lon]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 1.2,
                opacity: 0.95,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontSize: 12, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: '#E24B4A', marginBottom: 4 }}>
                    {fire.il_name ?? 'Konum Bilinmiyor'}
                  </div>
                  <div>
                    <strong>Tarih:</strong> {formatDateTime(fire.acq_date, fire.acq_time)}
                  </div>
                  <div>
                    <strong>Uydu:</strong> {fire.satellite}
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
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
