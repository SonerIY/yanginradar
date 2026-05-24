import { XMLParser } from 'fast-xml-parser'
import type { NewsItem } from '@/types'

const GOOGLE_NEWS_BASE = 'https://news.google.com/rss/search'

interface RssChannelItem {
  title?: string
  link?: string
  pubDate?: string
  description?: string
  source?: string | { '#text'?: string; '@_url'?: string }
  guid?: string | { '#text'?: string }
}

export interface FetchNewsOptions {
  /** Eğer verilirse il adının yerine bu özel sorgu Google News'a gönderilir. */
  customQuery?: string
  /** Maksimum kaç sonuç döneceği (varsayılan 15). */
  limit?: number
}

export function buildIlSearchQuery(ilName: string): string {
  // "Muğla" yangın → daha alakalı sonuçlar için tırnakla quote'la
  return `"${ilName}" orman yangını`
}

function buildUrl(query: string): string {
  return `${GOOGLE_NEWS_BASE}?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractImage(html: string | undefined): string | undefined {
  if (!html) return undefined
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1]
}

function extractSourceFromTitle(title: string): { title: string; source: string } {
  // Google News format: "Haber Başlığı - Kaynak"
  const lastDash = title.lastIndexOf(' - ')
  if (lastDash > 0 && lastDash > title.length - 60) {
    return {
      title: title.slice(0, lastDash).trim(),
      source: title.slice(lastDash + 3).trim(),
    }
  }
  return { title, source: '' }
}

function parseRss(xml: string, limit: number): NewsItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: false,
  })

  let data: unknown
  try {
    data = parser.parse(xml)
  } catch {
    return []
  }

  const items = (data as { rss?: { channel?: { item?: RssChannelItem | RssChannelItem[] } } })
    ?.rss?.channel?.item
  if (!items) return []

  const arr = Array.isArray(items) ? items : [items]

  return arr.slice(0, limit).map((item) => {
    const rawTitle = String(item.title ?? '').trim()
    const titleParts = extractSourceFromTitle(rawTitle)

    const sourceFromTag =
      typeof item.source === 'string'
        ? item.source
        : (item.source?.['#text'] ?? '')
    const source = (sourceFromTag || titleParts.source || 'Haber').toString().trim()

    const link = String(item.link ?? '').trim()
    const pubDateStr = String(item.pubDate ?? '').trim()
    const pubDate = pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString()
    const descriptionHtml = String(item.description ?? '')
    const snippet = stripHtml(descriptionHtml).slice(0, 280)
    const imageUrl = extractImage(descriptionHtml)

    return {
      title: titleParts.title,
      link,
      source,
      pubDate,
      snippet,
      imageUrl,
    }
  })
}

export async function fetchNews(query: string, options: FetchNewsOptions = {}): Promise<NewsItem[]> {
  const limit = options.limit ?? 15
  const url = buildUrl(query)
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; YangınRadar/1.0; +https://yanginradar.com)',
        accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRss(xml, limit)
  } catch {
    return []
  }
}

export async function fetchNewsForIl(
  ilName: string,
  options: FetchNewsOptions = {},
): Promise<NewsItem[]> {
  const query = options.customQuery ?? buildIlSearchQuery(ilName)
  return fetchNews(query, options)
}

/** İnsan dostu zaman: "5 saat önce", "2 gün önce" */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60) return 'az önce'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`
  const days = Math.floor(diffSec / 86400)
  if (days < 7) return `${days} gün önce`
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`
  if (days < 365) return `${Math.floor(days / 30)} ay önce`
  return `${Math.floor(days / 365)} yıl önce`
}
