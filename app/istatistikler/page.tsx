import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import Last30DaysChart from '@/components/charts/Last30DaysChart'
import NewsList from '@/components/news/NewsList'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getRecentArchivedNews } from '@/lib/news-server'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Türkiye Orman Yangını İstatistikleri (Son 30 Gün) | YangınRadar',
  description:
    "Son 30 günde Türkiye'deki günlük orman yangını tespit sayısı, en çok etkilenen iller, haftalık karşılaştırma. NASA FIRMS uydu verisi.",
  alternates: { canonical: 'https://yanginradar.com/istatistikler' },
}

interface FireRow {
  acq_date: string
  il_slug: string | null
  il_name: string | null
  confidence: 'h' | 'n' | 'l'
}

interface AggregateStats {
  daily: Array<{ date: string; count: number }>
  topIller: Array<{ slug: string; name: string; count: number }>
  thisWeek: number
  lastWeek: number
  total30d: number
  highCount: number
  nominalCount: number
}

async function fetchStats(): Promise<AggregateStats> {
  const empty: AggregateStats = {
    daily: [],
    topIller: [],
    thisWeek: 0,
    lastWeek: 0,
    total30d: 0,
    highCount: 0,
    nominalCount: 0,
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return empty
  }

  try {
    const supabase = createServerSupabaseClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const { data } = await supabase
      .from('fires')
      .select('acq_date, il_slug, il_name, confidence')
      .gte('acq_date', thirtyDaysAgo)
      .in('confidence', ['h', 'n'])
      .limit(50000)

    const rows = (data ?? []) as FireRow[]

    // Günlük gruplama — son 30 gün için doldur (yok ise 0)
    const byDate: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      byDate[d] = 0
    }
    for (const row of rows) {
      if (byDate[row.acq_date] !== undefined) {
        byDate[row.acq_date]++
      }
    }
    const daily = Object.entries(byDate).map(([date, count]) => ({
      date: date.slice(5), // "MM-DD"
      count,
    }))

    // İl bazlı top 10
    const byIl: Record<string, { name: string; count: number }> = {}
    for (const row of rows) {
      if (!row.il_slug || !row.il_name) continue
      if (!byIl[row.il_slug]) byIl[row.il_slug] = { name: row.il_name, count: 0 }
      byIl[row.il_slug].count++
    }
    const topIller = Object.entries(byIl)
      .map(([slug, { name, count }]) => ({ slug, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Bu hafta vs geçen hafta
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    let thisWeek = 0
    let lastWeek = 0
    let highCount = 0
    let nominalCount = 0
    for (const row of rows) {
      if (row.acq_date >= sevenDaysAgo) thisWeek++
      else if (row.acq_date >= fourteenDaysAgo) lastWeek++
      if (row.confidence === 'h') highCount++
      else if (row.confidence === 'n') nominalCount++
    }

    return {
      daily,
      topIller,
      thisWeek,
      lastWeek,
      total30d: rows.length,
      highCount,
      nominalCount,
    }
  } catch {
    return empty
  }
}

export default async function StatsPage() {
  const [stats, recentNews] = await Promise.all([
    fetchStats(),
    getRecentArchivedNews(6),
  ])
  const diff = stats.thisWeek - stats.lastWeek
  const diffPct = stats.lastWeek > 0 ? Math.round((diff / stats.lastWeek) * 100) : 0
  const diffPositive = diff > 0

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar updatedAt={new Date().toISOString().slice(11, 16) + ' UTC'} />
      <AdLeaderboard />

      <div className="max-w-6xl w-full mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#f4f2ec]">
            Türkiye Orman Yangını İstatistikleri
          </h1>
          <p className="mt-2 text-sm text-[#a3a09a]">
            Son 30 günün NASA FIRMS verisi · 3 saatte bir güncellenir
          </p>
        </header>

        {/* Üst kartlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">30 Gün Toplam</div>
            <div className="text-2xl font-bold text-[#f4f2ec] mt-1">{stats.total30d}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Bu Hafta</div>
            <div className="text-2xl font-bold text-[#E24B4A] mt-1">{stats.thisWeek}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Geçen Hafta</div>
            <div className="text-2xl font-bold text-[#a3a09a] mt-1">{stats.lastWeek}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Haftalık Fark</div>
            <div
              className={`text-2xl font-bold mt-1 ${diffPositive ? 'text-[#E24B4A]' : diff < 0 ? 'text-[#30c7a4]' : 'text-[#a3a09a]'}`}
            >
              {diffPositive ? '▲ +' : diff < 0 ? '▼ ' : ''}
              {Math.abs(diff)}
              {stats.lastWeek > 0 && (
                <span className="text-sm text-[#64645f] ml-1">({diffPct > 0 ? '+' : ''}{diffPct}%)</span>
              )}
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <section className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4 mb-6">
          <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
            Son 30 Gün Trendi
          </h2>
          {stats.daily.length === 0 || stats.total30d === 0 ? (
            <div className="h-72 flex items-center justify-center text-[#64645f] text-sm">
              Son 30 günde tespit yok.
            </div>
          ) : (
            <Last30DaysChart data={stats.daily} />
          )}
        </section>

        {/* Top 10 il + Confidence dağılımı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
              Son 30 Günde En Çok Etkilenen 10 İl
            </h2>
            {stats.topIller.length === 0 ? (
              <div className="text-sm text-[#64645f]">Veri yok.</div>
            ) : (
              <ol className="space-y-2">
                {stats.topIller.map((il, idx) => {
                  const max = stats.topIller[0].count
                  const pct = (il.count / max) * 100
                  return (
                    <li key={il.slug}>
                      <Link
                        href={`/il/${il.slug}`}
                        className="flex items-center gap-3 hover:bg-[#30302d] rounded px-2 py-2 transition"
                      >
                        <span className="text-xs font-bold text-[#64645f] w-5">
                          {idx + 1}.
                        </span>
                        <span className="text-sm text-[#f4f2ec] font-bold w-32 truncate">
                          {il.name}
                        </span>
                        <div className="flex-1 h-2 bg-[#1a1a18] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#EF9F27] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#E24B4A] font-bold w-10 text-right">
                          {il.count}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          <section className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
              Güven Dağılımı
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#E24B4A] font-bold">Yüksek güven</span>
                  <span className="text-[#f4f2ec] font-bold">{stats.highCount}</span>
                </div>
                <div className="h-3 bg-[#1a1a18] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E24B4A] rounded-full"
                    style={{
                      width: `${stats.total30d > 0 ? (stats.highCount / stats.total30d) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#EF9F27] font-bold">Orta güven</span>
                  <span className="text-[#f4f2ec] font-bold">{stats.nominalCount}</span>
                </div>
                <div className="h-3 bg-[#1a1a18] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#EF9F27] rounded-full"
                    style={{
                      width: `${stats.total30d > 0 ? (stats.nominalCount / stats.total30d) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-[#64645f] mt-4 leading-relaxed">
                NASA VIIRS uydusu her tespit için bir güven seviyesi atar. Düşük güvenli tespitler
                (l) filtrelenir; yüksek (h) ve orta (n) güvenli noktalar haritada gösterilir.
              </p>
            </div>
          </section>
        </div>

        {/* Bu hafta öne çıkan haberler — Supabase arşivinden */}
        {recentNews.length > 0 && (
          <section className="mt-6 bg-[#262624] border border-[#3f3f3c] rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-[#3f3f3c]">
              <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase">
                📰 Son Eklenen Haberler
              </h2>
              <div className="text-xs text-[#a3a09a] mt-1">
                Tüm illerin arşivinden en yeni 6 haber
              </div>
            </header>
            <NewsList items={recentNews} max={6} />
          </section>
        )}
      </div>
    </main>
  )
}
