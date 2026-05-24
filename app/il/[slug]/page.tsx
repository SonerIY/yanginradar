import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FireMapClient from '@/components/map/FireMapClient'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import AdSquare from '@/components/ads/AdSquare'
import { IL_LIST, getIlBySlug, getNearbyIller } from '@/lib/il-data'
import { createServerSupabaseClient } from '@/lib/supabase'
import { formatSatellite } from '@/lib/firms'
import { fetchCurrentWeather } from '@/lib/weather'
import { riskFromWeather, riskColor, riskLabel } from '@/lib/risk'
import { getIlNews } from '@/lib/news-server'
import NewsList from '@/components/news/NewsList'
import AdInArticle from '@/components/ads/AdInArticle'
import type { FirePoint } from '@/types'

export const revalidate = 600 // 10 dk cache

export async function generateStaticParams() {
  return IL_LIST.map((il) => ({ slug: il.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const il = getIlBySlug(slug)
  if (!il) return { title: 'Bulunamadı | YangınRadar' }

  const title = `${il.name} Orman Yangını Takibi (Canlı) | YangınRadar`
  const description = `${il.name} ilindeki aktif orman yangınlarını NASA uydu verisiyle anlık takip edin. Son 7 günün yangın istatistikleri, hava durumu ve risk skoru.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'tr_TR',
      url: `https://yanginradar.com/il/${il.slug}`,
    },
    alternates: { canonical: `https://yanginradar.com/il/${il.slug}` },
  }
}

async function fetchIlData(slug: string) {
  const empty = {
    fires7d: [] as FirePoint[],
    firesToday: [] as FirePoint[],
    todayCount: 0,
    weekCount: 0,
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return empty
  }

  try {
    const supabase = createServerSupabaseClient()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)

    const { data } = await supabase
      .from('fires')
      .select('id,lat,lon,brightness,confidence,acq_date,acq_time,satellite,frp,il_slug,il_name')
      .eq('il_slug', slug)
      .gte('acq_date', weekAgo)
      .in('confidence', ['h', 'n'])
      .order('acq_date', { ascending: false })
      .order('acq_time', { ascending: false })
      .limit(500)

    const fires7d = (data ?? []) as FirePoint[]
    const firesToday = fires7d.filter((f) => f.acq_date === today)

    return {
      fires7d,
      firesToday,
      todayCount: firesToday.length,
      weekCount: fires7d.length,
    }
  } catch {
    return empty
  }
}

function formatTime(date: string, time: string): string {
  const padded = time.padStart(4, '0')
  return `${date} ${padded.slice(0, 2)}:${padded.slice(2, 4)}`
}

export default async function IlPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const il = getIlBySlug(slug)
  if (!il) notFound()

  const [ilData, weather] = await Promise.all([
    fetchIlData(il.slug),
    fetchCurrentWeather(il.lat, il.lon),
  ])

  // News'i ilData.weekCount'a göre tetikle (aktif yangın yoksa fetch atılmaz,
  // sadece varolan arşivden okunur)
  const news = await getIlNews(il.slug, ilData.weekCount, 8)

  const risk = riskFromWeather(weather, ilData.todayCount)
  const rColor = riskColor(risk)
  const rLabel = riskLabel(risk)

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar updatedAt={new Date().toISOString().slice(11, 16) + ' UTC'} />
      <AdLeaderboard />

      <div className="max-w-7xl w-full mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#a3a09a] mb-3">
          <Link href="/" className="hover:text-[#f4f2ec]">Ana sayfa</Link>
          <span className="mx-2">/</span>
          <span className="text-[#f4f2ec]">{il.name}</span>
        </nav>

        {/* Başlık */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#f4f2ec]">
            {il.name} Orman Yangını Takibi
          </h1>
          <p className="mt-2 text-sm text-[#a3a09a]">
            NASA FIRMS uydu verisiyle anlık olarak güncellenir · Son 7 günün özeti
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sol: Mini harita */}
          <section className="lg:col-span-2 bg-[#262624] border border-[#3f3f3c] rounded-lg overflow-hidden">
            <div className="h-[55vh] min-h-[320px] lg:h-[420px]">
              <FireMapClient fires={ilData.fires7d} center={[il.lat, il.lon]} zoom={9} minZoom={7} />
            </div>
            <div className="px-4 py-3 border-t border-[#3f3f3c] text-xs text-[#a3a09a]">
              Harita, son 7 günde {il.name} ilinde tespit edilen yangın noktalarını gösterir.
            </div>
          </section>

          {/* Sağ: Özet kartları */}
          <aside className="flex flex-col gap-4">
            {/* Risk skoru */}
            <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
              <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase mb-2">
                Yangın Riski
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold" style={{ color: rColor }}>
                  {risk}
                  <span className="text-base text-[#64645f]">/100</span>
                </span>
                <span
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: `${rColor}33`, color: rColor }}
                >
                  {rLabel}
                </span>
              </div>
              <div className="mt-3 h-2 bg-[#1a1a18] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(risk, 100)}%`, backgroundColor: rColor }}
                />
              </div>
            </div>

            {/* Hava durumu */}
            <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
              <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase mb-2">
                Anlık Hava
              </div>
              {weather ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-[#a3a09a]">Sıcaklık</div>
                    <div className="text-xl font-bold text-[#f4f2ec]">
                      {weather.temperature.toFixed(0)}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a3a09a]">Nem</div>
                    <div className="text-xl font-bold text-[#f4f2ec]">%{weather.humidity.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a3a09a]">Rüzgar</div>
                    <div className="text-xl font-bold text-[#f4f2ec]">
                      {(weather.windSpeed * 3.6).toFixed(0)} km/s
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#64645f]">Hava verisi alınamadı</div>
              )}
              <div className="mt-2 text-[10px] text-[#64645f]">Kaynak: Open-Meteo</div>
            </div>

            {/* Sayılar */}
            <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">Bugün</div>
                <div className="text-2xl font-bold text-[#E24B4A]">{ilData.todayCount}</div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#a3a09a] uppercase">7 günde</div>
                <div className="text-2xl font-bold text-[#f4f2ec]">{ilData.weekCount}</div>
              </div>
            </div>

            <AdSquare />
          </aside>
        </div>

        {/* Son tespitler tablosu */}
        <section className="mt-8 bg-[#262624] border border-[#3f3f3c] rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b border-[#3f3f3c]">
            <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase">
              Son 7 Gündeki Tespitler
            </h2>
          </header>
          {ilData.fires7d.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-2xl mb-2">🌲</div>
              <div className="text-base font-bold text-[#30c7a4] mb-1">
                Sevindirici haber — son 7 günde aktif tespit yok
              </div>
              <div className="text-xs text-[#a3a09a] max-w-md mx-auto leading-relaxed">
                NASA uydusu {il.name} bölgesinde son bir haftadır yangın benzeri bir ısı
                kaynağı saptamadı. Yine de kuru ve rüzgârlı günlerde dikkatli olun.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a18] text-[11px] uppercase text-[#a3a09a]">
                  <tr>
                    <th className="px-4 py-2 text-left">Tarih · Saat (UTC)</th>
                    <th className="px-4 py-2 text-left">Koordinat</th>
                    <th className="px-4 py-2 text-left">Uydu</th>
                    <th className="px-4 py-2 text-right">FRP (MW)</th>
                    <th className="px-4 py-2 text-right">Güven</th>
                  </tr>
                </thead>
                <tbody>
                  {ilData.fires7d.slice(0, 50).map((fire, idx) => {
                    const k = fire.id ?? `${fire.lat}-${fire.lon}-${fire.acq_date}-${fire.acq_time}-${idx}`
                    return (
                      <tr key={k} className="border-t border-[#3f3f3c]">
                        <td className="px-4 py-2 text-[#f4f2ec]">
                          {formatTime(fire.acq_date, fire.acq_time)}
                        </td>
                        <td className="px-4 py-2 text-[#a3a09a]">
                          {fire.lat.toFixed(3)}, {fire.lon.toFixed(3)}
                        </td>
                        <td className="px-4 py-2 text-[#a3a09a]">{formatSatellite(fire.satellite)}</td>
                        <td className="px-4 py-2 text-right text-[#f4f2ec]">
                          {fire.frp?.toFixed?.(1) ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={
                              fire.confidence === 'h'
                                ? 'text-[#E24B4A] font-bold'
                                : 'text-[#EF9F27] font-bold'
                            }
                          >
                            {fire.confidence === 'h' ? 'Yüksek' : 'Orta'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* In-article reklam — son tespit tablosundan sonra */}
        <AdInArticle />

        {/* SEO için açıklayıcı metin */}
        <section className="mt-8 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-[#f4f2ec] mb-3">
            {il.name} için yangın takibi nasıl yapılır?
          </h2>
          <p className="text-[#a3a09a]">
            YangınRadar, {il.name} ilindeki aktif orman yangınlarını NASA&apos;nın <strong className="text-[#f4f2ec]">VIIRS uydusu (Suomi NPP)</strong> üzerinden gelen yaklaşık gerçek-zamanlı ısı verisi ile her 3 saatte bir günceller. Yukarıdaki harita
            ve tablo, son 7 günde {il.name} bölgesinde tespit edilen ısı kaynaklarını gösterir.
            Yüksek güvenli (kırmızı) tespitler genellikle gerçek bir orman yangınına işaret eder;
            orta güvenli (turuncu) tespitler ise endüstriyel ısı kaynakları, anız yangınları veya
            küçük yangınlar olabilir.
          </p>
          <p className="text-[#a3a09a] mt-2">
            Risk skoru, mevcut sıcaklık ({weather?.temperature.toFixed(0) ?? '—'}°C), nem (%
            {weather?.humidity.toFixed(0) ?? '—'}) ve rüzgâr hızı (
            {weather?.windSpeed ? (weather.windSpeed * 3.6).toFixed(0) : '—'} km/s) kullanılarak
            hesaplanır. Yangın çıkma ihtimali yüksek günlerde dışarıda ateş yakmaktan kaçının,
            şüpheli durumları <strong className="text-[#E24B4A]">112</strong> veya <strong className="text-[#E24B4A]">177</strong>{' '}
            (Orman Yangını İhbar Hattı) numaralarına bildirin.
          </p>
        </section>

        {/* Yerel Haberler — sadece arşivde veya canlı sonuç varsa */}
        {news.length > 0 && (
          <section className="mt-8 bg-[#262624] border border-[#3f3f3c] rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-[#3f3f3c] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#f4f2ec] uppercase">
                  📰 {il.name} Yangın Haberleri
                </h2>
                <div className="text-xs text-[#a3a09a] mt-1">
                  Google News · son 30 günden
                </div>
              </div>
              {ilData.todayCount > 0 && (
                <span className="text-[10px] uppercase font-extrabold px-2 py-1 rounded bg-[#E24B4A]/20 text-[#E24B4A] border border-[#E24B4A]/40">
                  ● Canlı
                </span>
              )}
            </header>
            <NewsList items={news} />
            <div className="px-4 py-2 text-[10px] text-[#64645f] border-t border-[#3f3f3c]">
              Haberler üçüncü taraf kaynaklardan alınmıştır; içerikten YangınRadar sorumlu değildir.
            </div>
          </section>
        )}

        {/* Komşu iller + İpuçları */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Komşu iller */}
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <h3 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
              Komşu illerde durum
            </h3>
            <ul className="space-y-2">
              {getNearbyIller(il.slug, 5).map((nb) => (
                <li key={nb.slug}>
                  <Link
                    href={`/il/${nb.slug}`}
                    className="flex items-center justify-between px-2 py-2 rounded hover:bg-[#30302d] transition"
                  >
                    <span className="text-sm font-bold text-[#f4f2ec]">{nb.name}</span>
                    <span className="text-xs text-[#a3a09a]">Detay →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İpuçları */}
          <div className="bg-[#262624] border border-[#3f3f3c] rounded-lg p-4">
            <h3 className="text-sm font-extrabold text-[#f4f2ec] uppercase mb-3">
              Yangına karşı 5 ipucu
            </h3>
            <ol className="space-y-2 text-sm text-[#a3a09a]">
              <li className="flex gap-2">
                <span className="text-[#EF9F27] font-bold">1.</span>
                Orman alanlarına yakın yerlerde sigara izmaritlerini söndürmeden atmayın.
              </li>
              <li className="flex gap-2">
                <span className="text-[#EF9F27] font-bold">2.</span>
                Anız yakma yasaktır; bahçe atıklarını gömerek imha edin.
              </li>
              <li className="flex gap-2">
                <span className="text-[#EF9F27] font-bold">3.</span>
                Piknik ateşini taşla çevrili alanda yakın, ayrılırken suyla söndürün.
              </li>
              <li className="flex gap-2">
                <span className="text-[#EF9F27] font-bold">4.</span>
                Cam, plastik ve metal parçalarını ormanda bırakmayın (mercek etkisi).
              </li>
              <li className="flex gap-2">
                <span className="text-[#EF9F27] font-bold">5.</span>
                Bir duman ya da alev gördüğünüzde derhal <strong className="text-[#E24B4A]">177</strong>&apos;yi arayın.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  )
}
