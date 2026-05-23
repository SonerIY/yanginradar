// Cloudflare Worker — 3 saatte bir Next.js'in /api/cron/update-fires endpoint'ine POST atar.
// Yapısı kasten basit: tek bağımlılık yok, sadece fetch + Authorization header.

export interface Env {
  TARGET_URL: string  // örn. https://yanginradar.com/api/cron/update-fires
  CRON_SECRET: string // Next.js tarafıyla aynı değer
}

export default {
  // Cron Trigger handler
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(triggerUpdate(env))
  },

  // Manuel tetikleme için (curl ile test, debug). Aynı CRON_SECRET ister.
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }
    const result = await triggerUpdate(env)
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'content-type': 'application/json' },
    })
  },
} satisfies ExportedHandler<Env>

async function triggerUpdate(env: Env): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
  try {
    const res = await fetch(env.TARGET_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
    })
    const body = await res.text()
    console.log(`[cron] ${res.status} ${res.statusText} :: ${body.slice(0, 300)}`)
    return { ok: res.ok, status: res.status, body: body.slice(0, 1000) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[cron] error:', message)
    return { ok: false, error: message }
  }
}
