import { motion } from 'framer-motion'
import type { NatalChartData, ZodiacSign, AstroEntity } from '../types'
import { getSignSymbol } from '../utils/zodiac'

const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'
]

const PLANET_SYMBOLS: Record<string, string> = {
  'Sol': '☉', 'Luna': '☽', 'Mercurio': '☿', 'Venus': '♀', 'Marte': '♂',
  'Júpiter': '♃', 'Saturno': '♄', 'Urano': '♅', 'Neptuno': '♆', 'Plutón': '♇',
}

function getPlanetSymbol(name: string): string {
  return PLANET_SYMBOLS[name] || name.charAt(0)
}

interface NatalChartWheelProps {
  data: NatalChartData
  onEntityClick?: (entity: AstroEntity) => void
}

export default function NatalChartWheel({ data, onEntityClick }: NatalChartWheelProps) {
  const cx = 400
  const cy = 400

  const getCoords = (degree: number, r: number) => {
    if (typeof degree !== 'number' || isNaN(degree)) return { x: cx, y: cy }
    const ascDegree = (data.ascendant && typeof data.ascendant.absoluteDegree === 'number' && !isNaN(data.ascendant.absoluteDegree)) 
      ? data.ascendant.absoluteDegree : 0

    const visualDegree = (degree - ascDegree + 180) % 360
    const rad = visualDegree * (Math.PI / 180)
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const planetsToRender = [...data.planets].sort((a, b) => a.absoluteDegree - b.absoluteDegree)
  const planetRadii: number[] = planetsToRender.map(() => 250)
  
  for (let i = 1; i < planetsToRender.length; i++) {
    const diff = (planetsToRender[i].absoluteDegree - planetsToRender[i - 1].absoluteDegree + 360) % 360
    if (diff < 3) {
      planetRadii[i] = planetRadii[i - 1] === 250 ? 220 : 250
    }
  }
  
  if (planetsToRender.length > 1) {
    const diffLast = (planetsToRender[0].absoluteDegree - planetsToRender[planetsToRender.length - 1].absoluteDegree + 360) % 360
    if (diffLast < 3 && planetRadii[0] === planetRadii[planetsToRender.length - 1]) {
      planetRadii[planetsToRender.length - 1] = planetRadii[0] === 250 ? 220 : 250
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, entity: AstroEntity) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEntityClick?.(entity)
    }
  }

  /* ─── Helper: build AstroEntity from planet ─── */
  const buildPlanetEntity = (planet: typeof planetsToRender[0]): AstroEntity => ({
    type: 'planet',
    name: planet.name,
    sign: planet.sign,
    house: planet.house,
    degree: planet.degree,
    minutes: planet.minutes,
  })

  /* ─── Helper: build AstroEntity from house ─── */
  const buildHouseEntity = (house: typeof data.houses[0]): AstroEntity => ({
    type: 'house',
    name: `Casa ${house.houseNumber}`,
    sign: house.sign,
    degree: house.degree,
    details: `Cúspide a ${house.degree.toFixed(1)}° de ${house.sign}`,
  })

  /* ─── Helper: build AstroEntity from angle ─── */
  const buildAngleEntity = (label: string, angle: typeof data.ascendant): AstroEntity => ({
    type: 'angle',
    name: label,
    sign: angle.sign,
    degree: angle.degree,
    minutes: angle.minutes,
  })

  return (
    <div className="w-full max-w-[700px] mx-auto my-12 px-2 xs:px-4 sm:px-6 relative group">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 bg-amber-500/8 blur-3xl rounded-full scale-110 pointer-events-none" />

      <div className="relative aspect-square w-full rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-white/50 backdrop-blur-2xl border border-white/60 p-3 sm:p-5 flex items-center justify-center transition-all duration-500 hover:border-amber-500/20">
        <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-sm select-none overflow-visible">
          
          {/* SVG filter for golden aura on hover */}
          <defs>
            <filter id="golden-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feFlood floodColor="rgba(251,191,36,0.6)" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base outer ring (Zodiac Background) */}
          <circle cx={cx} cy={cy} r={350} fill="#f8fafc" stroke="rgba(245,158,11,0.4)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={300} fill="rgba(241,245,249,0.9)" stroke="rgba(245,158,11,0.25)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={285} fill="transparent" stroke="rgba(245,158,11,0.15)" strokeWidth="0.5" strokeDasharray="6 4" />
          
          {/* Zodiac Segments & Symbols */}
          {ZODIAC_SIGNS.map((sign, i) => {
             const startDeg = i * 30
             const pInner = getCoords(startDeg, 300)
             const pOuter = getCoords(startDeg, 350)
             
             const midDeg = startDeg + 15
             const symPos = getCoords(midDeg, 325)
             
             return (
               <g key={`sign-${sign}`}>
                 <line 
                   x1={pInner.x} y1={pInner.y} x2={pOuter.x} y2={pOuter.y} 
                   stroke="rgba(245,158,11,0.3)" strokeWidth="1" 
                 />
                 <text 
                   x={symPos.x} 
                   y={symPos.y} 
                   fill="rgba(217,119,6,0.85)"
                   className="font-serif text-[28px] transition-opacity hover:opacity-100 cursor-default" 
                   textAnchor="middle" 
                   dominantBaseline="central"
                   aria-label={sign}
                 >
                   {getSignSymbol(sign)}
                 </text>
               </g>
             )
          })}

          {/* House Cusps — Interactive */}
          {data.houses.map(house => {
             const inner = getCoords(house.absoluteDegree, 50)
             const outer = getCoords(house.absoluteDegree, 300)
             const isACMC = house.houseNumber === 1 || house.houseNumber === 10
             
             const numPos = getCoords(house.absoluteDegree + 4, 120)
             const houseEntity = buildHouseEntity(house)
             
             return (
               <motion.g 
                 key={`house-${house.houseNumber}`}
                 whileHover={{ 
                   scale: 1.1,
                   filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))"
                 }}
                 style={{ 
                   transformOrigin: `${numPos.x}px ${numPos.y}px`,
                   cursor: 'pointer',
                 }}
                 onClick={() => onEntityClick?.(houseEntity)}
                 onKeyDown={(e) => handleKeyDown(e, houseEntity)}
                 role="button"
                 tabIndex={0}
                 aria-label={`Casa ${house.houseNumber} en ${house.sign}`}
               >
                 <line 
                   x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} 
                   stroke={isACMC ? "rgba(245,158,11,0.6)" : "rgba(203,213,225,0.4)"} 
                   strokeWidth={isACMC ? 3 : 1} 
                 />
                 <text 
                   x={numPos.x} 
                   y={numPos.y} 
                   fill="rgba(100,116,139,0.8)"
                   className="font-mono text-[13px] font-semibold tracking-tighter" 
                   textAnchor="middle" 
                   dominantBaseline="central"
                 >
                   {house.houseNumber}
                 </text>
               </motion.g>
             )
          })}
          
          {/* AC / MC Interactive Lines */}
          <motion.g
            whileHover={{
              scale: 1.08,
              filter: "drop-shadow(0 0 10px rgba(245,158,11,0.6))"
            }}
            style={{
              transformOrigin: `${getCoords(data.ascendant.absoluteDegree, 180).x}px ${getCoords(data.ascendant.absoluteDegree, 180).y}px`,
              cursor: 'pointer',
            }}
            onClick={() => onEntityClick?.(buildAngleEntity('Ascendente', data.ascendant))}
            onKeyDown={(e) => handleKeyDown(e, buildAngleEntity('Ascendente', data.ascendant))}
            role="button"
            tabIndex={0}
            aria-label={`Ascendente en ${data.ascendant.sign}`}
          >
            <line
              x1={getCoords(data.ascendant.absoluteDegree, 50).x} y1={getCoords(data.ascendant.absoluteDegree, 50).y}
              x2={getCoords(data.ascendant.absoluteDegree, 305).x} y2={getCoords(data.ascendant.absoluteDegree, 305).y}
              stroke="rgba(245,158,11,0.8)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* ASC label */}
            <text
              x={getCoords(data.ascendant.absoluteDegree, 310).x + 6}
              y={getCoords(data.ascendant.absoluteDegree, 310).y}
              fill="rgba(217,119,6,0.9)"
              className="font-sans text-[14px] font-bold tracking-tight"
              textAnchor="start"
              dominantBaseline="central"
            >
              ASC
            </text>
          </motion.g>

          <motion.g
            whileHover={{
              scale: 1.08,
              filter: "drop-shadow(0 0 10px rgba(245,158,11,0.6))"
            }}
            style={{
              transformOrigin: `${getCoords(data.midheaven.absoluteDegree, 180).x}px ${getCoords(data.midheaven.absoluteDegree, 180).y}px`,
              cursor: 'pointer',
            }}
            onClick={() => onEntityClick?.(buildAngleEntity('Medio Cielo', data.midheaven))}
            onKeyDown={(e) => handleKeyDown(e, buildAngleEntity('Medio Cielo', data.midheaven))}
            role="button"
            tabIndex={0}
            aria-label={`Medio Cielo en ${data.midheaven.sign}`}
          >
            <line
              x1={getCoords(data.midheaven.absoluteDegree, 50).x} y1={getCoords(data.midheaven.absoluteDegree, 50).y}
              x2={getCoords(data.midheaven.absoluteDegree, 305).x} y2={getCoords(data.midheaven.absoluteDegree, 305).y}
              stroke="rgba(245,158,11,0.8)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* MC label */}
            <text
              x={getCoords(data.midheaven.absoluteDegree, 310).x + 6}
              y={getCoords(data.midheaven.absoluteDegree, 310).y}
              fill="rgba(217,119,6,0.9)"
              className="font-sans text-[14px] font-bold tracking-tight"
              textAnchor="start"
              dominantBaseline="central"
            >
              MC
            </text>
          </motion.g>

          {/* Aspect Lines */}
          {data.aspects && data.aspects.map((aspect, idx) => {
            if (aspect.type === 'Conjunction') return null

            const p1 = planetsToRender.find((p) => p.name === aspect.planet1)
            const p2 = planetsToRender.find((p) => p.name === aspect.planet2)
            if (!p1 || !p2 || typeof p1.absoluteDegree !== 'number' || typeof p2.absoluteDegree !== 'number' || isNaN(p1.absoluteDegree) || isNaN(p2.absoluteDegree)) return null

            const radius = 200
            const pos1 = getCoords(p1.absoluteDegree, radius)
            const pos2 = getCoords(p2.absoluteDegree, radius)

            let strokeColor = 'rgba(203,213,225,0.35)'
            if (aspect.type === 'Square' || aspect.type === 'Opposition') {
              strokeColor = 'rgba(239,68,68,0.45)'
            } else if (aspect.type === 'Trine' || aspect.type === 'Sextile') {
              strokeColor = 'rgba(56,189,248,0.45)'
            }

            return (
              <line
                key={`aspect-${idx}`}
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke={strokeColor}
                strokeWidth={aspect.orb < 2 ? '1.5' : '1'}
              />
            )
          })}

          {/* ─── Animated Planet Nodes ─── */}
          {planetsToRender.map((planet, i) => {
            const rx = planetRadii[i]
            const pos = getCoords(planet.absoluteDegree, rx)
            const entity = buildPlanetEntity(planet)
            
            return (
              <motion.g 
                key={`planet-${planet.name}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20, 
                  delay: i * 0.05 
                }}
                whileHover={{ 
                  scale: 1.15,
                  filter: "drop-shadow(0 0 12px rgba(251,191,36,0.7))"
                }}
                style={{ 
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                  cursor: 'pointer',
                }}
                onClick={() => onEntityClick?.(entity)}
                onKeyDown={(e) => handleKeyDown(e, entity)}
                role="button"
                tabIndex={0}
                aria-label={`${planet.name} en ${planet.sign}, Casa ${planet.house}`}
              >
                {/* Visual marker line from inner ring */}
                <line 
                  x1={getCoords(planet.absoluteDegree, rx + 18).x} 
                  y1={getCoords(planet.absoluteDegree, rx + 18).y} 
                  x2={getCoords(planet.absoluteDegree, 300).x} 
                  y2={getCoords(planet.absoluteDegree, 300).y} 
                  stroke="rgba(203,213,225,0.35)" 
                  strokeDasharray="4 4" 
                />
                
                {/* Planet Glyph Circle Backdrop */}
                <circle cx={pos.x} cy={pos.y} r="18" fill="#ffffff" />
                <circle cx={pos.x} cy={pos.y} r="18" stroke="rgba(245,158,11,0.6)" fill="transparent" strokeWidth="1.5" />
                
                {/* Planet Glyph Text */}
                <text 
                  x={pos.x} 
                  y={pos.y} 
                  fill="rgba(30,41,59,0.95)"
                  className="font-sans font-medium text-[20px]" 
                  textAnchor="middle" 
                  dominantBaseline="central"
                >
                  <title>{planet.name} en {planet.sign}</title>
                  {getPlanetSymbol(planet.name)}
                </text>
                
                {/* Precise Degree Micro-Detail */}
                <text
                  x={pos.x + 13}
                  y={pos.y + 13}
                  fill="rgba(100,116,139,0.8)"
                  className="font-serif text-[11px] font-medium tracking-tighter"
                  textAnchor="start"
                >
                  {planet.degree}°
                </text>
              </motion.g>
            )
          })}

          {/* Center piece */}
          <circle cx={cx} cy={cy} r="50" fill="rgba(241,245,249,0.95)" stroke="rgba(245,158,11,0.25)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="40" fill="rgba(226,232,240,0.7)" stroke="rgba(245,158,11,0.15)" strokeWidth="0.5" strokeDasharray="3 3"/>
          <circle cx={cx} cy={cy} r="8" fill="rgba(245,158,11,0.85)" />
        </svg>
      </div>
    </div>
  )
}
