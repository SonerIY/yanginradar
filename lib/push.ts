// Server-only modül; client'tan import edilmemeli (web-push + service role).
import webpush from 'web-push'
import { createServerSupabaseClient } from '@/lib/supabase'

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  il_slug: string | null
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
}

let vapidConfigured = false

function ensureVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL || 'mailto:info@yanginradar.com'
  if (!publicKey || !privateKey) return false
  try {
    webpush.setVapidDetails(email, publicKey, privateKey)
    vapidConfigured = true
    return true
  } catch {
    return false
  }
}

/**
 * Belirli bir subscription'a push gönderir. 410/404 dönerse abonelik
 * geçersizdir, çağıran taraf DB'den silmek isteyebilir.
 */
async function sendOne(sub: SubscriptionRow, payload: PushPayload): Promise<
  | { ok: true }
  | { ok: false; gone: boolean; status?: number; message: string }
> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 },
    )
    return { ok: true }
  } catch (err) {
    const e = err as { statusCode?: number; message?: string }
    const status = e?.statusCode
    const gone = status === 404 || status === 410
    return {
      ok: false,
      gone,
      status,
      message: e?.message ?? 'unknown',
    }
  }
}

/**
 * Tüm aktif aboneliklere (veya belirli bir il'e abone olanlara) push
 * gönderir. Geçersiz olanlar (410 Gone) DB'den silinir.
 */
export async function sendPushToSubscribers(
  payload: PushPayload,
  options: { ilSlug?: string | null } = {},
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!ensureVapid()) {
    return { sent: 0, failed: 0, pruned: 0 }
  }

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('subscriptions')
    .select('endpoint,p256dh,auth,il_slug')

  if (options.ilSlug !== undefined) {
    // null = tüm Türkiye aboneleri; bir slug verildiyse o ile + global aboneler
    if (options.ilSlug === null) {
      query = query.is('il_slug', null)
    } else {
      query = query.or(`il_slug.eq.${options.ilSlug},il_slug.is.null`)
    }
  }

  const { data, error } = await query
  if (error || !data) return { sent: 0, failed: 0, pruned: 0 }

  const subs = data as SubscriptionRow[]
  let sent = 0
  let failed = 0
  const goneEndpoints: string[] = []

  const BATCH = 50
  for (let i = 0; i < subs.length; i += BATCH) {
    const slice = subs.slice(i, i + BATCH)
    const results = await Promise.all(slice.map((s) => sendOne(s, payload)))
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      if (r.ok) sent++
      else {
        failed++
        if (r.gone) goneEndpoints.push(slice[j].endpoint)
      }
    }
  }

  let pruned = 0
  if (goneEndpoints.length > 0) {
    try {
      const { error: delErr } = await supabase
        .from('subscriptions')
        .delete()
        .in('endpoint', goneEndpoints)
      if (!delErr) pruned = goneEndpoints.length
    } catch {
      // silinmezse kritik değil
    }
  }

  return { sent, failed, pruned }
}
