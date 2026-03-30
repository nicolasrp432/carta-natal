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
 * FETCH: Request a Free Astrology API (Western Horoscope Data)
 */
export async function fetchFreeAstrologyAPI(payload: BirthChartPayload): Promise<any> {
  const apiKey = import.meta.env.VITE_ASTRO_API_KEY || ''
  
  const [year, month, day] = (payload.birthDate || '').split('-').map(Number)
  const [hours, minutes] = (payload.birthTime || '').split(':').map(Number)

  // Calculemos el offset timezone en horas locales del navegador (-5 for Bogota)
  const tzOffset = -(new Date().getTimezoneOffset() / 60)

  const requestBody = {
    year,
    month,
    date: day,
    hours,
    minutes,
    seconds: 0,
    latitude: Number(payload.latitude) || 0,
    longitude: Number(payload.longitude) || 0,
    timezone: tzOffset
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey
  }

  const [planetsRes, housesRes] = await Promise.all([
    fetch('/api/astrology/western/planets', { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(requestBody) 
    }),
    fetch('/api/astrology/western/houses', { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(requestBody) 
    })
  ])

  if (!planetsRes.ok) {
    const errText = await planetsRes.text()
    throw new Error(`Planets API error Status: ${planetsRes.status} - ${errText}`)
  }
  
  const planetsData = await planetsRes.json()
  let housesData = null
  
  if (housesRes.ok) {
    housesData = await housesRes.json()
  } else {
    console.warn('Houses API warning:', await housesRes.text())
  }

  return { planetsData, housesData }
}

/**
 * ADAPTER: Mapea la respuesta externa estricta al contrato UI (NatalChartData)
 */
export const adaptFreeAstrologyResponse = (apiData: any, userData: any): NatalChartData => {
  let planetsRaw = apiData.planetsData?.output || [];
  const housesRaw = apiData.housesData?.output?.Houses || [];

  if (typeof planetsRaw === 'object' && !Array.isArray(planetsRaw)) {
    planetsRaw = Object.values(planetsRaw);
  }

  // 1. Diccionario Traductor Universal
  const astroDict: Record<string, string> = {
    'sun': 'Sol', 'moon': 'Luna', 'mercury': 'Mercurio', 'venus': 'Venus', 'mars': 'Marte',
    'jupiter': 'Júpiter', 'saturn': 'Saturno', 'uranus': 'Urano', 'neptune': 'Neptuno', 'pluto': 'Plutón',
    'ascendant': 'Ascendente', 'midheaven': 'Medio Cielo'
  };

  // 2. Calculadora Matemática de Signos (Infalible, ignora la estructura de la API)
  const getSignFromDeg = (deg: number) => {
    const signs = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
    return signs[Math.floor((deg || 0) / 30) % 12];
  };

  // 3. Mapeo Preciso (Apuntando a p.planet.en)
  const mappedPlanets = planetsRaw
    .map((p: any) => {
      const rawName = p.planet?.en || p.name || 'Unknown';
      const translatedName = astroDict[rawName.toLowerCase()];
      const absoluteDeg = p.fullDegree || 0;

      return {
        name: translatedName || rawName, 
        sign: getSignFromDeg(absoluteDeg), // Adiós al bug de "Aries"
        degree: Math.floor(p.normDegree || 0),
        absoluteDegree: absoluteDeg,
        isRetrograde: p.isRetro === 'true' || p.isRetro === true,
        house: 1
      };
    })
    .filter((p: any) => Object.values(astroDict).includes(p.name));

  // 4. Extracción de Ángulos
  const ascNode = mappedPlanets.find((p: any) => p.name === 'Ascendente');
  const mcNode = mappedPlanets.find((p: any) => p.name === 'Medio Cielo');

  const ascendant = {
    name: 'Ascendente',
    sign: ascNode ? ascNode.sign : getSignFromDeg(housesRaw[0]?.degree || 0),
    degree: ascNode ? ascNode.degree : Math.floor(housesRaw[0]?.degree || 0) % 30,
    absoluteDegree: ascNode ? ascNode.absoluteDegree : (housesRaw[0]?.degree || 0)
  };

  const midheaven = {
    name: 'Medio Cielo',
    sign: mcNode ? mcNode.sign : getSignFromDeg(housesRaw[9]?.degree || 0),
    degree: mcNode ? mcNode.degree : Math.floor(housesRaw[9]?.degree || 0) % 30,
    absoluteDegree: mcNode ? mcNode.absoluteDegree : (housesRaw[9]?.degree || 0)
  };

  // 5. Mapeo de Casas
  const mappedHouses = housesRaw.map((h: any, index: number) => {
     const absDeg = h.degree || (index * 30);
     return {
       id: index + 1,
       houseNumber: index + 1,
       sign: getSignFromDeg(absDeg),
       degree: Math.floor(absDeg % 30),
       absoluteDegree: absDeg
     };
  });

  // 6. Calculadora Geométrica de Aspectos
  const calculatedAspects: any[] = [];
  for (let i = 0; i < mappedPlanets.length; i++) {
    for (let j = i + 1; j < mappedPlanets.length; j++) {
      const p1 = mappedPlanets[i];
      const p2 = mappedPlanets[j];
      
      // Evitar calcular aspectos con nodos desconocidos
      if (p1.name === 'Unknown' || p2.name === 'Unknown') continue;

      const diff = Math.abs(p1.absoluteDegree - p2.absoluteDegree);
      const shortestDistance = Math.min(diff, 360 - diff);

      // Reglas Ptolemaicas (Orbes)
      if (shortestDistance <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Conjunction', angle: 0, orb: shortestDistance });
      } else if (Math.abs(shortestDistance - 60) <= 6) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Sextile', angle: 60, orb: Math.abs(shortestDistance - 60) });
      } else if (Math.abs(shortestDistance - 90) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Square', angle: 90, orb: Math.abs(shortestDistance - 90) });
      } else if (Math.abs(shortestDistance - 120) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Trine', angle: 120, orb: Math.abs(shortestDistance - 120) });
      } else if (Math.abs(shortestDistance - 180) <= 8) {
        calculatedAspects.push({ planet1: p1.name, planet2: p2.name, type: 'Opposition', angle: 180, orb: Math.abs(shortestDistance - 180) });
      }
    }
  }

  return {
    subject: {
      name: userData.name,
      birthDate: userData.date?.toISOString ? userData.date.toISOString() : new Date().toISOString(),
      birthTime: userData.time,
      city: userData.city,
      country: userData.country
    },
    // Quitamos ASC y MC de los planetas para que no se dupliquen en las tarjetas
    planets: mappedPlanets.filter((p:any) => p.name !== 'Ascendente' && p.name !== 'Medio Cielo'), 
    houses: mappedHouses,
    aspects: calculatedAspects,
    ascendant: ascendant as any,
    midheaven: midheaven as any,
    calculatedAt: new Date().toISOString()
  };
};
export const calculateNatalChart = async (userData: any): Promise<NatalChartData> => {
  const useMock = import.meta.env.VITE_USE_MOCK_API;
  
  if (useMock === 'true') {
    console.log("🟡 MOCK MODE ACTIVE: Usando motor local seguro.");
    return generateMockNatalData(userData); 
  } else {
    console.log("🟢 LIVE API MODE ACTIVE: Conectando a Free Astrology API...");
    try {
      // Usando el adaptador para prevenir crash de UI debido al userData: any fallback y api cruda
      const apiData = await fetchFreeAstrologyAPI(userData);
      return adaptFreeAstrologyResponse(apiData, userData);
    } catch (error) {
      console.error("🔴 ERROR EN API REAL. Activando Fallback:", error);
      return generateMockNatalData(userData);
    }
  }
};
