import type { ZodiacSign } from '../types'

/**
 * Zodiac sign metadata for icons and styling.
 */

const SIGN_SYMBOLS: Record<ZodiacSign, string> = {
  'Aries': '♈',
  'Tauro': '♉',
  'Géminis': '♊',
  'Cáncer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Escorpio': '♏',
  'Sagitario': '♐',
  'Capricornio': '♑',
  'Acuario': '♒',
  'Piscis': '♓',
}

const SIGN_ELEMENTS: Record<ZodiacSign, string> = {
  'Aries': 'Fuego', 'Leo': 'Fuego', 'Sagitario': 'Fuego',
  'Tauro': 'Tierra', 'Virgo': 'Tierra', 'Capricornio': 'Tierra',
  'Géminis': 'Aire', 'Libra': 'Aire', 'Acuario': 'Aire',
  'Cáncer': 'Agua', 'Escorpio': 'Agua', 'Piscis': 'Agua',
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Fuego': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  'Tierra': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'Aire': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
  'Agua': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
}

export function getSignSymbol(sign: ZodiacSign): string {
  return SIGN_SYMBOLS[sign] || '★'
}

export function getSignElement(sign: ZodiacSign): string {
  return SIGN_ELEMENTS[sign] || 'Fuego'
}

export function getElementColors(sign: ZodiacSign) {
  const element = SIGN_ELEMENTS[sign] || 'Fuego'
  return ELEMENT_COLORS[element] || ELEMENT_COLORS['Fuego']
}
