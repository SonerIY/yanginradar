import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/ui/Navbar'
import { IL_LIST } from '@/lib/il-data'

export const metadata: Metadata = {
  title: '404 — Sayfa bulunamadı | YangınRadar',
  robots: { index: false, follow: false },
}

// 8 popüler/önerilen il (yangın açısından kritik bölgeler)
const POPULAR_SLUGS = [
  'mugla', 'antalya', 'izmir', 'canakkale',
  'hatay', 'mersin', 'aydin', 'manisa',
]

export default function NotFound() {
  const popular = POPULAR_SLUGS
    .map((s) => IL_LIST.find((il) => il.slug === s))
    .filter((il): il is NonNullable<typeof il> => Boolean(il))

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-4 select-none">🔥</div>
          <h1 className="text-5xl font-extrabold text-[#f4f2ec] mb-2">404</h1>
          <p className="text-lg text-[#a3a09a] mb-8">
            Aradığın sayfa bulunamadı. Belki başka bir yere gitmek istemiştin?
          </p>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#E24B4A] text-white font-extrabold rounded-lg hover:bg-[#c43e3d] transition mb-8"
          >
            ← Ana sayfaya dön
          </Link>

          <div className="mt-12 text-left">
            <h2 className="text-sm font-extrabold text-[#a3a09a] uppercase mb-3 text-center">
              Yangın açısından kritik iller
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {popular.map((il) => (
                <Link
                  key={il.slug}
                  href={`/il/${il.slug}`}
                  className="px-3 py-2 bg-[#262624] border border-[#3f3f3c] rounded-md text-sm font-bold text-[#f4f2ec] hover:bg-[#30302d] hover:text-[#EF9F27] transition text-center"
                >
                  {il.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[#64645f]">
            <Link href="/istatistikler" className="hover:text-[#EF9F27]">İstatistikler</Link>
            <span>·</span>
            <Link href="/arsiv" className="hover:text-[#EF9F27]">Arşiv</Link>
            <span>·</span>
            <Link href="/hakkinda" className="hover:text-[#EF9F27]">Hakkında</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
