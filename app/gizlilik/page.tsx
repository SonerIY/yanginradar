import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | YangınRadar',
  description:
    'YangınRadar gizlilik politikası — toplanan veriler, çerezler, üçüncü taraf hizmetler ve kullanıcı hakları.',
  alternates: { canonical: 'https://yanginradar.com/gizlilik' },
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '24 Mayıs 2026'

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <article className="max-w-3xl w-full mx-auto px-4 py-8 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#f4f2ec] mb-2">Gizlilik Politikası</h1>
        <p className="text-xs text-[#64645f] mb-6">Son güncelleme: {LAST_UPDATED}</p>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">1. Hangi verileri topluyoruz?</h2>
          <p className="text-[#a3a09a]">
            YangınRadar (&quot;biz&quot;, &quot;site&quot;) kullanıcı kaydı veya hesap oluşturma
            gerektirmez. Site üzerinde kişisel bilgilerinizi (ad, e-posta, telefon vb.) doğrudan
            sizden talep etmiyoruz. Ancak, herhangi bir web sitesinde olduğu gibi, otomatik olarak
            şu teknik bilgileri kaydederiz:
          </p>
          <ul className="mt-2 text-[#a3a09a] space-y-1 list-disc pl-5">
            <li>IP adresi (anonimleştirilmiş, ülke/şehir tespiti için)</li>
            <li>Tarayıcı türü ve sürümü, işletim sistemi</li>
            <li>Ziyaret edilen sayfalar ve süre</li>
            <li>Yönlendiren site (referrer)</li>
            <li>Tarih ve saat damgaları</li>
          </ul>
          <p className="text-[#a3a09a] mt-2">
            Bu veriler site performansını ve içerik kalitesini iyileştirmek için kullanılır.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">2. Çerezler</h2>
          <p className="text-[#a3a09a]">
            Site, deneyiminizi iyileştirmek ve bazı işlevler için çerezler kullanır. Çerez kullanım
            detayları için <Link href="/cerezler" className="text-[#EF9F27] underline">Çerez Politikamızı</Link>{' '}
            inceleyebilirsiniz.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">3. Üçüncü Taraf Hizmetler</h2>
          <p className="text-[#a3a09a]">YangınRadar şu üçüncü taraf hizmetleri kullanır:</p>
          <ul className="mt-2 text-[#a3a09a] space-y-2 list-disc pl-5">
            <li>
              <strong className="text-[#f4f2ec]">NASA FIRMS:</strong> uydu tabanlı orman yangını
              tespit verisi. Kullanıcı bilgisi paylaşılmaz; sadece sunucumuz veri çeker.
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Open-Meteo:</strong> hava durumu verisi. Kullanıcı
              bilgisi paylaşılmaz; sunucumuz koordinat üzerinden veri çeker.
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Google AdSense:</strong> reklam gösterimi için.
              Google ve iş ortakları, bu siteye ve diğer sitelere yapılan ziyaretlerinize dayalı
              ilgi alanı bazlı reklam göstermek için çerezler kullanır. Reklam çerezlerini
              devre dışı bırakmak için{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF9F27] underline"
              >
                Google Reklam Ayarları
              </a>{' '}
              sayfasını ziyaret edebilirsiniz.
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Google Search Console & Analytics:</strong>{' '}
              site trafiği analizi için anonim veri.
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Cloudflare:</strong> CDN ve güvenlik. IP
              adresleri Cloudflare üzerinden geçer; Cloudflare Privacy Policy geçerlidir.
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Google News (RSS):</strong> haber içeriklerinin
              başlık ve özetleri için. Kullanıcı bilgisi paylaşılmaz.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">4. Verilerinizin Saklanması</h2>
          <p className="text-[#a3a09a]">
            Kişisel veri toplamadığımız için, kullanıcılara ait kalıcı veri kaydı tutmuyoruz.
            Yangın noktaları ve haber arşivi gibi kamuya açık veriler veritabanımızda
            saklanır; bunlar sizinle ilişkilendirilemez.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">5. Çocukların Gizliliği</h2>
          <p className="text-[#a3a09a]">
            YangınRadar 13 yaş altı çocuklara yönelik bir hizmet değildir. Kasıtlı olarak
            13 yaş altı kullanıcılardan kişisel veri toplamayız.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">6. Kullanıcı Hakları (KVKK & GDPR)</h2>
          <p className="text-[#a3a09a]">
            6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR kapsamında şu haklara
            sahipsiniz:
          </p>
          <ul className="mt-2 text-[#a3a09a] space-y-1 list-disc pl-5">
            <li>Sizinle ilgili tutulan veriye erişim talep etme</li>
            <li>Yanlış verinin düzeltilmesini isteme</li>
            <li>Verinin silinmesini talep etme</li>
            <li>İşleme itiraz etme</li>
          </ul>
          <p className="text-[#a3a09a] mt-2">
            Bu talepleriniz için{' '}
            <a href="mailto:info@yanginradar.com" className="text-[#EF9F27] underline">
              info@yanginradar.com
            </a>{' '}
            adresine yazabilirsiniz.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">7. Değişiklikler</h2>
          <p className="text-[#a3a09a]">
            Bu politika önceden bildirilmeksizin güncellenebilir. Güncellemeler bu sayfada
            yayınlanır; yukarıdaki &quot;Son güncelleme&quot; tarihi değişir.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">8. İletişim</h2>
          <p className="text-[#a3a09a]">
            Gizlilik politikası ile ilgili sorularınız için:{' '}
            <a href="mailto:info@yanginradar.com" className="text-[#EF9F27] underline">
              info@yanginradar.com
            </a>
          </p>
        </section>
      </article>
    </main>
  )
}
