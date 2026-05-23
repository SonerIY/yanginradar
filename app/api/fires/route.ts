import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') ?? 'today'
  const confidenceParam = searchParams.get('confidence') ?? 'h,n'
  const il = searchParams.get('il')
  const limitParam = Number(searchParams.get('limit') ?? '2000')
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 5000) : 2000

  const confidences = confidenceParam
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c === 'h' || c === 'n' || c === 'l')

  let fromDate: string
  const today = new Date()
  if (dateParam === 'today') {
    fromDate = today.toISOString().slice(0, 10)
  } else if (dateParam === 'yesterday') {
    fromDate = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  } else if (dateParam === 'week') {
    fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    fromDate = dateParam
  } else {
    fromDate = today.toISOString().slice(0, 10)
  }

  try {
    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('fires')
      .select('id,lat,lon,brightness,confidence,acq_date,acq_time,satellite,frp,il_slug,il_name')
      .gte('acq_date', fromDate)
      .order('acq_date', { ascending: false })
      .order('acq_time', { ascending: false })
      .limit(limit)

    if (confidences.length > 0) {
      query = query.in('confidence', confidences)
    }
    if (il) {
      query = query.eq('il_slug', il)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      fires: data ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
