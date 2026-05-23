export default function AdSquare() {
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
