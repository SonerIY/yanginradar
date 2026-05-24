'use client'

import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import L, { type LeafletMouseEvent, type Layer } from 'leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { useRouter } from 'next/navigation'
import { riskColor, riskLabel } from '@/lib/risk'

export interface IlSummary {
  slug: string
  name: string
  fireCountToday: number
  fireCountWeek: number
  riskScore: number
  temperature?: number
  humidity?: number
  windSpeed?: number
}

interface FeatureProps {
  name: string
  number?: number
}

interface Props {
  ilStats: Record<string, IlSummary>
}

const NAME_TO_SLUG_OVERRIDES: Record<string, string> = {
  Afyon: 'afyonkarahisar',
}

function turkishNormalize(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '')
}

function geoNameToSlug(name: string): string {
  if (NAME_TO_SLUG_OVERRIDES[name]) return NAME_TO_SLUG_OVERRIDES[name]
  return turkishNormalize(name)
}

function tooltipBody(s: IlSummary | undefined, fallbackName: string): string {
  if (!s) {
    return `<div class="ilr-tooltip"><strong>${fallbackName}</strong><div class="ilr-row ilr-muted">Veri yok</div></div>`
  }
  const rColor = riskColor(s.riskScore)
  const rLab = riskLabel(s.riskScore)
  const todayLine =
    s.fireCountToday > 0
      ? `<span class="ilr-fire">${s.fireCountToday} aktif tespit</span>`
      : `<span class="ilr-clear">temiz</span>`
  const weatherLine =
    s.temperature !== undefined
      ? `${s.temperature.toFixed(0)}°C · %${s.humidity?.toFixed(0) ?? '—'} nem · ${s.windSpeed?.toFixed(1) ?? '—'} m/s`
      : 'Hava verisi yok'

  return `
    <div class="ilr-tooltip">
      <div class="ilr-head">${s.name}</div>
      <div class="ilr-row"><span class="ilr-label">Bugün:</span> ${todayLine}</div>
      <div class="ilr-row"><span class="ilr-label">7 günde:</span> <strong>${s.fireCountWeek}</strong></div>
      <div class="ilr-row ilr-risk" style="border-color:${rColor}33; background:${rColor}1a;">
        <span class="ilr-label">Risk:</span>
        <strong style="color:${rColor};">${s.riskScore}/100 · ${rLab}</strong>
      </div>
      <div class="ilr-row ilr-weather">${weatherLine}</div>
    </div>
  `
}

function popupBody(s: IlSummary | undefined, fallbackName: string, slug: string): string {
  const body = tooltipBody(s, fallbackName)
  // Mobil popup içine sayfa linki ekleniyor — tooltip versiyonunda yok
  return body.replace(
    '</div>\n    </div>',
    `</div>
      <a href="/il/${slug}" class="ilr-popup-link">Detayları gör →</a>
    </div>`,
  )
}

function getFeatureStyle(slug: string, ilStats: Record<string, IlSummary>) {
  const s = ilStats[slug]
  if (!s) {
    return {
      color: '#3f3f3c',
      weight: 0.7,
      opacity: 0.6,
      fillColor: '#171716',
      fillOpacity: 0.05,
    }
  }
  const fillColor = riskColor(s.riskScore)
  const fillOpacity = 0.05 + Math.min(s.riskScore / 100, 1) * 0.32
  return {
    color: '#555550',
    weight: 0.8,
    opacity: 0.7,
    fillColor,
    fillOpacity,
  }
}

export default function IlBoundariesLayer({ ilStats }: Props) {
  const router = useRouter()
  const [data, setData] = useState<FeatureCollection | null>(null)
  // Dokunmatik cihaz tespiti — hem L.Browser.mobile hem media query
  const isTouch =
    typeof window !== 'undefined' &&
    (L.Browser.mobile ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches)

  useEffect(() => {
    let cancelled = false
    fetch('/turkey-il.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json as FeatureCollection)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) return null

  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        if (!feature) return {}
        const name = (feature.properties as FeatureProps).name
        return getFeatureStyle(geoNameToSlug(name), ilStats)
      }}
      onEachFeature={(feature: Feature<Geometry, FeatureProps>, layer: Layer) => {
        const fname = feature.properties.name
        const slug = geoNameToSlug(fname)
        const summary = ilStats[slug]

        if (isTouch) {
          // Mobil: tap ile popup aç; popup içinde <a> ile sayfaya git
          layer.bindPopup(popupBody(summary, fname, slug), {
            className: 'ilr-popup-wrap',
            closeButton: true,
            autoPan: true,
            maxWidth: 280,
          })
        } else {
          // Desktop: hover tooltip + click → router navigate
          const tooltip = L.tooltip({
            direction: 'top',
            sticky: true,
            opacity: 1,
            className: 'ilr-tooltip-wrap',
          }).setContent(tooltipBody(summary, fname) + '<div class="ilr-foot">Tıkla →</div>')

          layer.bindTooltip(tooltip)

          layer.on('mouseover', (e: LeafletMouseEvent) => {
            const l = e.target as L.Path
            l.setStyle({
              color: '#EF9F27',
              weight: 1.6,
              opacity: 1,
              fillOpacity: Math.min(
                (getFeatureStyle(slug, ilStats).fillOpacity as number) + 0.18,
                0.95,
              ),
            })
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront()
            }
          })
          layer.on('mouseout', (e: LeafletMouseEvent) => {
            const l = e.target as L.Path
            l.setStyle(getFeatureStyle(slug, ilStats))
          })
          layer.on('click', () => {
            router.push(`/il/${slug}`)
          })
        }
      }}
    />
  )
}
