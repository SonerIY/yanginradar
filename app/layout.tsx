import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Footer from '@/components/ui/Footer'
import AdSenseScript from '@/components/ads/AdSenseScript'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yanginradar.com'),
  applicationName: 'YangınRadar',
  appleWebApp: {
    capable: true,
    title: 'YangınRadar',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  title: 'YangınRadar — Türkiye Orman Yangını Takip Sistemi',
  description:
    'Türkiye genelindeki aktif orman yangınlarını NASA FIRMS uydu verisiyle gerçek zamanlı takip edin.',
  openGraph: {
    title: 'YangınRadar',
    description: 'Türkiye orman yangınları canlı uydu takibi',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://yanginradar.com',
    siteName: 'YangınRadar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YangınRadar',
    description: 'Türkiye orman yangınları canlı uydu takibi',
  },
  alternates: { canonical: 'https://yanginradar.com' },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
}

export const viewport: Viewport = {
  themeColor: '#171716',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} dark h-full antialiased`}
      style={{ colorScheme: 'dark', backgroundColor: '#171716' }}
    >
      <body
        className="min-h-full flex flex-col bg-[#171716] text-[#f4f2ec]"
        // FOUC fallback: Tailwind yüklenmeden önce de dark theme uygulanır
        style={{
          backgroundColor: '#171716',
          color: '#f4f2ec',
          minHeight: '100vh',
          margin: 0,
          fontFamily:
            'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <AdSenseScript />
        <ServiceWorkerRegister />
        <a href="#ana-icerik" className="skip-link">
          Ana içeriğe atla
        </a>
        {children}
        <Footer />
      </body>
    </html>
  )
}
