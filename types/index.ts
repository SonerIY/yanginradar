export interface FirePoint {
  id?: string
  lat: number
  lon: number
  brightness: number
  confidence: 'l' | 'n' | 'h'
  acq_date: string
  acq_time: string
  satellite: string
  frp: number
  il_slug?: string
  il_name?: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
}

export interface IlData {
  name: string
  slug: string
  lat: number
  lon: number
}

export interface RegionStats {
  il_slug: string
  il_name: string
  fire_count_today: number
  fire_count_week: number
  risk_score: number
}

export interface PushSubscriptionRecord {
  id?: string
  endpoint: string
  p256dh: string
  auth: string
  il_slug?: string | null
  il_name?: string | null
}

export interface NewsItem {
  title: string
  link: string
  source: string
  pubDate: string    // ISO 8601
  snippet: string
  imageUrl?: string
}
