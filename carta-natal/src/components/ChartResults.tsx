import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import type { NatalChartData, ZodiacSign, AstroEntity } from '../types'
import { getSignSymbol, getElementColors, getSignElement } from '../utils/zodiac'
import NatalChartWheel from './NatalChartWheel'
import InterpretationPanel from './InterpretationPanel'

interface ChartResultsProps {
  data: NatalChartData
  onReset: () => void
}

export default function ChartResults({ data, onReset }: ChartResultsProps) {
  const { subject, planets, houses, ascendant, midheaven } = data
  const [selectedEntity, setSelectedEntity] = useState<AstroEntity | null>(null)

  const handleEntityClick = (entity: AstroEntity) => {
    setSelectedEntity(entity)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-[fadeInUp_600ms_ease-out]">

      {/* ─── Header ─── */}
      <header className="text-center space-y-3">
        <div className="flex justify-center mb-4" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-amber-500">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 5" />
            <circle cx="16" cy="16" r="2" fill="currentColor" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-800 tracking-tight">
          Carta de {subject.name}
        </h2>
        <p className="text-[14px] text-slate-500">
          {formatDate(subject.birthDate)} · {subject.birthTime}h · {subject.city}, {subject.country}
        </p>
      </header>

      {/* ─── Natal Chart Visual Wheel ─── */}
      <section className="py-4 sm:py-8">
        <NatalChartWheel data={data} onEntityClick={handleEntityClick} />
      </section>

      {/* ─── Key Points: ASC + MC ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AngleCard 
          label="Ascendente" 
          point={ascendant} 
          onClick={() => handleEntityClick({
            type: 'angle',
            name: 'Ascendente',
            sign: ascendant.sign,
            degree: ascendant.degree,
            minutes: ascendant.minutes,
          })}
        />
        <AngleCard 
          label="Medio Cielo" 
          point={midheaven}
          onClick={() => handleEntityClick({
            type: 'angle',
            name: 'Medio Cielo',
            sign: midheaven.sign,
            degree: midheaven.degree,
            minutes: midheaven.minutes,
          })}
        />
      </div>

      {/* ─── Planets ─── */}
      <section>
        <SectionTitle title="Posiciones Planetarias" />
        <div className="grid grid-cols-1 gap-3">
          {planets.map((planet) => {
            const elemColors = getElementColors(planet.sign)
            return (
              <motion.div
                key={`planet-${planet.name}`}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="
                  group cursor-pointer
                  bg-white/60 backdrop-blur-xl
                  border border-white/50 rounded-xl
                  shadow-[0_4px_16px_rgba(0,0,0,0.04)]
                  px-5 py-4
                  flex items-center gap-4
                  transition-all duration-200
                  hover:border-amber-500/30 hover:shadow-[0_6px_20px_rgba(245,158,11,0.08)]
                "
                onClick={() => handleEntityClick({
                  type: 'planet',
                  name: planet.name,
                  sign: planet.sign,
                  house: planet.house,
                  degree: planet.degree,
                  minutes: planet.minutes,
                })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleEntityClick({
                      type: 'planet',
                      name: planet.name,
                      sign: planet.sign,
                      house: planet.house,
                      degree: planet.degree,
                      minutes: planet.minutes,
                    })
                  }
                }}
                aria-label={`${planet.name} en ${planet.sign}, Casa ${planet.house}`}
              >
                {/* Sign glyph */}
                <span
                  className="text-2xl leading-none shrink-0 w-8 text-center text-amber-500/80"
                  aria-hidden="true"
                  title={planet.sign}
                >
                  {getSignSymbol(planet.sign)}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-slate-800">
                      {planet.name}
                    </span>
                    <span className="text-[14px] text-slate-500">
                      en {planet.sign}
                    </span>
                    {planet.retrograde && (
                      <span
                        className="text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
                        title="Retrógrado"
                      >
                        Ꞧ
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-400 mt-0.5 font-mono tabular-nums">
                    {planet.degree}° {planet.minutes}' — Casa {planet.house}
                  </p>
                </div>

                {/* Element badge */}
                <span
                  className={`
                    shrink-0 hidden sm:inline-flex items-center gap-1.5
                    text-[11px] font-medium px-2 py-1 rounded-md
                    ${elemColors.bg} ${elemColors.text}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${elemColors.dot}`} aria-hidden="true" />
                  {getSignElement(planet.sign)}
                </span>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ─── Houses ─── */}
      <section>
        <SectionTitle title="Cúspides de las Casas" subtitle="Sistema Placidus" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {houses.map((house, index) => (
            <motion.div
              key={`house-${index}`}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="
                cursor-pointer
                bg-white/60 backdrop-blur-xl
                border border-white/50 rounded-xl
                shadow-[0_4px_16px_rgba(0,0,0,0.04)]
                px-4 py-3
                transition-all duration-200
                hover:border-amber-500/30 hover:shadow-[0_6px_20px_rgba(245,158,11,0.08)]
              "
              onClick={() => handleEntityClick({
                type: 'house',
                name: `Casa ${house.houseNumber}`,
                sign: house.sign,
                degree: house.degree,
                details: `Cúspide a ${house.degree.toFixed(1)}° de ${house.sign}`,
              })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleEntityClick({
                    type: 'house',
                    name: `Casa ${house.houseNumber}`,
                    sign: house.sign,
                    degree: house.degree,
                  })
                }
              }}
              aria-label={`Casa ${house.houseNumber} en ${house.sign}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium uppercase tracking-wider text-slate-500">
                  Casa {house.houseNumber}
                </span>
                <span className="text-lg leading-none text-amber-500/70" aria-hidden="true">
                  {getSignSymbol(house.sign)}
                </span>
              </div>
              <p className="text-[14px] font-medium text-slate-700">
                {house.sign}
              </p>
              <p className="text-[12px] text-slate-400 font-mono tabular-nums">
                {house.degree.toFixed(1)}°
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Actions ─── */}
      <div className="pt-4 flex flex-col items-center gap-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
        <button
          id="reset-chart"
          type="button"
          onClick={onReset}
          className="
            inline-flex items-center gap-2
            text-[14px] font-medium text-slate-600
            px-5 py-3 rounded-xl
            border border-slate-200 bg-white/60 backdrop-blur-sm
            transition-all duration-200 cursor-pointer
            hover:text-slate-800 hover:border-slate-300 hover:shadow-lg hover:shadow-black/5
            active:scale-[0.98]
          "
        >
          <RotateCcw size={16} aria-hidden="true" />
          Calcular otra carta
        </button>
      </div>

      {selectedEntity && (
        <InterpretationPanel
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  )
}

/* ─── Sub-components ─── */

function AngleCard({ label, point, onClick }: { label: string; point: { sign: ZodiacSign; degree: number; minutes: number; absoluteDegree: number }; onClick: () => void }) {
  const elemColors = getElementColors(point.sign)

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="
        cursor-pointer
        bg-white/60 backdrop-blur-xl
        border border-white/50 rounded-xl
        shadow-[0_4px_16px_rgba(0,0,0,0.04)]
        p-5
        transition-all duration-200
        hover:border-amber-500/30 hover:shadow-[0_6px_20px_rgba(245,158,11,0.08)]
      "
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${label} en ${point.sign}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${elemColors.bg} ${elemColors.text}`}>
          {getSignElement(point.sign)}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl leading-none text-amber-500/80" aria-hidden="true">
          {getSignSymbol(point.sign)}
        </span>
        <div>
          <p className="text-[18px] font-semibold text-slate-800 font-serif">
            {point.sign}
          </p>
          <p className="text-[13px] text-slate-400 font-mono tabular-nums">
            {point.degree}° {point.minutes}'
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-slate-800">
        {title}
      </h3>
      {subtitle && (
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          {subtitle}
        </span>
      )}
    </div>
  )
}

/* ─── Utility ─── */

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
