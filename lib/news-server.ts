// Bu modül yalnız server tarafında kullanılır (Supabase service role + RSS fetch).
// 'server-only' paketi Cloudflare Workers runtime'ında bazı edge case'lerde
// patlattığı için kaldırıldı; client'tan import edilmesi build-time'da next
// tarafından zaten engelleniyor (createServerSupabaseClient server-only).
import { createServerSupabaseClient } from '@/lib/supabase'
import { fetchNews, fetchNewsForIl, buildIlSearchQuery } from '@/lib/news'
import { getIlBySlug } from '@/lib/il-data'
import type { NewsItem } from '@/types'

interface DbNewsRow {
  title: string
  link: string
  source: string | null
  pub_date: string
  snippet: string | null
  image_url: string | null
  il_slug: string
}

function rowToItem(r: DbNewsRow): NewsItem {
  return {
    title: r.title,
    link: r.link,
    source: r.source ?? 'Haber',
    pubDate: r.pub_date,
    snippet: r.snippet ?? '',
    imageUrl: r.image_url ?? undefined,
  }
}

function dedupeAndSort(arrays: NewsItem[][]): NewsItem[] {
  const seen = new Set<string>()
  const merged: NewsItem[] = []
  for (const arr of arrays) {
    for (const item of arr) {
      if (!item.link || seen.has(item.link)) continue
      seen.add(item.link)
      merged.push(item)
    }
  }
  merged.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
  return merged
}

async function archiveItems(slug: string, items: NewsItem[]): Promise<void> {
  if (items.length === 0) return
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return
  }
  try {
    const supabase = createServerSupabaseClient()
    const rows = items
      .filter((it) => it.link)
      .map((it) => ({
        il_slug: slug,
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
    // archive hatası response'u etkilemesin
  }
}

/**
 * İl sayfası için haber listesi.
 *
 * Stratejisi:
 *  - Önce Supabase arşivinden son 30 günün haberlerini çeker (hızlı).
 *  - Aktif yangın varsa (fireCountWeek > 0) ve arşivin en yeni öğesi 60dk'dan
 *    eski ise (veya arşiv boşsa) Google News'tan canlı çeker, arşive yazar.
 *  - Bunları birleştirip dedupe edip tarihe göre sıralı döner.
 */
export async function getIlNews(
  slug: string,
  fireCountWeek: number,
  limit = 8,
): Promise<NewsItem[]> {
  const il = getIlBySlug(slug)
  if (!il) return []

  // 1) Arşiv
  let archived: NewsItem[] = []
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabase = createServerSupabaseClient()
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('news_items')
        .select('title, link, source, pub_date, snippet, image_url, il_slug')
        .eq('il_slug', slug)
        .gte('pub_date', since)
        .order('pub_date', { ascending: false })
        .limit(limit * 2)
      archived = (data ?? []).map(rowToItem as (r: unknown) => NewsItem)
    } catch {
      archived = []
    }
  }

  const archiveFresh =
    archived.length > 0 &&
    Date.now() - new Date(archived[0].pubDate).getTime() < 60 * 60 * 1000

  const shouldFetchFresh = fireCountWeek > 0 && !archiveFresh

  if (shouldFetchFresh) {
    const fresh = await fetchNewsForIl(il.name, { limit })
    await archiveItems(slug, fresh)
    return dedupeAndSort([fresh, archived]).slice(0, limit)
  }

  return archived.slice(0, limit)
}

/**
 * Türkiye geneli yangın haberleri (ana sayfa sidebar widget'ı için).
 * Doğrudan Google News'tan çeker — il bazlı arşiv değildir.
 */
export async function getCountryWideFireNews(limit = 5): Promise<NewsItem[]> {
  return fetchNews('"orman yangını" Türkiye', { limit })
}

/**
 * Tüm illerin arşivinden son N haberi getirir (istatistikler sayfası için).
 */
export async function getRecentArchivedNews(limit = 6): Promise<NewsItem[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return []
  }
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('news_items')
      .select('title, link, source, pub_date, snippet, image_url, il_slug')
      .order('pub_date', { ascending: false })
      .limit(limit)
    return (data ?? []).map(rowToItem as (r: unknown) => NewsItem)
  } catch {
    return []
  }
}
