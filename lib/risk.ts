import type { WeatherData } from '@/types'

export interface RiskFactors {
  temperature: number  // °C
  humidity: number     // %
  windSpeed: number    // m/s
  fireCount: number    // son 24h yangın noktası sayısı (bu ildeki)
}

/**
 * 0-100 arası risk skoru.
 *
 * Ağırlıklar (CLAUDE.md):
 *   - sıcaklık:  max 30 puan ((temp - 25) * 3)
 *   - nem:       max 25 puan ((60 - hum) * 0.5)
 *   - rüzgar:    max 25 puan (wind * 2)
 *   - yangın:    max 20 puan (fireCount * 5)
 */
export function calculateRiskScore({
  temperature,
  humidity,
  windSpeed,
  fireCount,
}: RiskFactors): number {
  const tempScore = Math.min(Math.max((temperature - 25) * 3, 0), 30)
  const humidityScore = Math.min(Math.max((60 - humidity) * 0.5, 0), 25)
  const windScore = Math.min(Math.max(windSpeed * 2, 0), 25)
  const fireScore = Math.min(Math.max(fireCount * 5, 0), 20)
  return Math.round(tempScore + humidityScore + windScore + fireScore)
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme'

export function riskLevel(score: number): RiskLevel {
  if (score >= 75) return 'extreme'
  if (score >= 50) return 'high'
  if (score >= 25) return 'moderate'
  return 'low'
}

export function riskColor(score: number): string {
  const level = riskLevel(score)
  switch (level) {
    case 'extreme':
      return '#E24B4A'
    case 'high':
      return '#EF9F27'
    case 'moderate':
      return '#E8C84A'
    case 'low':
      return '#66C36A'
  }
}

export function riskLabel(score: number): string {
  const level = riskLevel(score)
  switch (level) {
    case 'extreme':
      return 'Aşırı yüksek'
    case 'high':
      return 'Yüksek'
    case 'moderate':
      return 'Orta'
    case 'low':
      return 'Düşük'
  }
}

export function riskFromWeather(
  weather: WeatherData | null,
  fireCount: number,
): number {
  if (!weather) {
    // Hava verisi yoksa sadece yangın sayısına bak
    return Math.min(fireCount * 5, 20)
  }
  return calculateRiskScore({
    temperature: weather.temperature,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    fireCount,
  })
}
