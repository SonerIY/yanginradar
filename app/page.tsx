import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import HomeShell from '@/components/HomeShell'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchBulkCurrentWeather } from '@/lib/weather'
import { IL_LIST } from '@/lib/il-data'
import type { FirePoint } from '@/types'
import type { WindPoint } from '@/components/map/FireMap'

export const revalidate = 600 // 10 dk cache

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

async function fetchWindForAllIls(): Promise<WindPoint[]> {
  try {
    const weather = await fetchBulkCurrentWeather(
      IL_LIST.map((il) => ({ lat: il.lat, lon: il.lon })),
    )
    const points: WindPoint[] = []
    for (let i = 0; i < IL_LIST.length; i++) {
      const w = weather[i]
      if (!w) continue
      points.push({
        lat: IL_LIST[i].lat,
        lon: IL_LIST[i].lon,
        speed: w.windSpeed,
        direction: w.windDirection,
        ilName: IL_LIST[i].name,
      })
    }
    return points
  } catch {
    return []
  }
}

function formatUpdated(): string {
  const now = new Date()
  return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`
}

export default async function HomePage() {
  const [{ today, yesterdayCount }, windPoints] = await Promise.all([
    fetchFiresFromSupabase(),
    fetchWindForAllIls(),
  ])

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
        totalFires={totalFires}
        affectedIl={affectedIl}
        diff={diff}
      />
    </main>
  )
}
