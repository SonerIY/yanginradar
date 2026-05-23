import type { FirePoint } from '@/types'

interface Props {
  fires: FirePoint[]
  limit?: number
}

function formatTime(date: string, time: string): string {
  const padded = time.padStart(4, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`
}

function dotClass(confidence: FirePoint['confidence']): string {
  if (confidence === 'h') return 'bg-[#E24B4A]'
  if (confidence === 'n') return 'bg-[#EF9F27]'
  return 'bg-neutral-500'
}

export default function AlertList({ fires, limit = 20 }: Props) {
  const sorted = [...fires]
    .sort((a, b) => {
      if (a.acq_date !== b.acq_date) return a.acq_date < b.acq_date ? 1 : -1
      return a.acq_time < b.acq_time ? 1 : -1
    })
    .slice(0, limit)

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-3 py-2 text-[11px] font-extrabold text-[#a3a09a] uppercase">
        <b>Son Tespitler</b>
        <span>bugün</span>
      </header>

      <div className="flex flex-col">
        {sorted.length === 0 && (
          <div className="px-3 py-4 text-xs text-neutral-500">
            Aktif tespit yok.
          </div>
        )}

        {sorted.map((fire, idx) => {
          const key = fire.id ?? `${fire.lat}-${fire.lon}-${fire.acq_date}-${fire.acq_time}-${idx}`
          return (
            <div
              key={key}
              className="flex items-center gap-3 min-h-[52px] px-3 py-2 border-t border-[#3f3f3c] cursor-pointer hover:bg-[#2f2f2c]"
            >
              <i className={`w-2 h-2 rounded-full shrink-0 ${dotClass(fire.confidence)}`} />
              <div className="flex-1 min-w-0">
                <b className="block text-sm text-[#f4f2ec] truncate">
                  {fire.il_name ?? 'Bilinmiyor'}
                </b>
                <span className="block text-[11px] font-bold text-[#a3a09a]">
                  {fire.confidence === 'h' ? 'Yüksek güven' : 'Orta güven'} ·{' '}
                  {formatTime(fire.acq_date, fire.acq_time)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
