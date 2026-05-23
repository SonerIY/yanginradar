'use client'

import dynamic from 'next/dynamic'
import type { FirePoint } from '@/types'

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
}

export default function FireMapClient({ fires, showWind }: Props) {
  return <FireMap fires={fires} showWind={showWind} />
}
