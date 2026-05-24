// YangınRadar — Web Push Service Worker
// Push event'inde tarayıcı bildirimi gösterir, tıklanınca ilgili URL'i açar.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'YangınRadar',
    body: 'Yeni bir yangın tespiti var.',
    url: '/',
    tag: 'yanginradar',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
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
      // Açık bir sekme varsa onu odakla
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Yoksa yeni sekme aç
      return self.clients.openWindow(url)
    }),
  )
})
