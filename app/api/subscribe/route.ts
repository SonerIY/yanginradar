import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  il_slug?: string | null
  il_name?: string | null
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const endpoint = body.endpoint?.trim()
  const p256dh = body.keys?.p256dh?.trim()
  const auth = body.keys?.auth?.trim()
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { ok: false, error: 'endpoint + keys.p256dh + keys.auth zorunlu' },
      { status: 400 },
    )
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ ok: false, error: 'supabase env yok' }, { status: 500 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
          il_slug: body.il_slug ?? null,
          il_name: body.il_name ?? null,
        },
        { onConflict: 'endpoint' },
      )

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  let body: { endpoint?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  const endpoint = body.endpoint?.trim()
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: 'endpoint zorunlu' }, { status: 400 })
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ ok: false, error: 'supabase env yok' }, { status: 500 })
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from('subscriptions').delete().eq('endpoint', endpoint)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
