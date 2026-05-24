import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'Çerez Politikası | YangınRadar',
  description:
    'YangınRadar çerez politikası — kullanılan çerezler, amaçları, üçüncü taraf çerezleri ve nasıl kontrol edebileceğiniz.',
  alternates: { canonical: 'https://yanginradar.com/cerezler' },
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '24 Mayıs 2026'

export default function CookiePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <article className="max-w-3xl w-full mx-auto px-4 py-8 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#f4f2ec] mb-2">Çerez Politikası</h1>
        <p className="text-xs text-[#64645f] mb-6">Son güncelleme: {LAST_UPDATED}</p>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Çerez nedir?</h2>
          <p className="text-[#a3a09a]">
            Çerezler (cookies), web sitelerinin tarayıcınızda sakladığı küçük metin
            dosyalarıdır. Tercihlerinizi hatırlamak, oturum yönetimi yapmak veya kullanım
            verisi toplamak için kullanılırlar.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">YangınRadar hangi çerezleri kullanır?</h2>

          <h3 className="text-sm font-bold text-[#f4f2ec] mt-4 mb-1">1. Zorunlu çerezler</h3>
          <p className="text-[#a3a09a]">
            Sitenin temel işlevleri için gereklidir (örn. Cloudflare güvenlik çerezi
            <code className="bg-[#1a1a18] px-1 rounded text-[#EF9F27]">__cf_bm</code>).
            Devre dışı bırakılamaz.
          </p>

          <h3 className="text-sm font-bold text-[#f4f2ec] mt-4 mb-1">2. Analitik çerezler</h3>
          <p className="text-[#a3a09a]">
            Google Search Console gibi araçlar kullanım istatistiklerini (sayfa görüntüleme,
            kalış süresi) anonim olarak toplar. Bu veriler kişiyle ilişkilendirilmez.
          </p>

          <h3 className="text-sm font-bold text-[#f4f2ec] mt-4 mb-1">3. Reklam çerezleri (Google AdSense)</h3>
          <p className="text-[#a3a09a]">
            Reklam gösterimi için Google ve iş ortakları çerez ve benzeri teknolojiler kullanır.
            Bu çerezler ilgi alanı bazlı reklam göstermek için ziyaret geçmişinizi
            anonimleştirilmiş şekilde işler.
          </p>
          <ul className="mt-2 text-[#a3a09a] space-y-1 list-disc pl-5">
            <li>
              <code className="bg-[#1a1a18] px-1 rounded text-[#EF9F27]">__gads</code>,{' '}
              <code className="bg-[#1a1a18] px-1 rounded text-[#EF9F27]">__gpi</code> — Google AdSense kullanım takibi
            </li>
            <li>
              <code className="bg-[#1a1a18] px-1 rounded text-[#EF9F27]">IDE</code>,{' '}
              <code className="bg-[#1a1a18] px-1 rounded text-[#EF9F27]">DSID</code> — DoubleClick (Google) reklam personalizasyonu
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Reklam çerezlerini nasıl kontrol edebilirim?</h2>
          <p className="text-[#a3a09a]">
            Google reklam çerezlerini kontrol etmek için şu adresleri kullanabilirsiniz:
          </p>
          <ul className="mt-2 text-[#a3a09a] space-y-1 list-disc pl-5">
            <li>
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Google Reklam Ayarları
              </a>{' '}
              — ilgi alanı bazlı reklamları kapat
            </li>
            <li>
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                YourAdChoices (NAI/DAA)
              </a>{' '}
              — tüm üçüncü taraf reklam çerezleri için
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Tarayıcı ayarlarından çerez yönetimi</h2>
          <p className="text-[#a3a09a]">
            Tüm modern tarayıcılar çerezleri kontrol etme imkânı sunar. Çerezleri tamamen
            engellerseniz sitenin bazı özellikleri çalışmayabilir.
          </p>
          <ul className="mt-2 text-[#a3a09a] space-y-1 list-disc pl-5">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/tr/kb/cerezleri-silme-web-sitelerinin-bilgilerini-kaldirma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/tr-tr/microsoft-edge/microsoft-edge-de-tan%C4%B1mlama-bilgilerini-silme-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">İletişim</h2>
          <p className="text-[#a3a09a]">
            Çerez politikası hakkında sorularınız için:{' '}
            <a href="mailto:info@yanginradar.com" className="text-[#EF9F27] underline">
              info@yanginradar.com
            </a>
          </p>
          <p className="text-[#a3a09a] mt-2">
            Bkz.{' '}
            <Link href="/gizlilik" className="text-[#EF9F27] underline">
              Gizlilik Politikamız
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
