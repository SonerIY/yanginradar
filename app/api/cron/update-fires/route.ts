import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchFirmsData, parseFirmsCsv, reverseGeocode } from '@/lib/firms'
import { IL_LIST } from '@/lib/il-data'
import { fetchBulkCurrentWeather } from '@/lib/weather'
import { riskFromWeather } from '@/lib/risk'
import { sendPushToSubscribers } from '@/lib/push'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const csv = await fetchFirmsData(1)
    const allPoints = parseFirmsCsv(csv)

    // Düşük güvenli noktaları at
    const filtered = allPoints.filter((p) => p.confidence === 'n' || p.confidence === 'h')

    // İl reverse geocode
    const enriched = filtered.map((p) => {
      const geo = reverseGeocode(p.lat, p.lon)
      return {
        lat: p.lat,
        lon: p.lon,
        brightness: p.brightness,
        confidence: p.confidence,
        acq_date: p.acq_date,
        acq_time: p.acq_time,
        satellite: p.satellite,
        frp: p.frp,
        il_slug: geo?.slug ?? null,
        il_name: geo?.name ?? null,
      }
    })

    const supabase = createServerSupabaseClient()

    // Upsert fires (unique key: lat+lon+acq_date+acq_time)
    let upsertedCount = 0
    let upsertErrors = 0

    if (enriched.length > 0) {
      const BATCH = 500
      for (let i = 0; i < enriched.length; i += BATCH) {
        const slice = enriched.slice(i, i + BATCH)
        const { error } = await supabase
          .from('fires')
          .upsert(slice, { onConflict: 'lat,lon,acq_date,acq_time', ignoreDuplicates: false })
        if (error) {
          upsertErrors += slice.length
        } else {
          upsertedCount += slice.length
        }
      }
    }

    // region_stats güncelle
    const today = new Date().toISOString().slice(0, 10)
    const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const { data: weekRows, error: weekErr } = await supabase
      .from('fires')
      .select('il_slug, acq_date')
      .gte('acq_date', weekAgoDate)

    let statsUpdated = 0
    if (!weekErr && weekRows) {
      const todayCount: Record<string, number> = {}
      const weekCount: Record<string, number> = {}
      for (const row of weekRows as Array<{ il_slug: string | null; acq_date: string }>) {
        if (!row.il_slug) continue
        weekCount[row.il_slug] = (weekCount[row.il_slug] ?? 0) + 1
        if (row.acq_date === today) {
          todayCount[row.il_slug] = (todayCount[row.il_slug] ?? 0) + 1
        }
      }

      // Faz 2 — Open-Meteo'dan 81 il için anlık hava verisi (tek istek, bulk)
      const weatherData = await fetchBulkCurrentWeather(
        IL_LIST.map((il) => ({ lat: il.lat, lon: il.lon })),
      )

      // Open-Meteo'nun tamamı başarısız olduysa (tüm chunklar null) eski hava
      // verisini koru, sadece fire counts ve updated_at güncelle.
      const anyWeatherOk = weatherData.some((w) => w !== null)

      const statRows = IL_LIST.map((il, idx) => {
        const todayFires = todayCount[il.slug] ?? 0
        const weather = weatherData[idx]
        const base = {
          il_slug: il.slug,
          il_name: il.name,
          fire_count_today: todayFires,
          fire_count_week: weekCount[il.slug] ?? 0,
          risk_score: riskFromWeather(weather, todayFires),
          updated_at: new Date().toISOString(),
        }
        if (!anyWeatherOk) {
          // hiçbir hava verisi yok → mevcut DB değerlerini koru (upsert eksik
          // kolonları UPDATE'te değiştirmez)
          return base
        }
        return {
          ...base,
          temperature: weather?.temperature ?? null,
          humidity: weather?.humidity ?? null,
          wind_speed: weather?.windSpeed ?? null,
          wind_direction: weather?.windDirection ?? null,
        }
      })

      const { error: statErr } = await supabase
        .from('region_stats')
        .upsert(statRows, { onConflict: 'il_slug' })
      if (!statErr) statsUpdated = statRows.length
    }

    // Web Push — son 3.5 saatte eklenen yüksek-güven yangınlar varsa abonelere haber ver.
    // (Cron interval 3h + 0.5h buffer; upsert'te yeni satırlar created_at default'ı alır.)
    let pushSent = 0
    let pushPruned = 0
    try {
      const cutoff = new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString()
      const { data: newHighFires } = await supabase
        .from('fires')
        .select('il_slug, il_name')
        .gte('created_at', cutoff)
        .eq('confidence', 'h')

      const newCount = newHighFires?.length ?? 0
      if (newCount > 0 && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        // En çok etkilenen ili bul
        const byIl: Record<string, { name: string; count: number }> = {}
        for (const row of newHighFires as Array<{ il_slug: string | null; il_name: string | null }>) {
          if (!row.il_slug || !row.il_name) continue
          if (!byIl[row.il_slug]) byIl[row.il_slug] = { name: row.il_name, count: 0 }
          byIl[row.il_slug].count++
        }
        const topIl = Object.entries(byIl).sort((a, b) => b[1].count - a[1].count)[0]
        const headline = topIl
          ? `${topIl[1].name} başta olmak üzere ${newCount} yeni yüksek güven yangın tespiti.`
          : `Türkiye genelinde ${newCount} yeni yüksek güven yangın tespiti.`

        // 1) Global aboneler için tek özet push
        const globalRes = await sendPushToSubscribers(
          {
            title: '🔥 YangınRadar — yeni tespit',
            body: headline,
            url: topIl ? `/il/${topIl[0]}` : '/',
            tag: 'yangin-cron-global',
          },
          { ilSlug: null },
        )
        pushSent += globalRes.sent
        pushPruned += globalRes.pruned

        // 2) Etkilenen her il için il-spesifik aboneye ayrı push
        for (const [slug, { name, count }] of Object.entries(byIl)) {
          const ilRes = await sendPushToSubscribers(
            {
              title: `🔥 ${name} — yeni yangın tespiti`,
              body: `${name} ilinde ${count} yeni yüksek-güven yangın saptandı. Detaylar için tıkla.`,
              url: `/il/${slug}`,
              tag: `yangin-cron-${slug}`,
            },
            { ilSlug: slug },
          )
          pushSent += ilRes.sent
          pushPruned += ilRes.pruned
        }
      }
    } catch {
      // push hatası cron response'unu etkilemesin
    }

    return NextResponse.json({
      ok: true,
      fetched: allPoints.length,
      filtered: filtered.length,
      upserted: upsertedCount,
      pushSent,
      pushPruned,
      upsertErrors,
      statsUpdated,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
