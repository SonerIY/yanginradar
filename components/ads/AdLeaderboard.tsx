import AdUnit from './AdUnit'

/**
 * 728×90 leaderboard (mobil'de responsive küçülür).
 * Env yoksa placeholder; varsa gerçek AdSense unit.
 */
export default function AdLeaderboard() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD

  if (!client || !slot) {
    return (
      <div className="w-full flex items-center justify-center bg-[#1a1a18] border-y border-[#3f3f3c]">
        <div
          className="flex items-center justify-center text-xs font-bold text-[#64645f] tracking-widest uppercase"
          style={{ width: 728, height: 90, maxWidth: '100%' }}
          aria-label="Reklam alanı (728x90)"
        >
          Reklam Alanı · 728×90
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-center bg-[#1a1a18] border-y border-[#3f3f3c] overflow-hidden">
      <AdUnit
        slot={slot}
        format="horizontal"
        style={{ display: 'block', width: '100%', maxWidth: 728, height: 90 }}
        responsive
      />
    </div>
  )
}
