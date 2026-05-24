import type { WeatherData } from '@/types'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

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
    const res = await fetch(url, { next: { revalidate: 1800 } })
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

/**
 * 81 il için tek seferde rüzgar/sıcaklık verisi çeker.
 * Open-Meteo "comma separated multi-location" desteğini kullanır.
 */
export async function fetchBulkCurrentWeather(
  points: Array<{ lat: number; lon: number }>,
  timeoutMs = 8000,
): Promise<Array<WeatherData | null>> {
  if (points.length === 0) return []

  const lats = points.map((p) => p.lat).join(',')
  const lons = points.map((p) => p.lon).join(',')

  const url =
    `${OPEN_METEO}?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,windspeed_10m,winddirection_10m` +
    `&wind_speed_unit=ms&timezone=auto`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Next.js fetch cache (15dk) — SSG/ISR uyumu için
    const res = await fetch(url, {
      next: { revalidate: 900 },
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[bulk-weather] non-ok:', res.status, res.statusText)
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
    console.error('[bulk-weather] error:', msg)
    return points.map(() => null)
  } finally {
    clearTimeout(timer)
  }
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
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = (await res.json()) as HourlyWeatherResponse
    return data.hourly
  } catch {
    return null
  }
}
