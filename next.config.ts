import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
  // OpenNext Cloudflare deploy için image optimization devre dışı (Workers'da
  // sharp yok; Faz 3'te Cloudflare Image Resizing'e geçilebilir)
  images: {
    unoptimized: true,
  },
}

// Cloudflare bağlamını (env, KV, R2 vs.) `next dev` sırasında erişilebilir kıl
initOpenNextCloudflareForDev()

export default nextConfig
