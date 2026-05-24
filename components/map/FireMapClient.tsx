'use client'

import dynamic from 'next/dynamic'
import type { FirePoint } from '@/types'
import type { WindPoint } from '@/components/map/FireMap'

const FireMap = dynamic(() => import('@/components/map/FireMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#081421] text-[#315370] text-xs font-bold">
      Harita yükleniyor…
    </div>
  ),
})

interface Props {
  fires: FirePoint[]
  showWind?: boolean
  windPoints?: WindPoint[]
  center?: [number, number]
  zoom?: number
  minZoom?: number
}

export default function FireMapClient({
  fires,
  showWind,
  windPoints,
  center,
  zoom,
  minZoom,
}: Props) {
  return (
    <FireMap
      fires={fires}
      showWind={showWind}
      windPoints={windPoints}
      center={center}
      zoom={zoom}
      minZoom={minZoom}
    />
  )
}
