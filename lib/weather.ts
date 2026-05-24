import type { WeatherData } from '@/types'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

// Cloudflare Workers IP'leri Open-Meteo tarafından sık sık rate-limit'liyor.
// ASCII user-agent + küçük chunk + chunk arası kısa delay rate-limit'i azaltır.
const UA = 'YanginRadar/1.0 (+https://yanginradar.com)'
const BULK_CHUNK = 27 // 81 il = 3 chunk
const BULK_CHUNK_DELAY_MS = 250

export interface CurrentWeatherResponse {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    windspeed_10m: number
    winddirection_10m: number
  }
}

export interface HourlyWeatherResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    windspeed_10m: number[]
    winddirection_10m: number[]
  }
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const url =
    `${OPEN_METEO}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m` +
    `&wind_speed_unit=ms&timezone=auto`

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as CurrentWeatherResponse
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.windspeed_10m,
      windDirection: data.current.winddirection_10m,
    }
  } catch {
    return null
  }
}

async function fetchOneBulk(
  points: Array<{ lat: number; lon: number }>,
  timeoutMs: number,
): Promise<Array<WeatherData | null>> {
  const lats = points.map((p) => p.lat).join(',')
  const lons = points.map((p) => p.lon).join(',')
  const url =
    `${OPEN_METEO}?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m` +
    `&wind_speed_unit=ms&timezone=auto`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      next: { revalidate: 900 },
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[bulk-weather] non-ok:', res.status, res.statusText, 'chunk size:', points.length)
      return points.map(() => null)
    }
    const data = await res.json()
    const arr = Array.isArray(data) ? data : [data]
    return points.map((_, i) => {
      const item = arr[i]?.current
      if (!item) return null
      return {
        temperature: item.temperature_2m,
        humidity: item.relative_humidity_2m,
        windSpeed: item.windspeed_10m,
        windDirection: item.winddirection_10m,
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[bulk-weather] error:', msg, 'chunk size:', points.length)
    return points.map(() => null)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 81 il için tek seferde rüzgar/sıcaklık verisi çeker.
 * Open-Meteo rate-limit'ini aşmak için chunk'lı çağrı (27+27+27).
 */
export async function fetchBulkCurrentWeather(
  points: Array<{ lat: number; lon: number }>,
  timeoutMs = 8000,
): Promise<Array<WeatherData | null>> {
  if (points.length === 0) return []

  const chunks: Array<Array<{ lat: number; lon: number }>> = []
  for (let i = 0; i < points.length; i += BULK_CHUNK) {
    chunks.push(points.slice(i, i + BULK_CHUNK))
  }

  const results: Array<WeatherData | null> = []
  for (let i = 0; i < chunks.length; i++) {
    const chunkResult = await fetchOneBulk(chunks[i], timeoutMs)
    results.push(...chunkResult)
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BULK_CHUNK_DELAY_MS))
    }
  }

  return results
}

export async function fetchHourlyForecast(
  lat: number,
  lon: number,
  days = 1,
): Promise<HourlyWeatherResponse['hourly'] | null> {
  const url =
    `${OPEN_METEO}?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m` +
    `&wind_speed_unit=ms&forecast_days=${days}&timezone=auto`

  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as HourlyWeatherResponse
    return data.hourly
  } catch {
    return null
  }
}
