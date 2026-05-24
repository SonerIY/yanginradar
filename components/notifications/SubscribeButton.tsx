'use client'

import { useEffect, useState } from 'react'

type Status =
  | 'unsupported'      // tarayıcı desteklemiyor
  | 'no-public-key'    // VAPID public key env yok (preview/dev)
  | 'loading'          // başlangıç tarama
  | 'denied'           // kullanıcı izin reddetti (browser blok)
  | 'subscribed'       // kayıtlı
  | 'idle'             // henüz abone değil, butona basabilir

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

export default function SubscribeButton({
  ilSlug = null,
  ilName = null,
}: {
  ilSlug?: string | null
  ilName?: string | null
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported')
      return
    }
    if (!publicKey) {
      setStatus('no-public-key')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    // Mevcut subscription kontrolü
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => {
        setStatus(sub ? 'subscribed' : 'idle')
      })
      .catch(() => setStatus('idle'))
  }, [publicKey])

  async function ensureSWRegistration(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration('/sw.js')
    if (existing) return existing
    return navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }

  async function handleSubscribe() {
    if (!publicKey) return
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'idle')
        return
      }
      const reg = await ensureSWRegistration()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
      const json = sub.toJSON()
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          il_slug: ilSlug,
          il_name: ilName,
        }),
      })
      if (!res.ok) throw new Error('API hata')
      setStatus('subscribed')
    } catch (err) {
      console.error(err)
      setStatus('idle')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        const { endpoint } = sub.toJSON()
        await sub.unsubscribe()
        await fetch('/api/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      setStatus('idle')
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  // Görsel state mapping
  const base =
    'w-full min-h-11 rounded-lg font-extrabold transition border'

  if (status === 'unsupported') {
    return (
      <button
        type="button"
        disabled
        className={`${base} text-[#64645f] bg-transparent border-[#3f3f3c] opacity-60 cursor-not-allowed`}
      >
        🔕 Bu tarayıcı bildirim desteklemiyor
      </button>
    )
  }

  if (status === 'no-public-key') {
    return (
      <button
        type="button"
        disabled
        className={`${base} text-[#64645f] bg-transparent border-[#3f3f3c] opacity-60 cursor-not-allowed`}
        title="VAPID public key tanımlı değil"
      >
        🔔 Bildirim aboneliği (yakında)
      </button>
    )
  }

  if (status === 'denied') {
    return (
      <button
        type="button"
        disabled
        className={`${base} text-[#a3a09a] bg-transparent border-[#3f3f3c] opacity-70 cursor-not-allowed`}
        title="Tarayıcı ayarlarından bildirim iznini açın"
      >
        🚫 Bildirim izni engellendi
      </button>
    )
  }

  if (status === 'subscribed') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handleUnsubscribe}
        className={`${base} text-[#30c7a4] bg-[#30c7a4]/10 border-[#30c7a4] hover:bg-[#30c7a4]/20`}
      >
        {busy ? '...' : '✓ Aboneliği iptal et'}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={busy || status === 'loading'}
      onClick={handleSubscribe}
      className={`${base} text-[#f4f2ec] bg-transparent border-[#64645f] hover:bg-[#30302d]`}
    >
      {busy
        ? 'Hazırlanıyor…'
        : status === 'loading'
          ? 'Yükleniyor…'
          : '🔔 Yangın bildirimlerine abone ol'}
    </button>
  )
}
