import type {
  BirthChartPayload,
  NatalChartData,
  PlanetPosition,
  HouseCusp,
  AnglePoint,
  ZodiacSign,
  PlanetName,
} from '../types'

/* ─── Constants ─── */

const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer',
  'Leo', 'Virgo', 'Libra', 'Escorpio',
  'Sagitario', 'Capricornio', 'Acuario', 'Piscis',
]

const PLANETS: PlanetName[] = [
  'Sol', 'Luna', 'Mercurio', 'Venus', 'Marte',
  'Júpiter', 'Saturno', 'Urano', 'Neptuno', 'Plutón',
]

/* ─── Helpers ─── */

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic results for the same input,
 * so the same birth data always returns the same chart.
 */
function createSeededRandom(seed: number): () => number {
  let t = seed + 0x6D2B79F5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a numeric seed from a string (djb2 hash).
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return hash >>> 0
}

function getSignFromAbsoluteDegree(deg: number): ZodiacSign {
  const normalized = ((deg % 360) + 360) % 360
  const index = Math.floor(normalized / 30)
  return ZODIAC_SIGNS[index]
}

function getDegreeWithinSign(absoluteDegree: number): number {
  return Math.round(((absoluteDegree % 30) + 30) % 30 * 100) / 100
}

/* ─── Mock Engine ─── */

/**
 * Simulates an astronomical calculation engine.
 *
 * Uses a seeded PRNG derived from the birth data so that:
 * - Same inputs → same chart (deterministic)
 * - Different inputs → different chart (realistic variation)
 *
 * The positions are mock data but follow real astrological rules:
 * - Planets distributed across 360°
 * - Mercury/Venus stay close to the Sun (orbital constraint)
 * - Outer planets move slowly (realistic degree ranges)
 * - Houses use Placidus-like spacing
 * - Retrograde probability varies by planet
 */
function generateMockChart(
  payload: BirthChartPayload,
  random: () => number
): { planets: PlanetPosition[]; houses: HouseCusp[]; ascendant: AnglePoint; midheaven: AnglePoint } {

  // ── Ascendant: derived from birth time + latitude ──
  const [hours, minutes] = payload.birthTime.split(':').map(Number)
  const timeAngle = ((hours * 60 + minutes) / 1440) * 360
  const latOffset = payload.latitude * 0.5
  const ascDegree = (timeAngle + latOffset + random() * 15) % 360

  const ascendant: AnglePoint = {
    name: 'Ascendente',
    sign: getSignFromAbsoluteDegree(ascDegree),
    degree: Math.floor(getDegreeWithinSign(ascDegree)),
    minutes: Math.floor(random() * 60),
    absoluteDegree: Math.round(ascDegree * 100) / 100,
  }

  // ── Midheaven: ~90° from ASC with some variation ──
  const mcDegree = (ascDegree + 270 + (random() * 20 - 10)) % 360

  const midheaven: AnglePoint = {
    name: 'Medio Cielo',
    sign: getSignFromAbsoluteDegree(mcDegree),
    degree: Math.floor(getDegreeWithinSign(mcDegree)),
    minutes: Math.floor(random() * 60),
    absoluteDegree: Math.round(mcDegree * 100) / 100,
  }

  // ── Houses: Placidus-like distribution from ASC ──
  const houses: HouseCusp[] = []
  for (let i = 0; i < 12; i++) {
    // Placidus houses aren't evenly spaced; simulate with slight variation
    const baseAngle = ascDegree + (i * 30)
    const variation = (i > 0 && i < 6)
      ? (random() * 8 - 4)   // vary upper houses
      : (random() * 6 - 3)   // vary lower houses slightly less
    const houseDegree = (baseAngle + variation + 360) % 360

    houses.push({
      houseNumber: i + 1,
      sign: getSignFromAbsoluteDegree(houseDegree),
      degree: Math.round(getDegreeWithinSign(houseDegree) * 100) / 100,
      absoluteDegree: Math.round(houseDegree * 100) / 100,
    })
  }

  // ── Sun position: derived from birth date (ecliptic longitude) ──
  const [year, month, day] = payload.birthDate.split('-').map(Number)
  // Approximate solar longitude: March 21 = 0° Aries
  const dayOfYear = Math.floor(
    (Date.UTC(year, month - 1, day) - Date.UTC(year, 2, 21)) / 86400000
  )
  const sunDegree = ((dayOfYear * (360 / 365.25)) + 360) % 360

  // ── Planet positions ──
  const planets: PlanetPosition[] = PLANETS.map((name, idx) => {
    let absDeg: number
    let retrograde = false

    switch (name) {
      case 'Sol':
        absDeg = sunDegree + (random() * 2 - 1) // Sun is precise to ~1°
        break
      case 'Luna':
        // Moon moves ~13°/day, so it can be anywhere
        absDeg = (sunDegree + random() * 360) % 360
        break
      case 'Mercurio':
        // Mercury stays within 28° of the Sun
        absDeg = (sunDegree + (random() * 56 - 28) + 360) % 360
        retrograde = random() < 0.19 // ~19% of the time
        break
      case 'Venus':
        // Venus stays within 47° of the Sun
        absDeg = (sunDegree + (random() * 94 - 47) + 360) % 360
        retrograde = random() < 0.07 // ~7% of the time
        break
      case 'Marte':
        absDeg = (sunDegree + random() * 360) % 360
        retrograde = random() < 0.09
        break
      case 'Júpiter':
        // Jupiter moves ~30°/year
        absDeg = (sunDegree + 30 * (year % 12) + random() * 30) % 360
        retrograde = random() < 0.30
        break
      case 'Saturno':
        // Saturn moves ~12°/year
        absDeg = (sunDegree + 12 * (year % 30) + random() * 15) % 360
        retrograde = random() < 0.36
        break
      case 'Urano':
        absDeg = (random() * 360) // Generational planet
        retrograde = random() < 0.40
        break
      case 'Neptuno':
        absDeg = (random() * 360)
        retrograde = random() < 0.43
        break
      case 'Plutón':
        absDeg = (random() * 360)
        retrograde = random() < 0.44
        break
      default:
        absDeg = random() * 360
    }

    absDeg = ((absDeg % 360) + 360) % 360

    // Assign house based on degree relative to house cusps
    let house = 1
    for (let h = 11; h >= 0; h--) {
      if (absDeg >= houses[h].absoluteDegree) {
        house = h + 1
        break
      }
    }
    // Ensure variety: distribute across houses using index offset
    if (idx > 2) {
      house = ((house + idx) % 12) + 1
    }

    return {
      name,
      sign: getSignFromAbsoluteDegree(absDeg),
      degree: Math.floor(getDegreeWithinSign(absDeg)),
      minutes: Math.floor(random() * 60),
      absoluteDegree: Math.round(absDeg * 100) / 100,
      house,
      retrograde,
    }
  })

  return { planets, houses, ascendant, midheaven }
}

/* ─── Public API ─── */

/**
 * Calculate a natal chart from the user's birth data.
 *
 * Returns a Promise that resolves after a simulated 2-second delay,
 * mimicking a real astronomical computation engine.
 *
 * The results are deterministic: same input always produces the same chart.
 */
export function calculateNatalChart(
  payload: BirthChartPayload
): Promise<NatalChartData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create deterministic seed from birth data
      const seedString = `${payload.birthDate}|${payload.birthTime}|${payload.latitude}|${payload.longitude}`
      const seed = hashString(seedString)
      const random = createSeededRandom(seed)

      const { planets, houses, ascendant, midheaven } = generateMockChart(payload, random)

      const chartData: NatalChartData = {
        subject: {
          name: payload.name,
          birthDate: payload.birthDate,
          birthTime: payload.birthTime,
          city: payload.city,
          country: payload.country,
        },
        planets,
        houses,
        ascendant,
        midheaven,
        calculatedAt: new Date().toISOString(),
      }

      // Also log the structured data
      console.log('──────────────────────────────────────')
      console.log('🌟 CARTA NATAL — Resultado Completo')
      console.log('──────────────────────────────────────')
      console.log(JSON.stringify(chartData, null, 2))
      console.log('──────────────────────────────────────')

      resolve(chartData)
    }, 2000) // 2-second simulated calculation
  })
}
