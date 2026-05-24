import Script from 'next/script'

/**
 * Google AdSense ana script tag'ı. layout.tsx'in en üstüne konulur.
 * NEXT_PUBLIC_ADSENSE_CLIENT env var yoksa hiçbir şey render etmez —
 * AdSense onayı/başvurusu öncesi geliştirme/preview ortamında temiz kalır.
 */
export default function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client) return null
  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  )
}
