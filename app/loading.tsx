export default function HomeLoading() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Navbar skeleton */}
      <div className="sticky top-0 z-50 bg-[#262624] border-b border-[#3f3f3c]">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3">
          <div className="h-9 px-3 rounded-lg bg-[#E24B4A] text-white font-extrabold flex items-center gap-2 shrink-0">
            <span>◆</span>
            <span className="text-sm">YangınRadar</span>
          </div>
          <div className="hidden md:block flex-1 max-w-sm h-10 bg-[#1a1a18] rounded border border-[#3f3f3c]" />
          <div className="flex items-center gap-2 text-[#E24B4A] font-extrabold text-sm ml-auto">
            <span className="w-2 h-2 rounded-full bg-[#E24B4A] animate-pulse" />
            <span className="hidden sm:inline">CANLI</span>
          </div>
        </div>
      </div>

      {/* Ad placeholder */}
      <div className="w-full h-[90px] bg-[#1a1a18] border-y border-[#3f3f3c] flex items-center justify-center text-[10px] text-[#3f3f3c] uppercase tracking-widest">
        Reklam Alanı · 728×90
      </div>

      {/* Map + sidebar skeleton */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div className="h-[65vh] min-h-[360px] lg:h-[calc(100vh-180px)] lg:flex-1 bg-[#081421] border-y lg:border-y-0 lg:border-r border-[#3f3f3c] flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#315370] text-sm font-bold">
            <div className="w-5 h-5 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
            Harita ve canlı veri yükleniyor…
          </div>
        </div>

        <aside className="w-full lg:w-80 bg-[#262624] flex flex-col lg:h-[calc(100vh-180px)]">
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="h-20 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
            <div className="h-20 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
            <div className="col-span-2 h-16 bg-[#30302d] rounded-lg border border-[#595954] animate-pulse" />
          </div>
          {/* Ad square */}
          <div className="border-t border-[#3f3f3c] flex items-center justify-center py-3">
            <div className="w-[300px] max-w-full h-[250px] bg-[#1a1a18] border border-[#3f3f3c] flex items-center justify-center text-[10px] text-[#3f3f3c] uppercase tracking-widest">
              Reklam · 300×250
            </div>
          </div>
        </aside>
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-[#262624] border-t border-[#3f3f3c] h-14" />
    </main>
  )
}
