import type { NewsItem } from '@/types'
import { timeAgo } from '@/lib/news'

interface Props {
  items: NewsItem[]
  emptyMessage?: string
  compact?: boolean
  /** Görüntülenecek maksimum madde sayısı */
  max?: number
}

export default function NewsList({ items, emptyMessage, compact = false, max }: Props) {
  const list = max ? items.slice(0, max) : items

  if (list.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-[#64645f]">
        {emptyMessage ?? 'Şu an haber yok.'}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[#3f3f3c]">
      {list.map((item, idx) => (
        <li key={item.link || idx}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 px-4 py-3 hover:bg-[#30302d] transition group"
          >
            {item.imageUrl && !compact && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                className="w-16 h-16 rounded object-cover bg-[#1a1a18] shrink-0 border border-[#3f3f3c]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#f4f2ec] group-hover:text-[#EF9F27] leading-snug line-clamp-2">
                {item.title}
              </div>
              {!compact && item.snippet && (
                <div className="text-xs text-[#a3a09a] mt-1 line-clamp-2 leading-snug">
                  {item.snippet}
                </div>
              )}
              <div className="text-[10px] text-[#64645f] mt-1.5 flex items-center gap-1.5">
                <span className="font-bold text-[#EF9F27]">{item.source}</span>
                {item.pubDate && (
                  <>
                    <span>·</span>
                    <span>{timeAgo(item.pubDate)}</span>
                  </>
                )}
                <span className="ml-auto opacity-50 group-hover:opacity-100">↗</span>
              </div>
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}
