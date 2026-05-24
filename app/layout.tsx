import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Footer from '@/components/ui/Footer'
import AdSenseScript from '@/components/ads/AdSenseScript'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yanginradar.com'),
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} dark h-full antialiased`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full flex flex-col bg-[#171716] text-[#f4f2ec]">
        <AdSenseScript />
        {children}
        <Footer />
      </body>
    </html>
  )
}
