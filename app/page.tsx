import { Suspense } from 'react'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'
import HomeContent, { HomeContentSkeleton } from '@/components/HomeContent'

export const revalidate = 600

function formatUpdated(): string {
  const now = new Date()
  return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`
}

/**
 * Streaming SSR: Navbar + Ad anında stream edilir; HomeContent veri çekene
 * kadar HomeContentSkeleton (Suspense fallback) görünür. Yavaş 3rd-party
 * fetch (Open-Meteo, Google News) kullanıcının "boş ekran bekleme"sini
 * tamamen ortadan kaldırır.
 */
export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar updatedAt={formatUpdated()} />
      <AdLeaderboard />
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  )
}
