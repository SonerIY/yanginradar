import Link from 'next/link'
import IlSearchBox from './IlSearchBox'

interface Props {
  updatedAt?: string
}

export default function Navbar({ updatedAt }: Props) {
  return (
    <nav className="sticky top-0 z-50 bg-[#262624] border-b border-[#3f3f3c]">
      {/* Üst satır — daima tek satır, küçük ekranlarda kompakt */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-[#E24B4A] text-white font-extrabold text-sm sm:text-base shrink-0"
        >
          <span>◆</span>
          <span>YangınRadar</span>
        </Link>

        {/* md+ ekranlarda search inline */}
        <div className="hidden md:block flex-1 max-w-sm">
          <IlSearchBox />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-[#E24B4A] font-extrabold text-sm shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#E24B4A] animate-pulse" />
          <span className="hidden sm:inline">CANLI</span>
        </div>

        {updatedAt && (
          <div className="text-[12px] sm:text-[13px] text-[#a3a09a] hidden sm:block shrink-0">
            ◷ {updatedAt}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/istatistikler"
            className="text-xs sm:text-sm font-bold text-[#a3a09a] hover:text-[#f4f2ec]"
          >
            İstatistikler
          </Link>
          <Link
            href="/arsiv"
            className="text-xs sm:text-sm font-bold text-[#a3a09a] hover:text-[#f4f2ec] hidden sm:inline"
          >
            Arşiv
          </Link>
          <Link
            href="/hakkinda"
            className="text-xs sm:text-sm font-bold text-[#a3a09a] hover:text-[#f4f2ec]"
          >
            Hakkında
          </Link>
        </div>
      </div>

      {/* Mobile-only ikinci satır: arama kutusu */}
      <div className="md:hidden px-3 pb-2">
        <IlSearchBox />
      </div>
    </nav>
  )
}
