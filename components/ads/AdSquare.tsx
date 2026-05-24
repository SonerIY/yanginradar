import AdUnit from './AdUnit'

/**
 * 300×250 medium rectangle (sidebar için).
 */
export default function AdSquare() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE

  if (!client || !slot) {
    return (
      <div className="flex items-center justify-center px-3 py-3">
        <div
          className="flex items-center justify-center bg-[#1a1a18] border border-[#3f3f3c] text-[11px] font-bold text-[#64645f] tracking-widest uppercase"
          style={{ width: 300, height: 250, maxWidth: '100%' }}
          aria-label="Reklam alanı (300x250)"
        >
          Reklam · 300×250
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center px-3 py-3">
      <AdUnit
        slot={slot}
        format="rectangle"
        responsive={false}
        style={{ display: 'block', width: 300, height: 250 }}
      />
    </div>
  )
}
