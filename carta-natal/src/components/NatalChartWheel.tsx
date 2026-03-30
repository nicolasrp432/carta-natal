// component requires no React import with the new JSX transform
import type { NatalChartData, ZodiacSign } from '../types'
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
  onPlanetClick?: (planet: any) => void
}

export default function NatalChartWheel({ data, onPlanetClick }: NatalChartWheelProps) {
  const cx = 400
  const cy = 400

  // Trig helper to convert degrees to SVG coordinates
  const getCoords = (degree: number, r: number) => {
    if (typeof degree !== 'number' || isNaN(degree)) return { x: cx, y: cy }
    const ascDegree = (data.ascendant && typeof data.ascendant.absoluteDegree === 'number' && !isNaN(data.ascendant.absoluteDegree)) 
      ? data.ascendant.absoluteDegree : 0

    // 0 is right, 180 is left. We want to align the Ascendant exactly at the left (180deg).
    const visualDegree = (degree - ascDegree + 180) % 360
    const rad = visualDegree * (Math.PI / 180)
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  // Calculate planetary radii to avoid overlapping with basic grouping logic 
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

  console.log("Astrology Data Debug:", data)

  return (
    <div className="w-full max-w-[700px] mx-auto my-12 px-2 xs:px-4 sm:px-6 relative group">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 bg-gold-500/5 blur-3xl rounded-full scale-110 pointer-events-none" />

      <div className="relative aspect-square w-full rounded-full shadow-2xl shadow-stone-900/5 bg-white/60 backdrop-blur-xl border border-stone-200/50 p-3 sm:p-5 flex items-center justify-center transition-all duration-500 hover:border-gold-300/40">
        <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-sm select-none">
          
          {/* Base outer ring (Zodiac Background) */}
          <circle cx={cx} cy={cy} r={350} className="fill-stone-900/80 stroke-yellow-600/50" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={300} className="fill-stone-50 stroke-yellow-600/30" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={285} className="fill-transparent stroke-yellow-600/20" strokeWidth="0.5" strokeDasharray="6 4" />
          
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
                   className="stroke-yellow-600/40" strokeWidth="1" 
                 />
                 <text 
                   x={symPos.x} 
                   y={symPos.y} 
                   className="fill-yellow-500 font-serif text-[28px] opacity-90 transition-opacity hover:opacity-100 cursor-default" 
                   textAnchor="middle" 
                   dominantBaseline="central"
                   aria-label={sign}
                 >
                   {getSignSymbol(sign)}
                 </text>
               </g>
             )
          })}

          {/* House Cusps */}
          {data.houses.map(house => {
             const inner = getCoords(house.absoluteDegree, 50)
             const outer = getCoords(house.absoluteDegree, 300)
             const isACMC = house.houseNumber === 1 || house.houseNumber === 10
             
             // Put house number near center, slightly offset clockwise from cusp
             const numPos = getCoords(house.absoluteDegree + 4, 120)
             
             return (
               <g key={`house-${house.houseNumber}`}>
                 <line 
                   x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} 
                   className={isACMC ? "stroke-yellow-600/70" : "stroke-stone-300/80"} 
                   strokeWidth={isACMC ? 3 : 1} 
                 />
                 <text 
                   x={numPos.x} 
                   y={numPos.y} 
                   className="fill-stone-400/80 font-mono text-[13px] font-semibold tracking-tighter" 
                   textAnchor="middle" 
                   dominantBaseline="central"
                 >
                   {house.houseNumber}
                 </text>
               </g>
             )
          })}
          
          {/* Detailed Highlight for actual AC / MC Points */}
          <line
            x1={getCoords(data.ascendant.absoluteDegree, 50).x} y1={getCoords(data.ascendant.absoluteDegree, 50).y}
            x2={getCoords(data.ascendant.absoluteDegree, 305).x} y2={getCoords(data.ascendant.absoluteDegree, 305).y}
            className="stroke-yellow-600/90"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1={getCoords(data.midheaven.absoluteDegree, 50).x} y1={getCoords(data.midheaven.absoluteDegree, 50).y}
            x2={getCoords(data.midheaven.absoluteDegree, 305).x} y2={getCoords(data.midheaven.absoluteDegree, 305).y}
            className="stroke-yellow-600/90"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Aspect Lines */}
          {data.aspects && data.aspects.map((aspect, idx) => {
            if (aspect.type === 'Conjunction') return null

            const p1 = planetsToRender.find((p) => p.name === aspect.planet1)
            const p2 = planetsToRender.find((p) => p.name === aspect.planet2)
            if (!p1 || !p2 || typeof p1.absoluteDegree !== 'number' || typeof p2.absoluteDegree !== 'number' || isNaN(p1.absoluteDegree) || isNaN(p2.absoluteDegree)) return null

            const radius = 200 // inner routing for lines
            const pos1 = getCoords(p1.absoluteDegree, radius)
            const pos2 = getCoords(p2.absoluteDegree, radius)

            let strokeClass = 'stroke-stone-300/30'
            if (aspect.type === 'Square' || aspect.type === 'Opposition') {
              strokeClass = 'stroke-red-500/60'
            } else if (aspect.type === 'Trine' || aspect.type === 'Sextile') {
              strokeClass = 'stroke-sky-400/60'
            }

            return (
              <line
                key={`aspect-${idx}`}
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                className={strokeClass}
                strokeWidth={aspect.orb < 2 ? '1.5' : '1'}
              />
            )
          })}

          {planetsToRender.map((planet, i) => {
            const rx = planetRadii[i]
            const pos = getCoords(planet.absoluteDegree, rx)
            
            return (
              <g 
                key={`planet-${planet.name}`} 
                className="group/planet transition-transform hover:scale-125 cursor-pointer origin-center" 
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                onClick={() => onPlanetClick?.(planet)}
              >
                {/* Visual marker line from inner ring */}
                <line 
                  x1={getCoords(planet.absoluteDegree, rx + 18).x} 
                  y1={getCoords(planet.absoluteDegree, rx + 18).y} 
                  x2={getCoords(planet.absoluteDegree, 300).x} 
                  y2={getCoords(planet.absoluteDegree, 300).y} 
                  className="stroke-stone-300/50" 
                  strokeDasharray="4 4" 
                />
                
                {/* Planet Glyph Circle Backdrop */}
                <circle cx={pos.x} cy={pos.y} r="18" className="fill-stone-900 shadow-md transition-colors group-hover/planet:fill-stone-800" />
                <circle cx={pos.x} cy={pos.y} r="18" className="stroke-yellow-500/70 fill-transparent" strokeWidth="1.5" />
                
                {/* Planet Glyph Text */}
                <text 
                  x={pos.x} 
                  y={pos.y} 
                  className="fill-stone-200 font-sans font-medium text-[20px]" 
                  textAnchor="middle" 
                  dominantBaseline="central"
                  aria-label={planet.name}
                >
                  <title>{planet.name} en {planet.sign}</title>
                  {getPlanetSymbol(planet.name)}
                </text>
                
                {/* Precise Degree Micro-Detail */}
                <text
                  x={pos.x + 13}
                  y={pos.y + 13}
                  className="fill-stone-400 font-serif text-[11px] font-medium tracking-tighter"
                  textAnchor="start"
                >
                  {planet.degree}°
                </text>
              </g>
            )
          })}

          {/* Center piece */}
          <circle cx={cx} cy={cy} r="50" className="fill-stone-50 stroke-yellow-600/30" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="40" className="fill-stone-100 stroke-yellow-600/20" strokeWidth="0.5" strokeDasharray="3 3"/>
          <circle cx={cx} cy={cy} r="8" className="fill-yellow-600/90" />
        </svg>
      </div>
    </div>
  )
}
