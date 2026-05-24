// GEÇİCİ DEBUG ENDPOINT — region_stats kolonlarını + örnek satırı gösterir.
// Sebebi bulunca silinecek.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') ?? 'mugla'

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('region_stats')
      .select('*')
      .eq('il_slug', slug)
      .maybeSingle()

    return NextResponse.json({
      ok: !error,
      error: error?.message,
      slug,
      row: data,
      keys: data ? Object.keys(data) : [],
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
