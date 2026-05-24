'use client'

import { useMemo, useState } from 'react'
import FireMapClient from './map/FireMapClient'
import StatsPanel from './sidebar/StatsPanel'
import AlertList from './sidebar/AlertList'
import AdSquare from './ads/AdSquare'
import FilterDropdown from './ui/FilterDropdown'
import NewsList from './news/NewsList'
import type { FirePoint, NewsItem } from '@/types'
import type { WindPoint } from './map/FireMap'
import type { IlSummary } from './map/IlBoundariesLayer'

interface Props {
  fires: FirePoint[]
  windPoints: WindPoint[]
  ilStats: Record<string, IlSummary>
  countryNews: NewsItem[]
  totalFires: number
  affectedIl: number
  diff: number
}

const TIME_OPTIONS = [
  { value: '24h', label: 'Son 24 saat' },
  { value: '12h', label: 'Son 12 saat' },
  { value: '6h', label: 'Son 6 saat' },
  { value: '1h', label: 'Son 1 saat' },
]

const CONF_OPTIONS = [
  { value: 'hn', label: 'Yüksek + Orta' },
  { value: 'h', label: 'Sadece Yüksek' },
]

const SAT_OPTIONS = [{ value: 'viirs', label: 'VIIRS' }]

function fireTimestamp(f: FirePoint): number {
  const t = (f.acq_time || '0000').toString().padStart(4, '0')
  const iso = `${f.acq_date}T${t.slice(0, 2)}:${t.slice(2, 4)}:00Z`
  const ts = new Date(iso).getTime()
  return Number.isFinite(ts) ? ts : 0
}

export default function HomeShell({
  fires,
  windPoints,
  ilStats,
  countryNews,
  totalFires,
  affectedIl,
  diff,
}: Props) {
  const [showWind, setShowWind] = useState(true)
  const [showBoundaries, setShowBoundaries] = useState(true)
  const [timeFilter, setTimeFilter] = useState('24h')
  const [confFilter, setConfFilter] = useState('hn')

  const filteredFires = useMemo(() => {
    const hours =
      { '24h': 24, '12h': 12, '6h': 6, '1h': 1 }[timeFilter] ?? 24
    const cutoff = Date.now() - hours * 3600 * 1000
    return fires.filter((f) => {
      // Time
      const ts = fireTimestamp(f)
      if (ts > 0 && ts < cutoff) return false
      // Confidence
      if (confFilter === 'h' && f.confidence !== 'h') return false
      return true
    })
  }, [fires, timeFilter, confFilter])

  // Filtre sonrası canlı istatistikler
  const visibleCount = filteredFires.length
  const visibleAffectedIl = useMemo(
    () => new Set(filteredFires.map((f) => f.il_slug).filter(Boolean)).size,
    [filteredFires],
  )

  return (
    <>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div className="h-[65vh] min-h-[360px] lg:h-[calc(100vh-180px)] lg:flex-1 lg:min-h-0 border-y lg:border-y-0 lg:border-r border-[#3f3f3c]">
          <FireMapClient
            fires={filteredFires}
            windPoints={windPoints}
            showWind={showWind}
            showBoundaries={showBoundaries}
            ilStats={ilStats}
          />
        </div>

        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col lg:overflow-hidden lg:h-[calc(100vh-180px)]">
          <StatsPanel
            totalFires={visibleCount}
            affectedIl={visibleAffectedIl}
            diff={timeFilter === '24h' && confFilter === 'hn' ? diff : 0}
          />

          <div className="border-t border-[#3f3f3c]">
            <AdSquare />
          </div>

          {countryNews.length > 0 && (
            <div className="border-t border-[#3f3f3c]">
              <header className="px-3 py-2 text-[11px] uppercase font-extrabold text-[#a3a09a] flex items-center justify-between">
                <span>📰 Türkiye Geneli</span>
                <span className="text-[10px] text-[#64645f] normal-case font-normal">Google News</span>
              </header>
              <NewsList items={countryNews} compact max={4} />
            </div>
          )}

          <div className="border-t border-[#3f3f3c] lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <AlertList fires={filteredFires} />
          </div>

          <div className="border-t border-[#3f3f3c] p-3">
            <button
              type="button"
              className="w-full min-h-11 text-[#f4f2ec] bg-transparent border border-[#64645f] rounded-lg font-extrabold hover:bg-[#30302d]"
            >
              ♧ Bildirim aboneliği (yakında)
            </button>
          </div>
        </aside>
      </div>

      {/* Filter bar — gerçek dropdown'lar */}
      <section className="bg-[#262624] border-t border-[#3f3f3c]">
        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap">
          <b className="text-[#a3a09a] text-sm shrink-0">Filtreler:</b>

          <FilterDropdown
            label="Zaman"
            options={TIME_OPTIONS}
            value={timeFilter}
            onChange={setTimeFilter}
          />
          <FilterDropdown
            label="Güven"
            options={CONF_OPTIONS}
            value={confFilter}
            onChange={setConfFilter}
          />
          <FilterDropdown
            label="Uydu"
            options={SAT_OPTIONS}
            value="viirs"
            onChange={() => {}}
            disabled
          />

          <label className="shrink-0 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showWind}
              onChange={(e) => setShowWind(e.target.checked)}
              className="accent-[#30c7a4]"
            />
            Rüzgâr katmanı
          </label>
          <label className="shrink-0 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showBoundaries}
              onChange={(e) => setShowBoundaries(e.target.checked)}
              className="accent-[#30c7a4]"
            />
            İl risk haritası
          </label>

          {(timeFilter !== '24h' || confFilter !== 'hn') && (
            <button
              type="button"
              onClick={() => {
                setTimeFilter('24h')
                setConfFilter('hn')
              }}
              className="shrink-0 text-xs text-[#EF9F27] hover:underline"
            >
              ↺ Sıfırla
            </button>
          )}

          <div className="hidden md:block ml-auto text-xs text-[#64645f] shrink-0">
            Veri kaynağı: NASA FIRMS · 3 saatte bir güncellenir
          </div>
        </div>
      </section>
    </>
  )
}
