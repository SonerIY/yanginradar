import Link from 'next/link'
import IlSearchBox from './IlSearchBox'

interface Props {
  updatedAt?: string
}

export default function Navbar({ updatedAt }: Props) {
  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center gap-3 px-4 py-3 bg-[#262624] border-b border-[#3f3f3c]">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E24B4A] text-white font-extrabold"
      >
        <span>◆</span>
        <span>YangınRadar</span>
      </Link>

      <div className="hidden md:block flex-1 max-w-sm">
        <IlSearchBox />
      </div>

      <div className="flex items-center gap-2 text-[#E24B4A] font-extrabold">
        <span className="w-2 h-2 rounded-full bg-[#E24B4A] animate-pulse" />
        <span>CANLI</span>
      </div>

      {updatedAt && (
        <div className="text-[13px] text-[#a3a09a] hidden sm:block">◷ Güncellendi: {updatedAt}</div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/istatistikler"
          className="text-sm font-bold text-[#a3a09a] hover:text-[#f4f2ec]"
        >
          İstatistikler
        </Link>
        <Link
          href="/hakkinda"
          className="text-sm font-bold text-[#a3a09a] hover:text-[#f4f2ec]"
        >
          Hakkında
        </Link>
      </div>
    </nav>
  )
}
