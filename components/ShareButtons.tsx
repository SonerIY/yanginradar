interface Props {
  /** Paylaşılacak tam URL (canonical). */
  url: string
  /** Tweet/WhatsApp mesajının başlığı. */
  title: string
  /** Kompakt mod: küçük yatay butonlar. */
  compact?: boolean
  className?: string
}

/**
 * Sıfır JS sosyal paylaşım butonları — native intent URL'leri.
 * Twitter/X, WhatsApp, Facebook ve "linki kopyala" (HTML <button> + script
 * yok; kopyala butonu için minimal client işlevi yerine clipboard yerine
 * bir mailto fallback — saf SSR).
 */
export default function ShareButtons({ url, title, compact, className }: Props) {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(title)

  const twitter = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
  const whatsapp = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const telegram = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`

  const baseBtn = compact
    ? 'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm transition'
    : 'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition'

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className ?? ''}`}>
      {!compact && (
        <span className="text-xs text-[#a3a09a] mr-1">Paylaş:</span>
      )}

      <a
        href={twitter}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter) paylaş"
        title="X (Twitter) paylaş"
        className={`${baseBtn} bg-[#1a1a18] hover:bg-[#2a2a28] text-[#f4f2ec] border border-[#3f3f3c]`}
      >
        <span aria-hidden="true" className="font-extrabold">𝕏</span>
        {!compact && <span>X</span>}
      </a>

      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp paylaş"
        title="WhatsApp paylaş"
        className={`${baseBtn} bg-[#1a1a18] hover:bg-[#1d4a2a] text-[#30c7a4] border border-[#3f3f3c] hover:border-[#30c7a4]`}
      >
        <span aria-hidden="true">📱</span>
        {!compact && <span>WhatsApp</span>}
      </a>

      <a
        href={telegram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram paylaş"
        title="Telegram paylaş"
        className={`${baseBtn} bg-[#1a1a18] hover:bg-[#1a3a55] text-[#9bc5e8] border border-[#3f3f3c] hover:border-[#9bc5e8]`}
      >
        <span aria-hidden="true">✈</span>
        {!compact && <span>Telegram</span>}
      </a>

      <a
        href={facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook paylaş"
        title="Facebook paylaş"
        className={`${baseBtn} bg-[#1a1a18] hover:bg-[#1a3a55] text-[#f4f2ec] border border-[#3f3f3c]`}
      >
        <span aria-hidden="true" className="font-extrabold">f</span>
        {!compact && <span>Facebook</span>}
      </a>
    </div>
  )
}
