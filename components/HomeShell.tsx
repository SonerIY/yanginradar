'use client'

import { useState } from 'react'
import FireMapClient from './map/FireMapClient'
import StatsPanel from './sidebar/StatsPanel'
import AlertList from './sidebar/AlertList'
import AdSquare from './ads/AdSquare'
import type { FirePoint } from '@/types'
import type { WindPoint } from './map/FireMap'

interface Props {
  fires: FirePoint[]
  windPoints: WindPoint[]
  totalFires: number
  affectedIl: number
  diff: number
}

export default function HomeShell({
  fires,
  windPoints,
  totalFires,
  affectedIl,
  diff,
}: Props) {
  const [showWind, setShowWind] = useState(true)

  return (
    <>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div className="flex-1 min-h-[420px] lg:min-h-0 lg:h-[calc(100vh-180px)] border-y lg:border-y-0 lg:border-r border-[#3f3f3c]">
          <FireMapClient fires={fires} windPoints={windPoints} showWind={showWind} />
        </div>

        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col">
          <StatsPanel totalFires={totalFires} affectedIl={affectedIl} diff={diff} />

          <div className="border-t border-[#3f3f3c]">
            <AdSquare />
          </div>

          <div className="border-t border-[#3f3f3c] flex-1 min-h-0 overflow-y-auto">
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

      <section className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[#262624] border-t border-[#3f3f3c]">
        <b className="text-[#a3a09a] text-sm">Filtreler:</b>
        <button className="min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
          Zaman <strong className="text-[#f4f2ec]">Son 24 saat</strong> ▾
        </button>
        <button className="min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
          Güven <strong className="text-[#f4f2ec]">Yüksek + Orta</strong> ▾
        </button>
        <button className="min-h-9 px-3 text-sm text-[#a3a09a] bg-transparent border border-[#575750] rounded-md">
          Uydu <strong className="text-[#f4f2ec]">VIIRS</strong> ▾
        </button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showWind}
            onChange={(e) => setShowWind(e.target.checked)}
            className="accent-[#30c7a4]"
          />
          Rüzgar katmanı
        </label>
        <label className="flex items-center gap-2 text-sm text-[#64645f]">
          <input type="checkbox" disabled className="accent-[#30c7a4]" />
          Risk haritası (yakında)
        </label>

        <div className="ml-auto text-xs text-[#64645f]">
          Veri kaynağı: NASA FIRMS · 3 saatte bir güncellenir
        </div>
      </section>
    </>
  )
}
