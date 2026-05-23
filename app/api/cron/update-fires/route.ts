import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchFirmsData, parseFirmsCsv, reverseGeocode } from '@/lib/firms'
import { IL_LIST } from '@/lib/il-data'

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

      const statRows = IL_LIST.map((il) => ({
        il_slug: il.slug,
        il_name: il.name,
        fire_count_today: todayCount[il.slug] ?? 0,
        fire_count_week: weekCount[il.slug] ?? 0,
        risk_score: 0, // Faz 2'de hava durumu ile hesaplanacak
        updated_at: new Date().toISOString(),
      }))

      const { error: statErr } = await supabase
        .from('region_stats')
        .upsert(statRows, { onConflict: 'il_slug' })
      if (!statErr) statsUpdated = statRows.length
    }

    return NextResponse.json({
      ok: true,
      fetched: allPoints.length,
      filtered: filtered.length,
      upserted: upsertedCount,
      upsertErrors,
      statsUpdated,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
