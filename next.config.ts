import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  // OpenNext Cloudflare deploy için image optimization devre dışı (Workers'da
  // sharp yok; Faz 3'te Cloudflare Image Resizing'e geçilebilir)
  images: {
    unoptimized: true,
  },
  // _next/static/* dosyaları hashlı isim alır → immutable cache güvenli.
  // OpenNext Cloudflare default'unda max-age=0 ile geliyordu; FOUC ve
  // gereksiz revalidate'i engellemek için 1 yıl cache veriyoruz.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/turkey-il.geojson',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
}

// Cloudflare bağlamını (env, KV, R2 vs.) `next dev` sırasında erişilebilir kıl
initOpenNextCloudflareForDev()

export default nextConfig
