'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/**
 * Haritanın sol-alt köşesine sabit bir lejant ekler.
 * Harita ile birlikte hareket eder (L.Control), zoom kontrollerinin altında.
 */
export default function MapLegend() {
  const map = useMap()

  useEffect(() => {
    const ControlClass = L.Control.extend({})
    const legend = new ControlClass({ position: 'bottomleft' })

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend')
      div.innerHTML = `
        <button class="map-legend-toggle" type="button" aria-label="Lejantı aç/kapat">
          <span class="map-legend-toggle-icon">ⓘ</span>
          <span class="map-legend-toggle-text">Lejant</span>
        </button>

        <div class="map-legend-body">
          <div class="ml-section">
            <div class="ml-title">Yangın noktaları</div>
            <div class="ml-row"><span class="ml-dot" style="background:#E24B4A;"></span>Yüksek güven</div>
            <div class="ml-row"><span class="ml-dot" style="background:#EF9F27;"></span>Orta güven</div>
          </div>

          <div class="ml-section">
            <div class="ml-title">Rüzgâr (m/s)</div>
            <div class="ml-row"><span class="ml-bar" style="background:#9bc5e8;"></span>0–4 · zayıf</div>
            <div class="ml-row"><span class="ml-bar" style="background:#EF9F27;"></span>4–8 · orta</div>
            <div class="ml-row"><span class="ml-bar" style="background:#E24B4A;"></span>8+ · kuvvetli</div>
            <div class="ml-foot">Çizgi yöne ve hıza göre, hızlandıkça uzar ve akar</div>
          </div>

          <div class="ml-section">
            <div class="ml-title">İl risk dolgusu</div>
            <div class="ml-gradient">
              <span style="background:#66C36A;"></span>
              <span style="background:#E8C84A;"></span>
              <span style="background:#EF9F27;"></span>
              <span style="background:#E24B4A;"></span>
            </div>
            <div class="ml-scale"><span>düşük</span><span>aşırı</span></div>
          </div>
        </div>
      `

      // Click/scroll event'leri haritaya geçmesin
      L.DomEvent.disableClickPropagation(div)
      L.DomEvent.disableScrollPropagation(div)

      // Toggle (mobil-friendly): toggle butonu collapse/expand
      const btn = div.querySelector('.map-legend-toggle')
      btn?.addEventListener('click', () => {
        div.classList.toggle('collapsed')
      })

      // Küçük ekranda varsayılan kapalı
      if (window.matchMedia('(max-width: 640px)').matches) {
        div.classList.add('collapsed')
      }

      return div
    }

    legend.addTo(map)
    return () => {
      legend.remove()
    }
  }, [map])

  return null
}
