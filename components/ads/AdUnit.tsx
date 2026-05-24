'use client'

import { useEffect, useRef } from 'react'

interface Props {
  slot: string
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid'
  layout?: string  // örn 'in-article'
  layoutKey?: string
  responsive?: boolean
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle?: object[]
  }
}

/**
 * Tek bir AdSense reklam birimi. NEXT_PUBLIC_ADSENSE_CLIENT yoksa null döner;
 * sayfa düzeni placeholder gibi davranmaz (boş kalır). Placeholder isteyen
 * üst seviye wrapper'lar (AdLeaderboard vs.) kendi placeholder'larını çizer.
 */
export default function AdUnit({
  slot,
  format = 'auto',
  layout,
  layoutKey,
  responsive = true,
  style,
  className,
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const pushed = useRef(false)

  useEffect(() => {
    if (!client || pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // adsbygoogle henüz yüklenmemiş olabilir; bir sonraki render'da tekrar denenir
    }
  }, [client])

  if (!client || !slot) return null

  return (
    <ins
      className={`adsbygoogle ${className ?? ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layout ? { 'data-ad-layout': layout } : {})}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
    />
  )
}
