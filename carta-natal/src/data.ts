import type { CityData } from './types'

/**
 * Simulated city database with real coordinates and IANA timezones.
 * In production, this would be replaced by an API call
 * (e.g., Google Places, GeoNames, OpenCage).
 */
export const CITIES_DATABASE: CityData[] = [
  // Spain
  { name: 'Madrid', country: 'España', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
  { name: 'Barcelona', country: 'España', latitude: 41.3874, longitude: 2.1686, timezone: 'Europe/Madrid' },
  { name: 'Valencia', country: 'España', latitude: 39.4699, longitude: -0.3763, timezone: 'Europe/Madrid' },
  { name: 'Sevilla', country: 'España', latitude: 37.3891, longitude: -5.9845, timezone: 'Europe/Madrid' },
  { name: 'Málaga', country: 'España', latitude: 36.7213, longitude: -4.4214, timezone: 'Europe/Madrid' },
  { name: 'Bilbao', country: 'España', latitude: 43.2627, longitude: -2.9253, timezone: 'Europe/Madrid' },
  // Latin America
  { name: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Ciudad de México', country: 'México', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City' },
  { name: 'Bogotá', country: 'Colombia', latitude: 4.7110, longitude: -74.0721, timezone: 'America/Bogota' },
  { name: 'Lima', country: 'Perú', latitude: -12.0464, longitude: -77.0428, timezone: 'America/Lima' },
  { name: 'Santiago', country: 'Chile', latitude: -33.4489, longitude: -70.6693, timezone: 'America/Santiago' },
  { name: 'Montevideo', country: 'Uruguay', latitude: -34.9011, longitude: -56.1645, timezone: 'America/Montevideo' },
  { name: 'Caracas', country: 'Venezuela', latitude: 10.4806, longitude: -66.9036, timezone: 'America/Caracas' },
  { name: 'Quito', country: 'Ecuador', latitude: -0.1807, longitude: -78.4678, timezone: 'America/Guayaquil' },
  { name: 'La Paz', country: 'Bolivia', latitude: -16.5000, longitude: -68.1500, timezone: 'America/La_Paz' },
  { name: 'Asunción', country: 'Paraguay', latitude: -25.2637, longitude: -57.5759, timezone: 'America/Asuncion' },
  { name: 'San José', country: 'Costa Rica', latitude: 9.9281, longitude: -84.0907, timezone: 'America/Costa_Rica' },
  { name: 'La Habana', country: 'Cuba', latitude: 23.1136, longitude: -82.3666, timezone: 'America/Havana' },
  { name: 'Panamá', country: 'Panamá', latitude: 8.9824, longitude: -79.5199, timezone: 'America/Panama' },
  { name: 'Medellín', country: 'Colombia', latitude: 6.2442, longitude: -75.5812, timezone: 'America/Bogota' },
  { name: 'Guadalajara', country: 'México', latitude: 20.6597, longitude: -103.3496, timezone: 'America/Mexico_City' },
  { name: 'Córdoba', country: 'Argentina', latitude: -31.4201, longitude: -64.1888, timezone: 'America/Argentina/Cordoba' },
  { name: 'Rosario', country: 'Argentina', latitude: -32.9468, longitude: -60.6393, timezone: 'America/Argentina/Cordoba' },
  // Europe
  { name: 'Londres', country: 'Reino Unido', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'París', country: 'Francia', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: 'Roma', country: 'Italia', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' },
  { name: 'Berlín', country: 'Alemania', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  { name: 'Lisboa', country: 'Portugal', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon' },
  { name: 'Ámsterdam', country: 'Países Bajos', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  // North America
  { name: 'Nueva York', country: 'Estados Unidos', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { name: 'Los Ángeles', country: 'Estados Unidos', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'Miami', country: 'Estados Unidos', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
  { name: 'Toronto', country: 'Canadá', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  // Asia & Oceania
  { name: 'Tokio', country: 'Japón', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'Sídney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Shanghái', country: 'China', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
]

/**
 * Search cities by partial name (case-insensitive, accent-insensitive).
 */
export function searchCities(query: string): CityData[] {
  if (!query || query.length < 2) return []

  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return CITIES_DATABASE.filter((city) => {
    const normalizedName = city.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const normalizedCountry = city.country
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCountry.includes(normalizedQuery)
    )
  }).slice(0, 8)
}

/**
 * Calculate the UTC offset for a given timezone and date.
 * Uses the native Intl API — no dependencies needed.
 */
export function getUtcOffset(timezone: string, date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })

    const parts = formatter.formatToParts(date)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')

    if (tzPart) {
      // Intl returns something like "GMT+02:00" or "GMT-05:00" or "GMT"
      const match = tzPart.value.match(/GMT([+-]\d{1,2}(?::\d{2})?)/)
      if (match) {
        return `UTC${match[1]}`
      }
      // GMT with no offset means UTC+0
      if (tzPart.value === 'GMT') {
        return 'UTC+0'
      }
    }

    return 'UTC+0'
  } catch {
    return 'UTC+0'
  }
}

/**
 * Build an ISO-like local datetime string from date, time, and timezone.
 */
export function buildLocalDateTime(
  dateStr: string,
  timeStr: string,
  timezone: string
): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })

    // Build a UTC date, then get the offset
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes))
    const parts = formatter.formatToParts(utcDate)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')

    let offsetStr = '+00:00'
    if (tzPart) {
      const match = tzPart.value.match(/GMT([+-]\d{1,2}(?::\d{2})?)/)
      if (match) {
        let offset = match[1]
        // Normalize: "+2" → "+02:00"
        if (!offset.includes(':')) {
          const sign = offset[0]
          const num = offset.slice(1).padStart(2, '0')
          offset = `${sign}${num}:00`
        }
        offsetStr = offset
      }
    }

    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00${offsetStr}`
  } catch {
    return `${dateStr}T${timeStr}:00`
  }
}
