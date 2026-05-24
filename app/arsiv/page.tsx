import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import AdInArticle from '@/components/ads/AdInArticle'
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart'
import { createServerSupabaseClient } from '@/lib/supabase'

export const revalidate = 3600 // 1 saat

const CURRENT_YEAR = new Date().getUTCFullYear()
const MONTH_LABELS = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
]

export const metadata: Metadata = {
  title: `${CURRENT_YEAR} Türkiye Orman Yangını Arşivi | YangınRadar`,
  description: `${CURRENT_YEAR} yılında Türkiye'de NASA uydularıyla tespit edilen orman yangınlarının aylık trendi, en çok etkilenen iller ve yıllık özet.`,
  alternates: { canonical: 'https://yanginradar.com/arsiv' },
  openGraph: {
    title: `${CURRENT_YEAR} Türkiye Orman Yangını Arşivi`,
    description: `Aylık trend, en çok etkilenen iller, NASA FIRMS verisi.`,
    type: 'article',
    locale: 'tr_TR',
    url: 'https://yanginradar.com/arsiv',
  },
}

interface FireRow {
  acq_date: string
  il_slug: string | null
  il_name: string | null
  confidence: 'h' | 'n' | 'l'
}

interface YearStats {
  monthly: Array<{ month: string; count: number }>
  topIller: Array<{ slug: string; name: string; count: number }>
  total: number
  highCount: number
  nominalCount: number
  earliestDate: string | null
}

async function fetchYearStats(year: number): Promise<YearStats> {
  const empty: YearStats = {
    monthly: MONTH_LABELS.map((m) => ({ month: m, count: 0 })),
    topIller: [],
    total: 0,
    highCount: 0,
    nominalCount: 0,
    earliestDate: null,
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return empty
  }

  try {
    const supabase = createServerSupabaseClient()
    const start = `${year}-01-01`
    const end = `${year}-12-31`

    const { data } = await supabase
      .from('fires')
      .select('acq_date, il_slug, il_name, confidence')
      .gte('acq_date', start)
      .lte('acq_date', end)
      .in('confidence', ['h', 'n'])
      .limit(50000)

    const rows = (data ?? []) as FireRow[]

    // Aylık gruplama
    const byMonth: number[] = Array(12).fill(0)
    const byIl: Record<string, { name: string; count: number }> = {}
    let earliest = ''
    let highCount = 0
    let nominalCount = 0

    for (const row of rows) {
      const monthIdx = Number(row.acq_date.slice(5, 7)) - 1
      if (monthIdx >= 0 && monthIdx < 12) byMonth[monthIdx]++

      if (row.il_slug && row.il_name) {
        if (!byIl[row.il_slug]) byIl[row.il_slug] = { name: row.il_name, count: 0 }
        byIl[row.il_slug].count++
      }

      if (row.confidence === 'h') highCount++
      else if (row.confidence === 'n') nominalCount++

      if (!earliest || row.acq_date < earliest) earliest = row.acq_date
    }

    return {
      monthly: MONTH_LABELS.map((m, i) => ({ month: m, count: byMonth[i] })),
      topIller: Object.entries(byIl)
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      total: rows.length,
      highCount,
      nominalCount,
      earliestDate: earliest || null,
    }
  } catch {
    return empty
  }
}

function tr(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export default async function ArchivePage() {
  const stats = await fetchYearStats(CURRENT_YEAR)

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <AdLeaderboard />

      <div className="max-w-6xl w-full mx-auto px-4 py-6">
        <header className="mb-6">
          <nav className="text-xs text-[#a3a09a] mb-3">
            <Link href="/" className="hover:text-[#f4f2ec]">Ana sayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-[#f4f2ec]">Arşiv</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#f4f2ec]">
            {CURRENT_YEAR} Yılı Orman Yangını Arşivi
          </h1>
          <p className="mt-2 text-sm text-[#a3a09a]">
            NASA FIRMS uydularıyla tespit edilen yüksek + orta güvenli ısı noktalarının
            yıllık aylık özeti.{' '}
            {stats.earliestDate && (
              <>İlk kayıt: <strong className="text-[#EF9F27]">{tr(stats.earliestDate)}</strong>.</>
            )}
          </p>
        </header>

        {/* Üst kartlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Yıl Toplam</div>
            <div className="text-2xl font-bold text-[#f4f2ec] mt-1">{stats.total}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Yüksek Güven</div>
            <div className="text-2xl font-bold text-[#E24B4A] mt-1">{stats.highCount}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Orta Güven</div>
            <div className="text-2xl font-bold text-[#EF9F27] mt-1">{stats.nominalCount}</div>
          </div>
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Etkilenen İl</div>
            <div className="text-2xl font-bold text-[#f4f2ec] mt-1">{stats.topIller.length}</div>
          </div>
        </div>

        {/* Aylık chart */}
        <section className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4 mb-6">
          <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
            {CURRENT_YEAR} Aylık Trend
          </h2>
          {stats.total === 0 ? (
            <div className="h-72 flex items-center justify-center text-center px-4">
              <div>
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm text-[#a3a09a]">
                  Bu yıl için henüz tespit kaydı yok.
                </div>
              </div>
            </div>
          ) : (
            <MonthlyTrendChart data={stats.monthly} />
          )}
        </section>

        {/* In-article reklam */}
        <AdInArticle />

        {/* Top 20 il */}
        <section className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4 mb-6">
          <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
            {CURRENT_YEAR}&apos;da En Çok Etkilenen 20 İl
          </h2>
          {stats.topIller.length === 0 ? (
            <div className="text-sm text-[#64645f] py-4 text-center">Veri yok.</div>
          ) : (
            <ol className="space-y-1.5">
              {stats.topIller.map((il, idx) => {
                const max = stats.topIller[0].count
                const pct = (il.count / max) * 100
                return (
                  <li key={il.slug}>
                    <Link
                      href={`/il/${il.slug}`}
                      className="flex items-center gap-3 hover:bg-[#30302d] rounded px-2 py-2 transition"
                    >
                      <span className="text-xs font-bold text-[#64645f] w-6 text-right">
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
                      <span className="text-sm text-[#E24B4A] font-bold w-12 text-right">
                        {il.count}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* Açıklama metni — SEO */}
        <section className="text-sm leading-relaxed mb-6">
          <h2 className="text-lg font-bold text-[#f4f2ec] mb-3">Bu arşiv hakkında</h2>
          <p className="text-[#a3a09a]">
            YangınRadar arşivi, NASA&apos;nın VIIRS (Suomi NPP) uydusundan elde edilen
            yaklaşık gerçek-zamanlı yangın tespit verilerine dayanır. Her tespit, uydunun
            geçtiği anda saptadığı bir ısı kaynağıdır; yüksek güvenli (h) tespitler
            genellikle gerçek bir orman yangınına işaret eder, orta güvenli (n) tespitler
            ise küçük yangınlar, anız ya da endüstriyel ısı kaynakları olabilir.
          </p>
          <p className="text-[#a3a09a] mt-2">
            Aylık trend grafiği, {CURRENT_YEAR} yılında ay ay tespit edilen toplam ısı
            noktası sayısını gösterir. Türkiye&apos;de yangın sezonu Haziran-Eylül aylarında
            yoğunlaşır; bu döneme ait grafik çubukları diğer aylardan belirgin şekilde
            yüksektir.
          </p>
          <p className="text-[#a3a09a] mt-2">
            <strong className="text-[#f4f2ec]">Önemli:</strong> Bu arşiv YangınRadar
            sisteminin {CURRENT_YEAR} yılında biriktirdiği verileri içerir. Daha eski yıllar
            için NASA FIRMS Historical Archive&apos;e bakılabilir.
          </p>
        </section>
      </div>
    </main>
  )
}
