import AdUnit from './AdUnit'

/**
 * Makale arası (in-article) responsive reklam. İl sayfası ve istatistikler
 * gibi uzun içerik akışı içine konulur. Yüksek CTR formatı.
 */
export default function AdInArticle() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE

  if (!client || !slot) {
    return (
      <div className="w-full my-6 flex items-center justify-center bg-[#1a1a18] border border-[#3f3f3c] rounded-md">
        <div
          className="flex items-center justify-center text-[11px] font-bold text-[#64645f] tracking-widest uppercase"
          style={{ minHeight: 120, maxWidth: '100%', width: '100%' }}
          aria-label="Reklam alanı (içerik arası)"
        >
          Reklam · içerik arası
        </div>
      </div>
    )
  }

  return (
    <div className="w-full my-6">
      <AdUnit
        slot={slot}
        format="fluid"
        layout="in-article"
        responsive
        style={{ display: 'block', textAlign: 'center' }}
      />
    </div>
  )
}
