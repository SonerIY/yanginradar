import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import HomeShell from '@/components/HomeShell'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchBulkCurrentWeather } from '@/lib/weather'
import { getCountryWideFireNews } from '@/lib/news-server'
import { IL_LIST } from '@/lib/il-data'
import type { FirePoint, WeatherData } from '@/types'
import type { WindPoint } from '@/components/map/FireMap'
import type { IlSummary } from '@/components/map/IlBoundariesLayer'

export const revalidate = 600

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

interface RegionStatRow {
  il_slug: string
  il_name: string
  fire_count_today: number
  fire_count_week: number
  risk_score: number
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

function formatUpdated(): string {
  const now = new Date()
  return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`
}

export default async function HomePage() {
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
    <main className="flex flex-col min-h-screen">
      <Navbar updatedAt={formatUpdated()} />
      <AdLeaderboard />
      <HomeShell
        fires={today}
        windPoints={windPoints}
        ilStats={ilStats}
        countryNews={countryNews}
        totalFires={totalFires}
        affectedIl={affectedIl}
        diff={diff}
      />
    </main>
  )
}
