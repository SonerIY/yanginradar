'use client'

import { useState } from 'react'
import FireMapClient from './map/FireMapClient'
import StatsPanel from './sidebar/StatsPanel'
import AlertList from './sidebar/AlertList'
import AdSquare from './ads/AdSquare'
import type { FirePoint } from '@/types'
import type { WindPoint } from './map/FireMap'
import type { IlSummary } from './map/IlBoundariesLayer'

interface Props {
  fires: FirePoint[]
  windPoints: WindPoint[]
  ilStats: Record<string, IlSummary>
  totalFires: number
  affectedIl: number
  diff: number
}

export default function HomeShell({
  fires,
  windPoints,
  ilStats,
  totalFires,
  affectedIl,
  diff,
}: Props) {
  const [showWind, setShowWind] = useState(true)
  const [showBoundaries, setShowBoundaries] = useState(true)

  return (
    <>
      {/* Dashboard — mobilde dikey, lg ve üzeri yan yana */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/*
          Mobilde harita için SABİT yükseklik gerek — Leaflet parent'ın gerçek
          yüksekliğini alamazsa render etmez. lg'de viewport'a fit ediyoruz.
        */}
        <div className="h-[65vh] min-h-[360px] lg:h-[calc(100vh-180px)] lg:flex-1 lg:min-h-0 border-y lg:border-y-0 lg:border-r border-[#3f3f3c]">
          <FireMapClient
            fires={fires}
            windPoints={windPoints}
            showWind={showWind}
            showBoundaries={showBoundaries}
            ilStats={ilStats}
          />
        </div>

        {/*
          Sidebar mobilde içerik akışı doğal (AlertList flex-1 değil,
          sayfanın doğal scroll'una bırakılır).
          lg'de yine sticky sidebar + AlertList scroll bağımsız.
        */}
        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col lg:overflow-hidden lg:h-[calc(100vh-180px)]">
          <StatsPanel totalFires={totalFires} affectedIl={affectedIl} diff={diff} />

          <div className="border-t border-[#3f3f3c]">
            <AdSquare />
          </div>

          <div className="border-t border-[#3f3f3c] lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <AlertList fires={fires} />
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

      {/* Filter bar — mobilde yatay scroll (whitespace-nowrap) */}
      <section className="bg-[#262624] border-t border-[#3f3f3c]">
        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap">
          <b className="text-[#a3a09a] text-sm shrink-0">Filtreler:</b>
          <button className="shrink-0 min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
            Zaman <strong className="text-[#f4f2ec]">Son 24 saat</strong> ▾
          </button>
          <button className="shrink-0 min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
            Güven <strong className="text-[#f4f2ec]">Yüksek + Orta</strong> ▾
          </button>
          <button className="shrink-0 min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
            Uydu <strong className="text-[#f4f2ec]">VIIRS</strong> ▾
          </button>
          <label className="shrink-0 flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showWind}
              onChange={(e) => setShowWind(e.target.checked)}
              className="accent-[#30c7a4]"
            />
            Rüzgar katmanı
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

          <div className="hidden md:block ml-auto text-xs text-[#64645f] shrink-0">
            Veri kaynağı: NASA FIRMS · 3 saatte bir güncellenir
          </div>
        </div>
      </section>
    </>
  )
}
