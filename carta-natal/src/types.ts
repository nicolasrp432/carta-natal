/* ─── City Data ─── */

export interface CityData {
  name: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}

/* ─── Form Data ─── */

export interface BirthChartFormData {
  name: string
  birthDate: string
  birthTime: string
  city: CityData | null
}

export interface BirthChartPayload {
  name: string
  birthDate: string
  birthTime: string
  city: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  utcOffset: string
  localDateTime: string
}

/* ─── Astrology Types ─── */

export type ZodiacSign =
  | 'Aries' | 'Tauro' | 'Géminis' | 'Cáncer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Escorpio'
  | 'Sagitario' | 'Capricornio' | 'Acuario' | 'Piscis'

export type PlanetName =
  | 'Sol' | 'Luna' | 'Mercurio' | 'Venus' | 'Marte'
  | 'Júpiter' | 'Saturno' | 'Urano' | 'Neptuno' | 'Plutón'

export type Element = 'Fuego' | 'Tierra' | 'Aire' | 'Agua'
export type Modality = 'Cardinal' | 'Fijo' | 'Mutable'

export interface PlanetPosition {
  name: PlanetName
  sign: ZodiacSign
  degree: number         // 0–30 within sign
  minutes: number        // 0–59 arc minutes
  absoluteDegree: number // 0–360
  house: number          // 1–12
  retrograde: boolean
}

export interface HouseCusp {
  houseNumber: number    // 1–12
  sign: ZodiacSign
  degree: number         // 0–30 within sign
  absoluteDegree: number // 0–360
}

export interface AnglePoint {
  name: string
  sign: ZodiacSign
  degree: number
  minutes: number
  absoluteDegree: number
}

export type AspectType = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition'

export interface Aspect {
  planet1: string
  planet2: string
  type: AspectType
  angle: number
  orb: number
}

export interface NatalChartData {
  /** Subject info echoed back */
  subject: {
    name: string
    birthDate: string
    birthTime: string
    city: string
    country: string
  }
  /** Planetary positions */
  planets: PlanetPosition[]
  /** House cusps (Placidus system) */
  houses: HouseCusp[]
  /** Core astrological aspects between planets */
  aspects: Aspect[]
  /** Ascendant (ASC) */
  ascendant: AnglePoint
  /** Midheaven (MC) */
  midheaven: AnglePoint
  /** Timestamp of calculation */
  calculatedAt: string
}

/* ─── App State ─── */

export type AppView = 'form' | 'loading' | 'results'
