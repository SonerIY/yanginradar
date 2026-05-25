'use client'

import { useEffect } from 'react'

/**
 * Service Worker'ı her sayfa load'unda register/güncel tut.
 * Push aboneliği için zaten gerekli; ayrıca offline cache aktive eder.
 * (Push aboneliği SubscribeButton'da da yapılır; ikisi de aynı SW'yi paylaşır.)
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Production'da kayıt et (dev'de SW genelde sorunlu)
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    if (isLocal) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('[sw] register başarısız:', err)
      })
  }, [])

  return null
}
