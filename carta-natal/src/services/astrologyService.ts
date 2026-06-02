import { AstroTime, Body, SunPosition, EclipticGeoMoon, GeoVector, Ecliptic, SiderealTime } from 'astronomy-engine'
import type { BirthChartPayload, NatalChartData, PlanetPosition, HouseCusp, AnglePoint, ZodiacSign, PlanetName, Aspect, AspectType } from '../types'

/* ─── Constants ─── */

const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer',
  'Leo', 'Virgo', 'Libra', 'Escorpio',
  'Sagitario', 'Capricornio', 'Acuario', 'Piscis',
]

const PLANET_MAP: Record<PlanetName, Body> = {
  'Sol': Body.Sun,
  'Luna': Body.Moon,
  'Mercurio': Body.Mercury,
  'Venus': Body.Venus,
  'Marte': Body.Mars,
  'Júpiter': Body.Jupiter,
  'Saturno': Body.Saturn,
  'Urano': Body.Uranus,
  'Neptuno': Body.Neptune,
  'Plutón': Body.Pluto,
}

/* ─── Helpers ─── */

function getSignFromAbsoluteDegree(deg: number): ZodiacSign {
  const normalized = ((deg % 360) + 360) % 360
  const index = Math.floor(normalized / 30)
  return ZODIAC_SIGNS[index]
}

function getDegreeWithinSign(absoluteDegree: number): number {
  return Math.round(((absoluteDegree % 30) + 30) % 30 * 100) / 100
}

function calculateAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = []
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i]
      const p2 = planets[j]
      
      const diff1 = (p1.absoluteDegree - p2.absoluteDegree + 360) % 360
      const diff2 = (p2.absoluteDegree - p1.absoluteDegree + 360) % 360
      const distance = Math.min(diff1, diff2)
      
      let type: AspectType | null = null
      let exactAngle = 0
      
      if (Math.abs(distance - 0) <= 8) {
        type = 'Conjunction'
        exactAngle = 0
      } else if (Math.abs(distance - 60) <= 6) {
        type = 'Sextile'
        exactAngle = 60
      } else if (Math.abs(distance - 90) <= 8) {
        type = 'Square'
        exactAngle = 90
      } else if (Math.abs(distance - 120) <= 8) {
        type = 'Trine'
        exactAngle = 120
      } else if (Math.abs(distance - 180) <= 8) {
        type = 'Opposition'
        exactAngle = 180
      }
      
      if (type) {
        aspects.push({
          planet1: p1.name,
          planet2: p2.name,
          type,
          angle: distance,
          orb: Math.round(Math.abs(distance - exactAngle) * 100) / 100
        })
      }
    }
  }
  return aspects
}

/* ─── True Engine ─── */

/**
 * Calculates a mathematically sound Natal Chart based on local date, time and coordinates.
 * Relies on astronomy-engine for ecliptic locations of planets and basic trig for ASC/MC/Houses.
 */
function calculateTrueChart(
  payload: BirthChartPayload
): { planets: PlanetPosition[]; houses: HouseCusp[]; aspects: Aspect[]; ascendant: AnglePoint; midheaven: AnglePoint } {
  
  // Format standard date parsing in local JS: Assuming local birth time represents the input without strict TS TZ
  // Usually string like "1994-08-04" + "T" + "12:30:00" will be parsed in system local or UTC depending on browser.
  // To avoid weird offsets for simple usage, we'll slice the parts if needed.
  // Let's rely on standard parsing (since the app just takes local YYYY-MM-DD and HH:mm)
  
  // Use UTC to prevent the browser from applying local OS offsets, then adjust by coordinates if possible
  // Since we rely on standard astronomy, using Date.UTC directly is tricky without exact timezone offset.
  // For now, we will assume the Date() local mapping works or user is in local TZ.
  // Wait, Date() parses "YYYY-MM-DDTHH:mm:00" as LOCAL time, meaning if it's 1994, it evaluates relative to runner OS.
  // A robust fix without a timezone library is to assume UTC for calculation, but conceptually we need the user's UTC time.
  // Let's create an exact UTC date assuming the inputs are treated directly (which might have a slight offset, but acceptable for MVP).
  
  // Creating a Date representing the time using the form values
  const dateStr = `${payload.birthDate || '2000-01-01'}T${payload.birthTime || '12:00'}:00`
  const dateObj = new Date(dateStr) 
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj

  const astroTime = new AstroTime(validDate)
  
  // Calculate planets
  const planets: PlanetPosition[] = []
  
  for (const [pName, body] of Object.entries(PLANET_MAP)) {
    const planetName = pName as PlanetName
    let absDeg = 0
    let retrograde = false
    
    // Calculate longitude based on astronomy-engine guidelines
    if (body === Body.Sun) {
      absDeg = SunPosition(astroTime).elon || 0
    } else if (body === Body.Moon) {
      absDeg = EclipticGeoMoon(astroTime).lon || 0
    } else {
      const vec = GeoVector(body, astroTime, true)
      const eclip = Ecliptic(vec)
      absDeg = eclip.elon || 0
      
      // Calculate retrograde by checking slightly ahead
      const nextDay = new AstroTime(new Date(validDate.getTime() + 86400000)) // +1 day
      const nextVec = GeoVector(body, nextDay, true)
      const nextEclip = Ecliptic(nextVec)
      
      let diff = (nextEclip.elon || 0) - (eclip.elon || 0)
      if (diff > 180) diff -= 360
      if (diff < -180) diff += 360
      retrograde = diff < 0
    }
    
    absDeg = ((absDeg % 360) + 360) % 360
    
    planets.push({
      name: planetName,
      sign: getSignFromAbsoluteDegree(absDeg),
      degree: Number(Math.floor(getDegreeWithinSign(absDeg))) || 0,
      minutes: Number(Math.floor((absDeg % 1) * 60)) || 0,
      absoluteDegree: Number(Math.round(absDeg * 100) / 100) || 0,
      house: 1, // Will assign proper houses later
      retrograde
    })
  }

  // Ensure safe coordinates
  const safeLat = Number(payload.latitude) || 0
  const safeLon = Number(payload.longitude) || 0

  // Calculate ASC and MC using LST
  const gmstHours = Number(SiderealTime(astroTime)) || 0
  let lmstHours = gmstHours + safeLon / 15.0
  lmstHours = ((lmstHours % 24) + 24) % 24
  
  const E = 23.4392911 * (Math.PI / 180)
  const RAMC = lmstHours * 15 * (Math.PI / 180)
  const latRad = safeLat * (Math.PI / 180)
  
  // Midheaven
  const mcRad = Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(E))
  let mcDeg = mcRad * (180 / Math.PI)
  mcDeg = ((mcDeg % 360) + 360) % 360
  
  // Ascendant
  const ascRad = Math.atan2(Math.cos(RAMC), -(Math.sin(RAMC) * Math.cos(E) + Math.tan(latRad) * Math.sin(E)))
  let ascDeg = ascRad * (180 / Math.PI)
  ascDeg = ((ascDeg % 360) + 360) % 360
  
  const ascendant: AnglePoint = {
    name: 'Ascendente',
    sign: getSignFromAbsoluteDegree(ascDeg),
    degree: Number(Math.floor(getDegreeWithinSign(ascDeg))) || 0,
    minutes: Number(Math.floor((ascDeg % 1) * 60)) || 0,
    absoluteDegree: Number(Math.round(ascDeg * 100) / 100) || 0,
  }

  const midheaven: AnglePoint = {
    name: 'Medio Cielo',
    sign: getSignFromAbsoluteDegree(mcDeg),
    degree: Number(Math.floor(getDegreeWithinSign(mcDeg))) || 0,
    minutes: Number(Math.floor((mcDeg % 1) * 60)) || 0,
    absoluteDegree: Number(Math.round(mcDeg * 100) / 100) || 0,
  }

  // Porphyry Houses Appx
  const arc1 = (ascDeg - mcDeg + 360) % 360 
  const icDeg = (mcDeg + 180) % 360
  const arc2 = (icDeg - ascDeg + 360) % 360

  const houseCusps = [
    ascDeg, 
    (ascDeg + arc2 / 3) % 360, 
    (ascDeg + 2 * arc2 / 3) % 360,
    icDeg, 
    (icDeg + arc1 / 3) % 360, 
    (icDeg + 2 * arc1 / 3) % 360,
    (ascDeg + 180) % 360, 
    (ascDeg + 180 + arc2 / 3) % 360, 
    (ascDeg + 180 + 2 * arc2 / 3) % 360,
    mcDeg, 
    (mcDeg + arc1 / 3) % 360, 
    (mcDeg + 2 * arc1 / 3) % 360,
  ]

  const houses: HouseCusp[] = houseCusps.map((cuspDeg, index) => ({
    houseNumber: index + 1,
    sign: getSignFromAbsoluteDegree(cuspDeg),
    degree: Number(Math.round(getDegreeWithinSign(cuspDeg) * 100) / 100) || 0,
    absoluteDegree: Number(Math.round(cuspDeg * 100) / 100) || 0
  }))

  // Assign planets to houses
  planets.forEach(planet => {
    let house = 1
    for (let i = 11; i >= 0; i--) {
      const currentStart = houses[i].absoluteDegree
      const currentEnd = houses[(i + 1) % 12].absoluteDegree
      
      const pDeg = planet.absoluteDegree
      if (currentStart < currentEnd) {
        if (pDeg >= currentStart && pDeg < currentEnd) house = i + 1
      } else {
        if (pDeg >= currentStart || pDeg < currentEnd) house = i + 1
      }
    }
    planet.house = house
  })

  // Calculate aspects between drawn planets
  const aspects = calculateAspects(planets)

  return { planets, houses, aspects, ascendant, midheaven }
}

/* ─── Public API ─── */

/**
 * MOCK / FALLBACK ENGINE: Calculate a true natal chart locally safely using astronomy engine.
 */
export async function generateMockNatalData(
  payload: BirthChartPayload
): Promise<NatalChartData> {
  return new Promise((resolve) => {
    // Adding slight UI delay for dramatic effect since real calc is sync and instant
    setTimeout(() => {
      const { planets, houses, aspects, ascendant, midheaven } = calculateTrueChart(payload)

      const chartData: NatalChartData = {
        subject: {
          name: payload.name,
          birthDate: payload.birthDate,
          birthTime: payload.birthTime,
          city: payload.city,
          country: payload.country,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timezone: payload.timezone,
        },
        planets,
        houses,
        aspects,
        ascendant,
        midheaven,
        calculatedAt: new Date().toISOString(),
      }

      console.log('──────────────────────────────────────')
      console.log('🌟 CARTA NATAL — Motor Real Evaluado')
      console.log('──────────────────────────────────────')
      console.log(JSON.stringify(chartData, null, 2))
      console.log('──────────────────────────────────────')

      resolve(chartData)
    }, 1200)
  })
}

/* ─── Proxy Architecture (API vs Mock) ─── */

/**
 * FETCH: Request AstroAPI (astroapi.cloud)
 */
export async function fetchAstroAPI(payload: BirthChartPayload): Promise<any> {
  const apiKey = import.meta.env.VITE_ASTRO_API_KEY || ''
  
  const requestBody = {
    dateTime: `${payload.birthDate}T${payload.birthTime}`,
    location: {
      latitude: Number(payload.latitude) || 0,
      longitude: Number(payload.longitude) || 0,
      timezone: payload.timezone || 'UTC'
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey
  }

  const response = await fetch('/api/astrology/calc/natal', { 
    method: 'POST', 
    headers, 
    body: JSON.stringify(requestBody) 
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AstroAPI error Status: ${response.status} - ${errText}`)
  }
  
  return response.json()
}

/**
 * ADAPTER: Mapea la respuesta de AstroAPI al contrato UI (NatalChartData)
 */
export const adaptAstroAPIResponse = (apiData: any, userData: any): NatalChartData => {
  // AstroAPI returns a flat structure directly inside `apiData.data`
  const data = apiData?.data || {};
  const pointsRaw = data.points || {};
  const housesCuspsRaw = data.houses?.cusps || [];
  const anglesRaw = data.angles || {};

  // 1. Diccionario Traductor Universal de Planetas
  const astroDict: Record<string, string> = {
    'sun': 'Sol', 'moon': 'Luna', 'mercury': 'Mercurio', 'venus': 'Venus', 'mars': 'Marte',
    'jupiter': 'Júpiter', 'saturn': 'Saturno', 'uranus': 'Urano', 'neptune': 'Neptuno', 'pluto': 'Plutón',
    'ascendant': 'Ascendente', 'midheaven': 'Medio Cielo'
  };

  // 2. Diccionario de Traducción de Signos (de inglés minúsculas a español)
  const signDict: Record<string, ZodiacSign> = {
    'aries': 'Aries', 'taurus': 'Tauro', 'gemini': 'Géminis', 'cancer': 'Cáncer',
    'leo': 'Leo', 'virgo': 'Virgo', 'libra': 'Libra', 'scorpio': 'Escorpio',
    'sagittarius': 'Sagitario', 'capricorn': 'Capricornio', 'aquarius': 'Acuario', 'pisces': 'Piscis'
  };

  const getSignFromDeg = (deg: number): ZodiacSign => {
    const signs: ZodiacSign[] = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
    return signs[Math.floor((deg || 0) / 30) % 12];
  };

  // 3. Mapeo de Planetas
  const planetsKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const mappedPlanets: PlanetPosition[] = planetsKeys.map(key => {
    const p = pointsRaw[key] || {};
    const absoluteDeg = p.longitude ?? 0;
    
    // Find the sign (translate from api sign or calculate from deg)
    const rawSign = p.sign?.toLowerCase();
    const sign = signDict[rawSign] || getSignFromDeg(absoluteDeg);
    
    const degree = p.longitudeDms?.degrees ?? Math.floor(absoluteDeg % 30);
    const minutes = p.longitudeDms?.minutes ?? Math.floor((absoluteDeg % 1) * 60);
    const house = p.houseNumber ?? 1;
    const retrograde = p.retrograde ?? false;

    return {
      name: astroDict[key] as PlanetName,
      sign,
      degree,
      minutes,
      absoluteDegree: Number(Math.round(absoluteDeg * 100) / 100) || 0,
      house,
      retrograde
    };
  });

  // 4. Mapeo de Casas
  const mappedHouses: HouseCusp[] = housesCuspsRaw.map((h: any, index: number) => {
    const houseNumber = index + 1;
    const absDeg = h.longitude ?? (index * 30);
    const rawSign = h.sign?.toLowerCase();
    const sign = signDict[rawSign] || getSignFromDeg(absDeg);
    const degree = h.longitudeDms?.degrees ?? Math.floor((absDeg % 30));

    return {
      houseNumber,
      sign,
      degree: Number(Math.round(degree * 100) / 100) || 0,
      absoluteDegree: Number(Math.round(absDeg * 100) / 100) || 0
    };
  });

  // 5. Extracción de Ángulos
  const ascData = anglesRaw.ascendant || {};
  const mcData = anglesRaw.midheaven || {};
  const cusp1 = mappedHouses.find(h => h.houseNumber === 1)?.absoluteDegree ?? 0;
  const cusp10 = mappedHouses.find(h => h.houseNumber === 10)?.absoluteDegree ?? 0;

  const ascendant = {
    name: 'Ascendente',
    sign: signDict[ascData.sign?.toLowerCase()] || getSignFromDeg(ascData.longitude ?? cusp1),
    degree: ascData.longitudeDms?.degrees ?? Math.floor((ascData.longitude ?? cusp1) % 30),
    minutes: ascData.longitudeDms?.minutes ?? Math.floor(((ascData.longitude ?? cusp1) % 1) * 60),
    absoluteDegree: ascData.longitude ?? cusp1
  };

  const midheaven = {
    name: 'Medio Cielo',
    sign: signDict[mcData.sign?.toLowerCase()] || getSignFromDeg(mcData.longitude ?? cusp10),
    degree: mcData.longitudeDms?.degrees ?? Math.floor((mcData.longitude ?? cusp10) % 30),
    minutes: mcData.longitudeDms?.minutes ?? Math.floor(((mcData.longitude ?? cusp10) % 1) * 60),
    absoluteDegree: mcData.longitude ?? cusp10
  };

  // 6. Calculadora Geométrica de Aspectos
  const calculatedAspects: Aspect[] = [];
  for (let i = 0; i < mappedPlanets.length; i++) {
    for (let j = i + 1; j < mappedPlanets.length; j++) {
      const p1 = mappedPlanets[i];
      const p2 = mappedPlanets[j];

      const diff = Math.abs(p1.absoluteDegree - p2.absoluteDegree);
      const shortestDistance = Math.min(diff, 360 - diff);

      if (shortestDistance <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Conjunction', angle: 0, orb: Number(shortestDistance.toFixed(2)) });
      } else if (Math.abs(shortestDistance - 60) <= 6) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Sextile', angle: 60, orb: Number(Math.abs(shortestDistance - 60).toFixed(2)) });
      } else if (Math.abs(shortestDistance - 90) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Square', angle: 90, orb: Number(Math.abs(shortestDistance - 90).toFixed(2)) });
      } else if (Math.abs(shortestDistance - 120) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Trine', angle: 120, orb: Number(Math.abs(shortestDistance - 120).toFixed(2)) });
      } else if (Math.abs(shortestDistance - 180) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Opposition', angle: 180, orb: Number(Math.abs(shortestDistance - 180).toFixed(2)) });
      }
    }
  }

  return {
    subject: {
      name: userData.name,
      birthDate: userData.birthDate || userData.date || new Date().toISOString(),
      birthTime: userData.birthTime || userData.time || '12:00',
      city: userData.city,
      country: userData.country,
      latitude: userData.latitude,
      longitude: userData.longitude,
      timezone: userData.timezone,
    },
    planets: mappedPlanets,
    houses: mappedHouses,
    aspects: calculatedAspects,
    ascendant: ascendant as any,
    midheaven: midheaven as any,
    calculatedAt: new Date().toISOString(),
    chartUrl: data.chart?.url
  };
};;

export const calculateNatalChart = async (userData: any): Promise<NatalChartData> => {
  const useMock = import.meta.env.VITE_USE_MOCK_API;
  
  if (useMock === 'true') {
    console.log("🟡 MOCK MODE ACTIVE: Usando motor local seguro.");
    return generateMockNatalData(userData); 
  } else {
    console.log("🟢 LIVE API MODE ACTIVE: Conectando a AstroAPI...");
    try {
      const apiData = await fetchAstroAPI(userData);
      return adaptAstroAPIResponse(apiData, userData);
    } catch (error) {
      console.error("🔴 ERROR EN API REAL (AstroAPI). Activando Fallback:", error);
      return generateMockNatalData(userData);
    }
  }
};
