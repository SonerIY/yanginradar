import type { Metadata } from 'next'
import Navbar from '@/components/ui/Navbar'
import AdLeaderboard from '@/components/ads/AdLeaderboard'

export const metadata: Metadata = {
  title: 'Hakkında | YangınRadar',
  description:
    "YangınRadar nedir, hangi verileri kullanır, güncellenme sıklığı nedir? Tüm sorulara yanıt.",
  alternates: { canonical: 'https://yanginradar.com/hakkinda' },
}

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <AdLeaderboard />

      <div className="max-w-3xl w-full mx-auto px-4 py-8 text-sm leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#f4f2ec] mb-6">YangınRadar Hakkında</h1>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Nedir?</h2>
          <p className="text-[#a3a09a]">
            YangınRadar, Türkiye genelindeki aktif orman yangınlarını NASA&apos;nın uydu verisiyle
            yaklaşık gerçek zamanlı olarak takip etmenizi sağlayan bağımsız bir web uygulamasıdır.
            Veriler kamuya açık kaynaklardan otomatik çekilir, kâr amacı gütmez ancak siteyi
            ayakta tutmak için reklam görüntülenebilir.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Veriler nereden geliyor?</h2>
          <ul className="text-[#a3a09a] space-y-2 list-disc pl-5">
            <li>
              <strong className="text-[#f4f2ec]">Yangın noktaları:</strong> NASA FIRMS (Fire Information for Resource Management System) — VIIRS_SNPP_NRT uydu verisi
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Hava durumu:</strong> Open-Meteo — ücretsiz, açık kaynak hava modeli (GFS/ICON)
            </li>
            <li>
              <strong className="text-[#f4f2ec]">Harita altlığı:</strong> CARTO Dark Matter (© OpenStreetMap katkıcıları)
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Ne sıklıkta güncellenir?</h2>
          <p className="text-[#a3a09a]">
            NASA FIRMS verisi her 3 saatte bir otomatik çekilir ve veritabanına işlenir.
            Hava durumu verisi sayfa yenilendiğinde Open-Meteo&apos;dan canlı alınır (10 dakika cache).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Güven seviyesi ne demek?</h2>
          <p className="text-[#a3a09a]">
            NASA uydusu her ısı tespiti için bir güven puanı verir:
          </p>
          <ul className="text-[#a3a09a] space-y-1 list-disc pl-5 mt-2">
            <li><strong className="text-[#E24B4A]">Yüksek (kırmızı):</strong> büyük olasılıkla gerçek bir yangın</li>
            <li><strong className="text-[#EF9F27]">Orta (turuncu):</strong> ısı kaynağı (anız, endüstri, küçük yangın olabilir)</li>
            <li className="text-[#64645f]">Düşük: filtrelenir, gösterilmez</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">Risk skoru nasıl hesaplanır?</h2>
          <p className="text-[#a3a09a]">
            Her il için 0-100 arası bir risk skoru hesaplanır:
          </p>
          <ul className="text-[#a3a09a] space-y-1 list-disc pl-5 mt-2">
            <li>Sıcaklık (max 30 puan) — 25°C üzeri her derece +3</li>
            <li>Düşük nem (max 25 puan) — %60 altı her % +0.5</li>
            <li>Rüzgar (max 25 puan) — her 1 m/s +2</li>
            <li>Aktif yangın sayısı (max 20 puan) — son 24 saatte her tespit +5</li>
          </ul>
        </section>

        <section className="mb-6 p-4 bg-[#3a1f1d] border border-[#7b3531] rounded-lg">
          <h2 className="text-lg font-bold text-[#E24B4A] mb-2">⚠️ Önemli Uyarı</h2>
          <p className="text-[#f4f2ec]">
            YangınRadar resmi bir kurum değildir. Sunulan veriler bilgilendirme amaçlıdır.
            Acil durumlarda lütfen <strong>112</strong> (Acil Çağrı) veya{' '}
            <strong>177</strong> (Orman Yangını İhbar Hattı) numaralarını arayın.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#EF9F27] mb-2">İletişim</h2>
          <p className="text-[#a3a09a]">
            Geri bildirim ve önerileriniz için: <a href="mailto:info@yanginradar.com" className="text-[#EF9F27] underline">info@yanginradar.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}
