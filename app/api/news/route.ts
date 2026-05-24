import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchNews, buildIlSearchQuery } from '@/lib/news'
import { getIlBySlug } from '@/lib/il-data'
import type { NewsItem } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL = 30 * 60 // 30 dakika

type KVNs = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

function tryGetKv(): KVNs | undefined {
  try {
    const { env } = getCloudflareContext()
    const ns = (env as unknown as { NEWS_CACHE?: KVNs }).NEWS_CACHE
    return ns
  } catch {
    return undefined
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ilSlug = searchParams.get('il')
  const customQuery = searchParams.get('q')

  if (!ilSlug && !customQuery) {
    return NextResponse.json(
      { ok: false, error: 'il veya q parametresi gerekli' },
      { status: 400 },
    )
  }

  // Sorgu oluştur
  let query: string
  let archiveSlug: string | null = null

  if (customQuery) {
    query = customQuery
  } else {
    const il = getIlBySlug(ilSlug!)
    if (!il) {
      return NextResponse.json({ ok: false, error: 'il bulunamadı' }, { status: 404 })
    }
    query = buildIlSearchQuery(il.name)
    archiveSlug = il.slug
  }

  const cacheKey = customQuery
    ? `news:q:${customQuery.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60)}`
    : `news:il:${ilSlug}`

  // 1) KV cache
  const kv = tryGetKv()
  if (kv) {
    try {
      const cached = await kv.get(cacheKey)
      if (cached) {
        return NextResponse.json({
          ok: true,
          fromCache: true,
          items: JSON.parse(cached) as NewsItem[],
        })
      }
    } catch {
      // cache okumada hata olursa fetch'e devam et
    }
  }

  // 2) Google News fetch
  const items = await fetchNews(query, { limit: 15 })

  // 3) KV cache write (her sonuç için, boş bile olsa, kısa süreli)
  if (kv) {
    try {
      await kv.put(cacheKey, JSON.stringify(items), {
        expirationTtl: items.length === 0 ? 300 : CACHE_TTL, // boş sonuçları 5dk cache'le
      })
    } catch {
      // cache yazmada hata kritik değil
    }
  }

  // 4) Supabase arşivle — sadece il bazlı, en az 1 sonuç varsa
  if (archiveSlug && items.length > 0) {
    try {
      const supabase = createServerSupabaseClient()
      const rows = items
        .filter((it) => it.link)
        .map((it) => ({
          il_slug: archiveSlug,
          title: it.title,
          link: it.link,
          source: it.source,
          pub_date: it.pubDate,
          snippet: it.snippet,
          image_url: it.imageUrl ?? null,
        }))
      if (rows.length > 0) {
        await supabase
          .from('news_items')
          .upsert(rows, { onConflict: 'link', ignoreDuplicates: true })
      }
    } catch {
      // arşivleme hata verirse response yine ok dönsün
    }
  }

  return NextResponse.json({ ok: true, fromCache: false, items })
}
