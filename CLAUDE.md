# YangınRadar — Proje Brifing (CLAUDE.md)

Bu dosya projenin tam bağlamını içerir. Her oturumda önce bunu oku.

---

## Proje Özeti

**YangınRadar** — Türkiye'deki orman yangınlarını NASA uydu verisiyle gerçek zamanlı takip eden web sitesi.
- Hedef kitle: Türkiye geneli, özellikle yangın bölgelerinde yaşayanlar
- Gelir modeli: Google AdSense + affiliate bağlantılar
- Hosting: Vercel (ücretsiz tier)
- Domain hedefi: yanginradar.com

---

## Tech Stack — Kesin Kararlar

```
Framework:    Next.js 14 (App Router) + TypeScript
Stil:         Tailwind CSS
Harita:       React-Leaflet + Leaflet.js (SSR kapalı, dynamic import)
Grafikler:    Recharts
Veritabanı:   Supabase (PostgreSQL, free tier)
Auth:         Yok (public site)
Deployment:   Vercel
Cron Jobs:    Vercel Cron (vercel.json içinde tanımlı)
Push Notif:   Web Push API + VAPID keys
UI Bileşen:   shadcn/ui (gerektiğinde)
```

---

## Klasör Yapısı

```
yanginradar/
├── app/
│   ├── layout.tsx              # Root layout — AdSense <script> buraya girer
│   ├── page.tsx                # Ana sayfa: harita + sidebar
│   ├── istatistikler/
│   │   └── page.tsx            # Grafikler, trend, karşılaştırma
│   ├── il/
│   │   └── [slug]/
│   │       ├── page.tsx        # İl detay sayfası (SSR, SEO kritik)
│   │       └── generateStaticParams.ts
│   ├── hakkinda/
│   │   └── page.tsx
│   └── api/
│       ├── fires/
│       │   └── route.ts        # GET: Supabase'den yangın noktaları
│       ├── weather/
│       │   └── route.ts        # GET: Open-Meteo proxy
│       ├── subscribe/
│       │   └── route.ts        # POST: Push bildirim kaydı
│       └── cron/
│           └── update-fires/
│               └── route.ts    # NASA FIRMS → parse → Supabase upsert
│
├── components/
│   ├── map/
│   │   ├── FireMap.tsx         # Ana harita bileşeni (dynamic import ile)
│   │   ├── FireMarker.tsx      # Tekil yangın noktası + popup
│   │   ├── WindLayer.tsx       # Rüzgar vektör katmanı (toggle)
│   │   └── RiskLayer.tsx       # İl bazlı risk renk katmanı (toggle)
│   ├── sidebar/
│   │   ├── StatsPanel.tsx      # Aktif nokta, etkilenen il, trend kartları
│   │   └── AlertList.tsx       # Kronolojik tespit listesi
│   ├── ads/
│   │   ├── AdBanner.tsx        # 728x90 leaderboard
│   │   └── AdSquare.tsx        # 300x250 medium rectangle
│   ├── ui/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── notifications/
│       └── SubscribeButton.tsx # Web Push izin + Supabase kayıt
│
├── lib/
│   ├── firms.ts                # NASA FIRMS API client + CSV parser
│   ├── supabase.ts             # Supabase client (server + client ayrı)
│   ├── weather.ts              # Open-Meteo API client
│   ├── risk.ts                 # Risk skoru hesaplama (sıcaklık+nem+rüzgar)
│   └── il-data.ts              # 81 il listesi + slug mapping
│
├── public/
│   └── turkey-il.geojson       # Türkiye il sınırları GeoJSON (statik)
│
├── types/
│   └── index.ts                # FirePoint, WeatherData, IlData, Subscription
│
└── vercel.json                 # Cron job tanımı
```

---

## Veri Kaynakları

### 1. NASA FIRMS — Ana Yangın Verisi
```
Base URL:  https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/TR/1
Güncelleme: Her 3 saatte bir (Near Real-Time)
Format:    CSV — lat, lon, bright_ti4, scan, track, acq_date, acq_time,
           satellite, instrument, confidence, version, bright_ti5, frp, daynight
Auth:      MAP_KEY — NASA Earthdata hesabından ücretsiz alınır
           https://firms.modaps.eosdis.nasa.gov/api/map_key/

Türkiye bounding box (alternatif endpoint):
https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/26,36,45,42/1

Ek veri (MODIS çapraz doğrulama):
https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/MODIS_NRT/TR/1
```

**Confidence değerleri:**
- `l` (low) → güven düşük, filtrele veya sarı göster
- `n` (nominal) → orta güven, turuncu göster
- `h` (high) → yüksek güven, kırmızı göster

### 2. Open-Meteo — Hava Koşulları
```
Base URL: https://api.open-meteo.com/v1/forecast
API Key:  YOK (tamamen ücretsiz)

Örnek istek (rüzgar + nem + sıcaklık):
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m
  &hourly=windspeed_10m,winddirection_10m
  &wind_speed_unit=ms
  &forecast_days=1
```

### 3. Türkiye İl GeoJSON
```
Kaynak: https://github.com/cihadturhan/tr-geographic-data
Dosya:  public/turkey-il.geojson olarak projeye ekle (statik, değişmez)
Her feature'da: properties.name (il adı), properties.slug
```

---

## Supabase Veritabanı Şeması

```sql
-- Yangın noktaları tablosu
CREATE TABLE fires (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lat         decimal(9,6) NOT NULL,
  lon         decimal(9,6) NOT NULL,
  brightness  decimal(8,2),
  confidence  text CHECK (confidence IN ('l','n','h')),
  acq_date    date NOT NULL,
  acq_time    text,
  satellite   text,
  frp         decimal(8,2),          -- Fire Radiative Power (MW)
  il_slug     text,                  -- Reverse geocode sonucu
  il_name     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX fires_acq_date_idx ON fires(acq_date DESC);
CREATE INDEX fires_il_slug_idx ON fires(il_slug);

-- Benzersizlik: aynı nokta iki kez yazılmasın
CREATE UNIQUE INDEX fires_unique_idx ON fires(lat, lon, acq_date, acq_time);

-- Push bildirim abonelikleri
CREATE TABLE subscriptions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint    text UNIQUE NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  il_slug     text,                  -- null = tüm Türkiye
  il_name     text,
  created_at  timestamptz DEFAULT now()
);

-- İl önbellek tablosu (her cron'dan sonra güncellenir)
CREATE TABLE region_stats (
  il_slug       text PRIMARY KEY,
  il_name       text NOT NULL,
  fire_count_today   int DEFAULT 0,
  fire_count_week    int DEFAULT 0,
  risk_score         int DEFAULT 0,   -- 0-100
  updated_at         timestamptz DEFAULT now()
);
```

---

## Environment Variables (.env.local)

```bash
# NASA FIRMS
FIRMS_MAP_KEY=your_map_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Sadece server-side

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:info@yanginradar.com

# Cron güvenliği
CRON_SECRET=rastgele_uzun_bir_string

# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
```

---

## vercel.json — Cron Tanımı

```json
{
  "crons": [
    {
      "path": "/api/cron/update-fires",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

Cron route başına güvenlik kontrolü ekle:
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## UI / UX Kararları

### Renk Paleti — Yangın Noktaları
```
Yüksek güven (h):  #E24B4A  (kırmızı) + animasyonlu ring efekti
Orta güven (n):    #EF9F27  (turuncu)
Düşük güven (l):   #EF9F27  opacity: 0.5 veya tamamen gizle (toggle)
```

### Harita
- Arka plan: Leaflet CartoDB Dark Matter tile (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- Tile attribution zorunlu (CartoDB lisansı)
- Marker clustering: `react-leaflet-cluster` — 50+ nokta varken grupla
- Harita içinde KESİNLİKLE reklam yok (Google politikası + UX)
- Default zoom: 6, center: [39.0, 35.0] (Türkiye merkezi)

### Layout
- Desktop: Harita sol (flex-1) + Sidebar sağ (w-64)
- Mobile: Sidebar üstte kompakt, harita altında tam ekran
- Navbar: sticky top-0, z-50

### SSR Uyarısı
```typescript
// FireMap.tsx HİÇBİR ZAMAN doğrudan import edilmez
// Daima böyle kullan:
const FireMap = dynamic(() => import('@/components/map/FireMap'), {
  ssr: false,
  loading: () => <MapSkeleton />
})
```

---

## AdSense Yerleşim Kuralları

```
① Leaderboard (728x90)   → Navbar altı, harita üstü — HER sayfada
② Medium Rectangle (300x250) → Sağ sidebar, stats kartları ile alert list arası
③ Responsive Banner       → Sayfa footer'ı üstü
④ In-article (auto)       → /istatistikler sayfasında grafikler arası
⑤ In-article (auto)       → /il/[slug] sayfasında içerik arası

AdSense script root layout.tsx <head>'e girer:
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
  crossOrigin="anonymous" data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT} />
```

---

## SEO Stratejisi

### İl Sayfaları — Kritik
Her `/il/[slug]` sayfasının `generateMetadata` fonksiyonu:
```typescript
export async function generateMetadata({ params }) {
  return {
    title: `${ilAdi} Orman Yangını Takibi | YangınRadar`,
    description: `${ilAdi} ilindeki aktif orman yangınlarını NASA uydu verisiyle anlık takip edin.`,
    openGraph: { ... }
  }
}
```

### generateStaticParams
81 il için build zamanında pre-render:
```typescript
export async function generateStaticParams() {
  return IL_LIST.map(il => ({ slug: il.slug }))
}
```

---

## Risk Skoru Hesaplama (lib/risk.ts)

```typescript
// 0-100 arası risk skoru
export function calculateRiskScore({
  temperature,      // °C
  humidity,         // %
  windSpeed,        // m/s
  fireCount         // Son 24h yangın noktası sayısı
}): number {
  const tempScore     = Math.min((temperature - 25) * 3, 30)   // max 30 puan
  const humidityScore = Math.min((60 - humidity) * 0.5, 25)    // max 25 puan
  const windScore     = Math.min(windSpeed * 2, 25)             // max 25 puan
  const fireScore     = Math.min(fireCount * 5, 20)             // max 20 puan
  return Math.max(0, Math.round(tempScore + humidityScore + windScore + fireScore))
}
```

---

## Yapılacaklar Sırası (Build Order)

### Faz 1 — MVP (Önce Bunu Bitir)
1. `npx create-next-app` ile proje oluştur
2. Tailwind, shadcn/ui kur
3. `lib/firms.ts` — NASA FIRMS CSV parser yaz
4. `app/api/cron/update-fires/route.ts` — veri çekme + Supabase upsert
5. `app/api/fires/route.ts` — frontend'e veri servis et
6. `components/map/FireMap.tsx` — React-Leaflet, CartoDB dark tile, marker'lar
7. `app/page.tsx` — harita + sidebar layout
8. Vercel'e deploy et → canlı MVP hazır

### Faz 2 — İçerik & SEO
9. `app/il/[slug]/page.tsx` — 81 il sayfası, SSR, metadata
10. `app/istatistikler/page.tsx` — Recharts grafikler
11. Reverse geocoding (lat/lon → il adı)

### Faz 3 — Gelir & Bildirimler
12. AdSense entegrasyonu (tüm sayfalar)
13. Web Push bildirim sistemi
14. Affiliate bağlantılar (yangın tüpü, duman dedektörü)

---

## Önemli Notlar

- `lib/supabase.ts` içinde server ve client için iki ayrı instance oluştur
- Cron route'u `/api/cron/...` pattern'inde tut
- NASA FIRMS'ten gelen CSV'yi parse ederken `acq_date + acq_time + lat + lon` kombinasyonunu unique key olarak kullan
- Harita tile'ları için CartoDB Dark Matter: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- `react-leaflet` ve `leaflet` paketlerini birlikte kur, CSS'i `layout.tsx`'e import et
- Tüm API key'leri `.env.local`'da tut, `NEXT_PUBLIC_` prefix'i olmayan değişkenler sadece server-side çalışır

## Faz 1 — Deploy Kararları (Cloudflare Workers)

- **Hosting:** Cloudflare Workers + Static Assets (Pages değil) — `@opennextjs/cloudflare` adapter
- **Cron:** ayrı `cron-worker/` Worker, Cron Triggers ile her 3 saatte bir ana Worker'ın `/api/cron/update-fires` endpoint'ine `Bearer ${CRON_SECRET}` POST eder
- **Domain:** `yanginradar.com` — Cloudflare Registrar (at-cost, ~$10/yıl)
- **Build engine:** `next build --webpack` ZORUNLU. Next.js 16 default Turbopack'i, OpenNext Cloudflare adapter'ı henüz tam parse edemiyor; runtime'da `TypeError: components.ComponentMod.handler is not a function` döner. Webpack ile build edince OpenNext'in beklediği bundle formatı üretilir.
- **NASA FIRMS endpoint:** country code `/TR/` artık desteklenmiyor; bbox kullan: `26,36,45,42` (west,south,east,north)
- **Next.js 16 + Server Component'larda `dynamic(ssr: false)` yasak** — client-only bileşenleri `'use client'` wrapper içinden dynamic import et (bkz. [FireMapClient.tsx](components/map/FireMapClient.tsx))
- **Env vars:** lokalde `.env.local`, üretimde Cloudflare Dashboard → Worker → Settings → Variables and Secrets (Secret tipinde — Dashboard'da maskelenir; Plaintext de çalışır ama açıkta görünür)
