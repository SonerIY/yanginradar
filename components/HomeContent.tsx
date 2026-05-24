import HomeShell from './HomeShell'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchBulkCurrentWeather } from '@/lib/weather'
import { getCountryWideFireNews } from '@/lib/news-server'
import { IL_LIST } from '@/lib/il-data'
import type { FirePoint, WeatherData } from '@/types'
import type { WindPoint } from './map/FireMap'
import type { IlSummary } from './map/IlBoundariesLayer'

interface RegionStatRow {
  il_slug: string
  il_name: string
  fire_count_today: number
  fire_count_week: number
  risk_score: number
}

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

async function fetchRegionStats(): Promise<Record<string, RegionStatRow>> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {}
  }
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('region_stats')
      .select('il_slug, il_name, fire_count_today, fire_count_week, risk_score')
    const map: Record<string, RegionStatRow> = {}
    for (const row of (data ?? []) as RegionStatRow[]) {
      map[row.il_slug] = row
    }
    return map
  } catch {
    return {}
  }
}

function buildIlSummaryMap(
  weather: Array<WeatherData | null>,
  regionStats: Record<string, RegionStatRow>,
): { ilStats: Record<string, IlSummary>; windPoints: WindPoint[] } {
  const ilStats: Record<string, IlSummary> = {}
  const windPoints: WindPoint[] = []
  for (let i = 0; i < IL_LIST.length; i++) {
    const il = IL_LIST[i]
    const w = weather[i]
    const stat = regionStats[il.slug]
    ilStats[il.slug] = {
      slug: il.slug,
      name: il.name,
      fireCountToday: stat?.fire_count_today ?? 0,
      fireCountWeek: stat?.fire_count_week ?? 0,
      riskScore: stat?.risk_score ?? 0,
      temperature: w?.temperature,
      humidity: w?.humidity,
      windSpeed: w?.windSpeed,
    }
    if (w) {
      windPoints.push({
        lat: il.lat,
        lon: il.lon,
        speed: w.windSpeed,
        direction: w.windDirection,
        ilName: il.name,
      })
    }
  }
  return { ilStats, windPoints }
}

/**
 * Asıl veri-bağımlı içerik. Bu component <Suspense> içinde render edilir;
 * yüklenirken üst seviye HomeContentSkeleton görünür.
 */
export default async function HomeContent() {
  const [{ today, yesterdayCount }, weather, regionStats, countryNews] = await Promise.all([
    fetchFiresFromSupabase(),
    fetchBulkCurrentWeather(IL_LIST.map((il) => ({ lat: il.lat, lon: il.lon }))),
    fetchRegionStats(),
    getCountryWideFireNews(6),
  ])

  const { ilStats, windPoints } = buildIlSummaryMap(weather, regionStats)
  const totalFires = today.length
  const affectedIl = new Set(today.map((f) => f.il_slug).filter(Boolean)).size
  const diff = totalFires - yesterdayCount

  return (
    <HomeShell
      fires={today}
      windPoints={windPoints}
      ilStats={ilStats}
      countryNews={countryNews}
      totalFires={totalFires}
      affectedIl={affectedIl}
      diff={diff}
    />
  )
}

/**
 * Suspense fallback — Navbar + Ad zaten parent'ta render edilir, biz
 * sadece dashboard alanını iskelet olarak çiziyoruz.
 */
export function HomeContentSkeleton() {
  return (
    <>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Harita iskeleti */}
        <div className="h-[65vh] min-h-[360px] lg:h-[calc(100vh-180px)] lg:flex-1 lg:min-h-0 border-y lg:border-y-0 lg:border-r border-[#3f3f3c] bg-[#081421] flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#315370] text-sm font-bold">
            <div className="w-5 h-5 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
            Harita ve canlı veri yükleniyor…
          </div>
        </div>

        {/* Sidebar iskeleti */}
        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col lg:h-[calc(100vh-180px)]">
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="h-20 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
            <div className="h-20 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
            <div className="col-span-2 h-16 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
          </div>
          <div className="border-t border-[#3f3f3c] flex items-center justify-center py-3">
            <div className="w-[300px] max-w-full h-[250px] bg-[#1a1a18] border border-[#3f3f3c] flex items-center justify-center text-[10px] text-[#3f3f3c] uppercase tracking-widest">
              Reklam · 300×250
            </div>
          </div>
          <div className="border-t border-[#3f3f3c] p-3 space-y-2">
            <div className="h-12 bg-[#30302d] rounded animate-pulse" />
            <div className="h-12 bg-[#30302d] rounded animate-pulse" />
            <div className="h-12 bg-[#30302d] rounded animate-pulse" />
          </div>
        </aside>
      </div>

      {/* Filter bar iskeleti — düzgün yükseklik, içerik yok */}
      <div className="bg-[#262624] border-t border-[#3f3f3c] h-14" />
    </>
  )
}
