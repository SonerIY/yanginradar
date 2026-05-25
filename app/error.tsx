'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[app/error] Uygulama hatası:', error)
  }, [error])

  return (
    <main className="flex flex-col min-h-screen bg-[#171716]">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          <div className="text-8xl mb-4 select-none">⚠️</div>
          <h1 className="text-4xl font-extrabold text-[#f4f2ec] mb-2">Bir hata oluştu</h1>
          <p className="text-base text-[#a3a09a] mb-2">
            Sayfa yüklenirken beklenmedik bir sorun çıktı. Tekrar deneyebilir veya
            ana sayfaya dönebilirsin.
          </p>
          {error.digest && (
            <p className="text-xs text-[#64645f] mb-6 font-mono">Hata kodu: {error.digest}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={reset}
              type="button"
              className="px-6 py-3 bg-[#E24B4A] text-white font-extrabold rounded-lg hover:bg-[#c43e3d] transition"
            >
              ↻ Tekrar dene
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-transparent border border-[#64645f] text-[#f4f2ec] font-extrabold rounded-lg hover:bg-[#30302d] transition"
            >
              ← Ana sayfa
            </Link>
          </div>

          <div className="mt-8 text-xs text-[#64645f]">
            Sorun devam ederse{' '}
            <a href="mailto:info@yanginradar.com" className="text-[#EF9F27] underline">
              info@yanginradar.com
            </a>{' '}
            adresine bildirebilirsin.
          </div>
        </div>
      </div>
    </main>
  )
}
