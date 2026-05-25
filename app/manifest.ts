import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YangınRadar — Türkiye Orman Yangını Takibi',
    short_name: 'YangınRadar',
    description:
      'Türkiye genelindeki aktif orman yangınlarını NASA FIRMS uydu verisiyle gerçek zamanlı takip edin.',
    start_url: '/',
    display: 'standalone',
    background_color: '#171716',
    theme_color: '#E24B4A',
    orientation: 'portrait-primary',
    lang: 'tr',
    dir: 'ltr',
    categories: ['news', 'weather', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
    ],
    shortcuts: [
      {
        name: 'İstatistikler',
        url: '/istatistikler',
        description: 'Son 30 günün özeti',
      },
      {
        name: 'Arşiv',
        url: '/arsiv',
        description: `${new Date().getUTCFullYear()} yıllık yangın özeti`,
      },
    ],
  }
}
