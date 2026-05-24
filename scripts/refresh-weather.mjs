#!/usr/bin/env node
// GitHub Actions tarafından her 3 saatte bir çalıştırılır.
// Cloudflare Workers IP'leri Open-Meteo'da rate-limit'li olduğu için
// hava verisi GitHub runner'larından çekilir, Supabase region_stats'e yazılır.

import { createClient } from '@supabase/supabase-js'

// 81 ilin (kendi lib/il-data.ts ile birebir) koordinatları
const IL_LIST = [
  { slug: 'adana', name: 'Adana', lat: 37.0000, lon: 35.3213 },
  { slug: 'adiyaman', name: 'Adıyaman', lat: 37.7648, lon: 38.2786 },
  { slug: 'afyonkarahisar', name: 'Afyonkarahisar', lat: 38.7507, lon: 30.5567 },
  { slug: 'agri', name: 'Ağrı', lat: 39.7191, lon: 43.0503 },
  { slug: 'amasya', name: 'Amasya', lat: 40.6499, lon: 35.8353 },
  { slug: 'ankara', name: 'Ankara', lat: 39.9334, lon: 32.8597 },
  { slug: 'antalya', name: 'Antalya', lat: 36.8969, lon: 30.7133 },
  { slug: 'artvin', name: 'Artvin', lat: 41.1828, lon: 41.8183 },
  { slug: 'aydin', name: 'Aydın', lat: 37.8560, lon: 27.8416 },
  { slug: 'balikesir', name: 'Balıkesir', lat: 39.6484, lon: 27.8826 },
  { slug: 'bilecik', name: 'Bilecik', lat: 40.0567, lon: 30.0665 },
  { slug: 'bingol', name: 'Bingöl', lat: 38.8847, lon: 40.4986 },
  { slug: 'bitlis', name: 'Bitlis', lat: 38.4006, lon: 42.1095 },
  { slug: 'bolu', name: 'Bolu', lat: 40.7392, lon: 31.6089 },
  { slug: 'burdur', name: 'Burdur', lat: 37.7203, lon: 30.2906 },
  { slug: 'bursa', name: 'Bursa', lat: 40.1826, lon: 29.0665 },
  { slug: 'canakkale', name: 'Çanakkale', lat: 40.1553, lon: 26.4142 },
  { slug: 'cankiri', name: 'Çankırı', lat: 40.6013, lon: 33.6134 },
  { slug: 'corum', name: 'Çorum', lat: 40.5499, lon: 34.9533 },
  { slug: 'denizli', name: 'Denizli', lat: 37.7765, lon: 29.0864 },
  { slug: 'diyarbakir', name: 'Diyarbakır', lat: 37.9144, lon: 40.2306 },
  { slug: 'edirne', name: 'Edirne', lat: 41.6764, lon: 26.5559 },
  { slug: 'elazig', name: 'Elazığ', lat: 38.6810, lon: 39.2264 },
  { slug: 'erzincan', name: 'Erzincan', lat: 39.7500, lon: 39.5000 },
  { slug: 'erzurum', name: 'Erzurum', lat: 39.9000, lon: 41.2700 },
  { slug: 'eskisehir', name: 'Eskişehir', lat: 39.7767, lon: 30.5206 },
  { slug: 'gaziantep', name: 'Gaziantep', lat: 37.0662, lon: 37.3833 },
  { slug: 'giresun', name: 'Giresun', lat: 40.9128, lon: 38.3895 },
  { slug: 'gumushane', name: 'Gümüşhane', lat: 40.4386, lon: 39.5086 },
  { slug: 'hakkari', name: 'Hakkari', lat: 37.5833, lon: 43.7333 },
  { slug: 'hatay', name: 'Hatay', lat: 36.4018, lon: 36.3498 },
  { slug: 'isparta', name: 'Isparta', lat: 37.7648, lon: 30.5566 },
  { slug: 'mersin', name: 'Mersin', lat: 36.8000, lon: 34.6333 },
  { slug: 'istanbul', name: 'İstanbul', lat: 41.0082, lon: 28.9784 },
  { slug: 'izmir', name: 'İzmir', lat: 38.4192, lon: 27.1287 },
  { slug: 'kars', name: 'Kars', lat: 40.6013, lon: 43.0975 },
  { slug: 'kastamonu', name: 'Kastamonu', lat: 41.3887, lon: 33.7827 },
  { slug: 'kayseri', name: 'Kayseri', lat: 38.7312, lon: 35.4787 },
  { slug: 'kirklareli', name: 'Kırklareli', lat: 41.7333, lon: 27.2167 },
  { slug: 'kirsehir', name: 'Kırşehir', lat: 39.1425, lon: 34.1709 },
  { slug: 'kocaeli', name: 'Kocaeli', lat: 40.8533, lon: 29.8815 },
  { slug: 'konya', name: 'Konya', lat: 37.8714, lon: 32.4846 },
  { slug: 'kutahya', name: 'Kütahya', lat: 39.4242, lon: 29.9833 },
  { slug: 'malatya', name: 'Malatya', lat: 38.3552, lon: 38.3095 },
  { slug: 'manisa', name: 'Manisa', lat: 38.6191, lon: 27.4289 },
  { slug: 'kahramanmaras', name: 'Kahramanmaraş', lat: 37.5858, lon: 36.9371 },
  { slug: 'mardin', name: 'Mardin', lat: 37.3212, lon: 40.7245 },
  { slug: 'mugla', name: 'Muğla', lat: 37.2153, lon: 28.3636 },
  { slug: 'mus', name: 'Muş', lat: 38.7432, lon: 41.5065 },
  { slug: 'nevsehir', name: 'Nevşehir', lat: 38.6939, lon: 34.6857 },
  { slug: 'nigde', name: 'Niğde', lat: 37.9667, lon: 34.6833 },
  { slug: 'ordu', name: 'Ordu', lat: 40.9839, lon: 37.8764 },
  { slug: 'rize', name: 'Rize', lat: 41.0201, lon: 40.5234 },
  { slug: 'sakarya', name: 'Sakarya', lat: 40.7569, lon: 30.3783 },
  { slug: 'samsun', name: 'Samsun', lat: 41.2867, lon: 36.3300 },
  { slug: 'siirt', name: 'Siirt', lat: 37.9333, lon: 41.9500 },
  { slug: 'sinop', name: 'Sinop', lat: 42.0264, lon: 35.1551 },
  { slug: 'sivas', name: 'Sivas', lat: 39.7477, lon: 37.0179 },
  { slug: 'tekirdag', name: 'Tekirdağ', lat: 40.9833, lon: 27.5167 },
  { slug: 'tokat', name: 'Tokat', lat: 40.3167, lon: 36.5500 },
  { slug: 'trabzon', name: 'Trabzon', lat: 41.0015, lon: 39.7178 },
  { slug: 'tunceli', name: 'Tunceli', lat: 39.1079, lon: 39.5401 },
  { slug: 'sanliurfa', name: 'Şanlıurfa', lat: 37.1591, lon: 38.7969 },
  { slug: 'usak', name: 'Uşak', lat: 38.6823, lon: 29.4082 },
  { slug: 'van', name: 'Van', lat: 38.4891, lon: 43.4089 },
  { slug: 'yozgat', name: 'Yozgat', lat: 39.8181, lon: 34.8147 },
  { slug: 'zonguldak', name: 'Zonguldak', lat: 41.4564, lon: 31.7987 },
  { slug: 'aksaray', name: 'Aksaray', lat: 38.3687, lon: 34.0370 },
  { slug: 'bayburt', name: 'Bayburt', lat: 40.2552, lon: 40.2249 },
  { slug: 'karaman', name: 'Karaman', lat: 37.1759, lon: 33.2287 },
  { slug: 'kirikkale', name: 'Kırıkkale', lat: 39.8468, lon: 33.5153 },
  { slug: 'batman', name: 'Batman', lat: 37.8812, lon: 41.1351 },
  { slug: 'sirnak', name: 'Şırnak', lat: 37.4187, lon: 42.4918 },
  { slug: 'bartin', name: 'Bartın', lat: 41.6344, lon: 32.3375 },
  { slug: 'ardahan', name: 'Ardahan', lat: 41.1105, lon: 42.7022 },
  { slug: 'igdir', name: 'Iğdır', lat: 39.9237, lon: 44.0450 },
  { slug: 'yalova', name: 'Yalova', lat: 40.6500, lon: 29.2667 },
  { slug: 'karabuk', name: 'Karabük', lat: 41.2061, lon: 32.6204 },
  { slug: 'kilis', name: 'Kilis', lat: 36.7184, lon: 37.1212 },
  { slug: 'osmaniye', name: 'Osmaniye', lat: 37.0742, lon: 36.2461 },
  { slug: 'duzce', name: 'Düzce', lat: 40.8438, lon: 31.1565 },
]

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env değişkenleri zorunlu')
  process.exit(1)
}

async function fetchBulk(chunk) {
  const lats = chunk.map((p) => p.lat).join(',')
  const lons = chunk.map((p) => p.lon).join(',')
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m` +
    `&wind_speed_unit=ms&timezone=auto`
  const res = await fetch(url, {
    headers: { 'user-agent': 'YanginRadar-Refresh/1.0 (+https://yanginradar.com)' },
  })
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status} ${res.statusText} (chunk ${chunk.length})`)
  }
  const data = await res.json()
  const arr = Array.isArray(data) ? data : [data]
  return chunk.map((il, i) => {
    const c = arr[i]?.current
    if (!c) return { ...il, weather: null }
    return {
      ...il,
      weather: {
        temperature: c.temperature_2m,
        humidity: c.relative_humidity_2m,
        windSpeed: c.windspeed_10m,
        windDirection: c.winddirection_10m,
      },
    }
  })
}

async function main() {
  console.log(`[refresh-weather] ${IL_LIST.length} il için Open-Meteo'dan veri çekiliyor...`)

  const CHUNK = 30
  const enriched = []
  for (let i = 0; i < IL_LIST.length; i += CHUNK) {
    const chunk = IL_LIST.slice(i, i + CHUNK)
    const result = await fetchBulk(chunk)
    enriched.push(...result)
    if (i + CHUNK < IL_LIST.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  const okCount = enriched.filter((e) => e.weather !== null).length
  console.log(`[refresh-weather] ${okCount}/${enriched.length} il için veri alındı`)

  if (okCount === 0) {
    console.error('[refresh-weather] HİÇ veri alınamadı; abort, mevcut DB korunur')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // region_stats'a sadece weather kolonlarını update et (fire_count_* ve risk_score
  // Worker cron'unun sorumluluğunda; üzerine yazmıyoruz). Bunun için upsert yerine
  // tek tek update kullanıyoruz; "satır yoksa skip" — region_stats Worker cron
  // tarafından dolduruluyor zaten.
  let updated = 0
  for (const e of enriched) {
    if (!e.weather) continue
    const { error } = await supabase
      .from('region_stats')
      .update({
        temperature: e.weather.temperature,
        humidity: e.weather.humidity,
        wind_speed: e.weather.windSpeed,
        wind_direction: e.weather.windDirection,
        updated_at: new Date().toISOString(),
      })
      .eq('il_slug', e.slug)
    if (!error) updated++
    else console.error(`[refresh-weather] ${e.slug} update error:`, error.message)
  }

  console.log(`[refresh-weather] ${updated} il için weather DB'ye yazıldı`)
}

main().catch((err) => {
  console.error('[refresh-weather] FATAL:', err)
  process.exit(1)
})
