import type { MetadataRoute } from 'next'
import { IL_LIST } from '@/lib/il-data'

const SITE_URL = 'https://yanginradar.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/istatistikler`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/hakkinda`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  const ilRoutes: MetadataRoute.Sitemap = IL_LIST.map((il) => ({
    url: `${SITE_URL}/il/${il.slug}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...ilRoutes]
}
