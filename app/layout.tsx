import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  title: 'YangınRadar — Türkiye Orman Yangını Takip Sistemi',
  description:
    'Türkiye genelindeki aktif orman yangınlarını NASA FIRMS uydu verisiyle gerçek zamanlı takip edin.',
  openGraph: {
    title: 'YangınRadar',
    description: 'Türkiye orman yangınları canlı uydu takibi',
    type: 'website',
    locale: 'tr_TR',
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
        {children}
      </body>
    </html>
  )
}
