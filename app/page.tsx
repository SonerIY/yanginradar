import FireMapClient from '@/components/map/FireMapClient'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import AdSquare from '@/components/ads/AdSquare'
import StatsPanel from '@/components/sidebar/StatsPanel'
import AlertList from '@/components/sidebar/AlertList'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { FirePoint } from '@/types'

export const revalidate = 0

async function fetchFiresFromSupabase(): Promise<{
  today: FirePoint[]
  yesterdayCount: number
}> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { today: [], yesterdayCount: 0 }
  }

  try {
    const supabase = createServerSupabaseClient()
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const { data: todayData } = await supabase
      .from('fires')
      .select('id,lat,lon,brightness,confidence,acq_date,acq_time,satellite,frp,il_slug,il_name')
      .gte('acq_date', today)
      .in('confidence', ['h', 'n'])
      .order('acq_time', { ascending: false })
      .limit(2000)

    const { count: yesterdayCount } = await supabase
      .from('fires')
      .select('id', { count: 'exact', head: true })
      .eq('acq_date', yesterday)
      .in('confidence', ['h', 'n'])

    return {
      today: (todayData ?? []) as FirePoint[],
      yesterdayCount: yesterdayCount ?? 0,
    }
  } catch {
    return { today: [], yesterdayCount: 0 }
  }
}

function formatUpdated(): string {
  const now = new Date()
  const hh = now.getUTCHours().toString().padStart(2, '0')
  const mm = now.getUTCMinutes().toString().padStart(2, '0')
  return `${hh}:${mm} UTC`
}

export default async function HomePage() {
  const { today, yesterdayCount } = await fetchFiresFromSupabase()

  const totalFires = today.length
  const affectedIl = new Set(today.map((f) => f.il_slug).filter(Boolean)).size
  const diff = totalFires - yesterdayCount

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar updatedAt={formatUpdated()} />
      <AdLeaderboard />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Harita */}
        <div className="flex-1 min-h-[420px] lg:min-h-0 lg:h-[calc(100vh-180px)] border-y lg:border-y-0 lg:border-r border-[#3f3f3c]">
          <FireMapClient fires={today} />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col">
          <StatsPanel totalFires={totalFires} affectedIl={affectedIl} diff={diff} />

          <div className="border-t border-[#3f3f3c]">
            <AdSquare />
          </div>

          <div className="border-t border-[#3f3f3c] flex-1 min-h-0 overflow-y-auto">
            <AlertList fires={today} />
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

      {/* Filter bar */}
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="accent-[#30c7a4]" />
          Rüzgar katmanı
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[#30c7a4]" />
          Risk haritası
        </label>

        <div className="ml-auto text-xs text-[#64645f]">
          Veri kaynağı: NASA FIRMS · 3 saatte bir güncellenir
        </div>
      </section>
    </main>
  )
}
