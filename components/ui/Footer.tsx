import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#1a1a18] border-t border-[#3f3f3c] mt-8">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="font-extrabold text-[#E24B4A] mb-2">◆ YangınRadar</div>
          <p className="text-xs text-[#a3a09a] leading-relaxed">
            Türkiye&apos;deki orman yangınlarını NASA FIRMS uydu verisiyle anlık takip eden
            bağımsız platform.
          </p>
        </div>

        <div>
          <div className="text-[11px] uppercase font-extrabold text-[#a3a09a] mb-2">Site</div>
          <ul className="space-y-1">
            <li><Link href="/" className="text-[#f4f2ec] hover:text-[#EF9F27]">Harita</Link></li>
            <li><Link href="/istatistikler" className="text-[#f4f2ec] hover:text-[#EF9F27]">İstatistikler</Link></li>
            <li><Link href="/arsiv" className="text-[#f4f2ec] hover:text-[#EF9F27]">Arşiv</Link></li>
            <li><Link href="/hakkinda" className="text-[#f4f2ec] hover:text-[#EF9F27]">Hakkında</Link></li>
            <li><Link href="/gizlilik" className="text-[#f4f2ec] hover:text-[#EF9F27]">Gizlilik Politikası</Link></li>
            <li><Link href="/cerezler" className="text-[#f4f2ec] hover:text-[#EF9F27]">Çerez Politikası</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] uppercase font-extrabold text-[#a3a09a] mb-2">Acil</div>
          <ul className="space-y-1 text-[#f4f2ec]">
            <li><strong className="text-[#E24B4A]">112</strong> · Acil çağrı</li>
            <li><strong className="text-[#E24B4A]">177</strong> · Orman Yangını İhbar</li>
            <li><strong className="text-[#E24B4A]">110</strong> · İtfaiye</li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] uppercase font-extrabold text-[#a3a09a] mb-2">Kaynaklar</div>
          <ul className="space-y-1 text-xs">
            <li>
              <a
                href="https://firms.modaps.eosdis.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a3a09a] hover:text-[#f4f2ec]"
              >
                NASA FIRMS ↗
              </a>
            </li>
            <li>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a3a09a] hover:text-[#f4f2ec]"
              >
                Open-Meteo (hava) ↗
              </a>
            </li>
            <li>
              <a
                href="https://carto.com/attributions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a3a09a] hover:text-[#f4f2ec]"
              >
                CARTO (harita) ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#3f3f3c] px-4 py-3 text-[11px] text-[#64645f] text-center">
        © {new Date().getFullYear()} YangınRadar · Veri kaynakları kamuya açık olup resmi bir
        kurum tarafından sağlanmamaktadır. Acil durumlarda 112/177 ile iletişime geçin.
      </div>
    </footer>
  )
}
