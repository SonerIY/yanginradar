import Papa from 'papaparse'
import { IL_LIST } from '@/lib/il-data'
import type { FirePoint } from '@/types'

const FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'
const DATASET = 'VIIRS_SNPP_NRT'
// Türkiye bounding box: west,south,east,north
const TURKEY_BBOX = '26,36,45,42'

export async function fetchFirmsData(days = 1): Promise<string> {
  const key = process.env.FIRMS_MAP_KEY
  if (!key) throw new Error('FIRMS_MAP_KEY env var missing')

  const url = `${FIRMS_BASE}/${key}/${DATASET}/${TURKEY_BBOX}/${days}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)')
    throw new Error(
      `FIRMS request failed: ${res.status} ${res.statusText} — ${body.slice(0, 300)}`,
    )
  }
  return res.text()
}

interface FirmsCsvRow {
  latitude: string
  longitude: string
  bright_ti4?: string
  bright_ti5?: string
  brightness?: string
  scan?: string
  track?: string
  acq_date: string
  acq_time: string
  satellite: string
  instrument?: string
  confidence: string
  version?: string
  frp: string
  daynight?: string
}

export function parseFirmsCsv(csvText: string): FirePoint[] {
  const result = Papa.parse<FirmsCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const rows = result.data
  const points: FirePoint[] = []

  for (const row of rows) {
    const lat = Number(row.latitude)
    const lon = Number(row.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue

    const confRaw = (row.confidence ?? '').toString().trim().toLowerCase()
    let confidence: FirePoint['confidence']
    if (confRaw === 'h' || confRaw === 'high') confidence = 'h'
    else if (confRaw === 'n' || confRaw === 'nominal') confidence = 'n'
    else confidence = 'l'

    points.push({
      lat,
      lon,
      brightness: Number(row.bright_ti4 ?? row.brightness ?? 0),
      confidence,
      acq_date: row.acq_date,
      acq_time: row.acq_time,
      satellite: row.satellite,
      frp: Number(row.frp ?? 0),
    })
  }

  return points
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * FRP (Fire Radiative Power, MW) değerine göre yangın büyüklüğü kategorisi.
 * NASA FIRMS bir termal anomali sistemidir; düşük FRP genelde anız/endüstri,
 * yüksek FRP gerçek orman yangını sinyalidir.
 */
export type FireMagnitude = 'industrial' | 'small' | 'medium' | 'large' | 'major'

export function frpCategory(frp: number | undefined | null): FireMagnitude {
  const v = Number(frp) || 0
  if (v < 5) return 'industrial'
  if (v < 20) return 'small'
  if (v < 100) return 'medium'
  if (v < 500) return 'large'
  return 'major'
}

export function frpLabel(frp: number | undefined | null): string {
  switch (frpCategory(frp)) {
    case 'industrial': return 'Düşük yoğunluk · anız/endüstriyel olabilir'
    case 'small':      return 'Küçük yangın'
    case 'medium':     return 'Orta yangın'
    case 'large':      return 'Büyük yangın'
    case 'major':      return 'Çok büyük yangın'
  }
}

export function frpColor(frp: number | undefined | null): string {
  switch (frpCategory(frp)) {
    case 'industrial': return '#7a7a75' // gri — güvenilir değil
    case 'small':      return '#EF9F27' // turuncu — küçük
    case 'medium':     return '#E24B4A' // kırmızı
    case 'large':      return '#E24B4A'
    case 'major':      return '#E24B4A'
  }
}

export function frpOpacity(frp: number | undefined | null): number {
  switch (frpCategory(frp)) {
    case 'industrial': return 0.45
    case 'small':      return 0.75
    case 'medium':     return 0.9
    case 'large':      return 1.0
    case 'major':      return 1.0
  }
}

export function frpRadius(frp: number | undefined | null): number {
  switch (frpCategory(frp)) {
    case 'industrial': return 4
    case 'small':      return 6
    case 'medium':     return 8
    case 'large':      return 11
    case 'major':      return 14
  }
}

/** NASA FIRMS CSV'sinin "satellite" sütunundaki kısa kodu kullanıcı dostu isme çevirir. */
export function formatSatellite(raw: string | undefined): string {
  if (!raw) return 'VIIRS'
  const v = raw.trim().toUpperCase()
  switch (v) {
    case 'N':
    case 'NPP':
    case 'NPP-1':
    case 'SNPP':
    case '1':
      return 'VIIRS · Suomi NPP'
    case 'N20':
    case 'NOAA20':
    case 'NOAA-20':
    case 'JPSS-1':
      return 'VIIRS · NOAA-20'
    case 'N21':
    case 'NOAA21':
    case 'NOAA-21':
    case 'JPSS-2':
      return 'VIIRS · NOAA-21'
    case 'T':
    case 'TERRA':
      return 'MODIS · Terra'
    case 'A':
    case 'AQUA':
      return 'MODIS · Aqua'
    default:
      return `VIIRS · ${raw}`
  }
}

export function reverseGeocode(
  lat: number,
  lon: number,
): { slug: string; name: string } | null {
  let bestSlug: string | null = null
  let bestName: string | null = null
  let bestDist = Infinity

  for (const il of IL_LIST) {
    const d = haversine(lat, lon, il.lat, il.lon)
    if (d < bestDist) {
      bestDist = d
      bestSlug = il.slug
      bestName = il.name
    }
  }

  if (!bestSlug || !bestName) return null
  // Türkiye il merkezinden en uzak Türk toprağı ~120km (Iğdır kuzey kıyısı,
  // Antalya kıyı şeridi, Hatay güney kıyısı). 130km eşiği komşu ülke
  // tespitlerini (Erbil/Tabriz/Mosul/Aleppo vb.) Türkiye'ye yazmaktan
  // korur. Türkiye dışı noktalar reverse geocode'da null döner ve cron
  // tarafından upsert edilmez.
  if (bestDist > 130) return null
  return { slug: bestSlug, name: bestName }
}
