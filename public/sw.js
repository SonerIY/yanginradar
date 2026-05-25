// YangınRadar — Service Worker
// - Web Push event handler (bildirim göster + tıklayınca aç)
// - Çevrimdışı app shell cache: harita tile'ları ve son sayfa cache'ten gelir

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `yr-static-${CACHE_VERSION}`
const RUNTIME_CACHE = `yr-runtime-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/icon.svg',
  '/icon-maskable.svg',
  '/favicon.ico',
  '/turkey-il.geojson',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

// Fetch stratejisi:
// - GET HTML (navigation): network-first, fail durumunda cache fallback
// - GET static (_next/static, image, font, svg): cache-first
// - Tile resimleri (CartoDB): stale-while-revalidate (offline'da son tile)
// - Diğer GET (API): network (cache yok, taze veri kritik)
// - Non-GET: doğrudan network
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Bizim domain dışı tile + statik kaynaklar (CartoDB, NASA images)
  const isTile =
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('cartocdn.com')

  // Aynı origin static asset
  const isStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname === '/turkey-il.geojson')

  // Aynı origin HTML/page (navigation)
  const isPage =
    url.origin === self.location.origin &&
    (req.mode === 'navigate' ||
      (req.headers.get('accept') ?? '').includes('text/html'))

  if (isTile) {
    event.respondWith(staleWhileRevalidate(req))
    return
  }
  if (isStatic) {
    event.respondWith(cacheFirst(req))
    return
  }
  if (isPage) {
    event.respondWith(networkFirstWithOffline(req))
    return
  }
  // Diğer (API, third-party): default network davranışı
})

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch (err) {
    return cached || Response.error()
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || fetchPromise
}

async function networkFirstWithOffline(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put(request, res.clone())
    return res
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    // Son çare: cache'teki ana sayfa
    const fallback = await cache.match('/') ?? (await caches.match('/'))
    if (fallback) return fallback
    return new Response(
      '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Çevrimdışı</title><style>body{background:#171716;color:#f4f2ec;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px}</style></head><body><div><h1>🔥 Çevrimdışısınız</h1><p>İnternet bağlantısı yok. Bağlantı geldikten sonra tekrar deneyin.</p></div></body></html>',
      { headers: { 'content-type': 'text/html; charset=utf-8' }, status: 200 },
    )
  }
}

// --- Web Push ---

self.addEventListener('push', (event) => {
  let payload = {
    title: 'YangınRadar',
    body: 'Yeni bir yangın tespiti var.',
    url: '/',
    tag: 'yanginradar',
    icon: '/icon.svg',
    badge: '/icon.svg',
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    } catch (e) {
      payload.body = event.data.text() || payload.body
    }
  }

  const promise = self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.tag,
    icon: payload.icon,
    badge: payload.badge,
    data: { url: payload.url },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  })

  event.waitUntil(promise)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
