import { RotateCcw } from 'lucide-react'
import type { NatalChartData, ZodiacSign } from '../types'
import { getSignSymbol, getElementColors, getSignElement } from '../utils/zodiac'
import NatalChartWheel from './NatalChartWheel'

interface ChartResultsProps {
  data: NatalChartData
  onReset: () => void
}

export default function ChartResults({ data, onReset }: ChartResultsProps) {
  const { subject, planets, houses, ascendant, midheaven } = data

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-[fadeInUp_600ms_ease-out]">

      {/* ─── Header ─── */}
      <header className="text-center space-y-3">
        <div className="flex justify-center mb-4" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gold-500">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 5" />
            <circle cx="16" cy="16" r="2" fill="currentColor" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
          Carta de {subject.name}
        </h2>
        <p className="text-[14px] text-stone-400">
          {formatDate(subject.birthDate)} · {subject.birthTime}h · {subject.city}, {subject.country}
        </p>
      </header>

      {/* ─── Natal Chart Visual Wheel ─── */}
      <section className="py-4 sm:py-8">
        <NatalChartWheel data={data} />
      </section>

      {/* ─── Key Points: ASC + MC ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AngleCard label="Ascendente" point={ascendant} />
        <AngleCard label="Medio Cielo" point={midheaven} />
      </div>

      {/* ─── Planets ─── */}
      <section>
        <SectionTitle title="Posiciones Planetarias" />
        <div className="grid grid-cols-1 gap-3">
          {planets.map((planet) => {
            const elemColors = getElementColors(planet.sign)
            return (
              <div
                key={`planet-${planet.name}`}
                className="
                  group
                  bg-white/80 backdrop-blur-sm
                  border border-stone-200/60 rounded-xl
                  px-5 py-4
                  flex items-center gap-4
                  transition-all duration-200
                  hover:border-stone-300/80 hover:shadow-sm
                "
              >
                {/* Sign glyph */}
                <span
                  className="text-2xl leading-none shrink-0 w-8 text-center"
                  aria-hidden="true"
                  title={planet.sign}
                >
                  {getSignSymbol(planet.sign)}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-stone-900">
                      {planet.name}
                    </span>
                    <span className="text-[14px] text-stone-500">
                      en {planet.sign}
                    </span>
                    {planet.retrograde && (
                      <span
                        className="text-[11px] font-medium text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded"
                        title="Retrógrado"
                      >
                        Ꞧ
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-stone-400 mt-0.5 font-mono tabular-nums">
                    {planet.degree}° {planet.minutes}' — Casa {planet.house}
                  </p>
                </div>

                {/* Element badge (hidden on mobile to save space) */}
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
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Houses ─── */}
      <section>
        <SectionTitle title="Cúspides de las Casas" subtitle="Sistema Placidus" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {houses.map((house, index) => (
            <div
              key={`house-${index}`}
              className="
                bg-white/80 backdrop-blur-sm
                border border-stone-200/60 rounded-xl
                px-4 py-3
                transition-all duration-200
                hover:border-stone-300/80
              "
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium uppercase tracking-wider text-stone-400">
                  Casa {house.houseNumber}
                </span>
                <span className="text-lg leading-none" aria-hidden="true">
                  {getSignSymbol(house.sign)}
                </span>
              </div>
              <p className="text-[14px] font-medium text-stone-800">
                {house.sign}
              </p>
              <p className="text-[12px] text-stone-400 font-mono tabular-nums">
                {house.degree.toFixed(1)}°
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Actions ─── */}
      <div className="pt-4 flex flex-col items-center gap-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200 to-transparent" aria-hidden="true" />
        <button
          id="reset-chart"
          type="button"
          onClick={onReset}
          className="
            inline-flex items-center gap-2
            text-[14px] font-medium text-stone-500
            px-5 py-3 rounded-xl
            border border-stone-200 bg-white
            transition-all duration-200 cursor-pointer
            hover:text-stone-700 hover:border-stone-300 hover:shadow-sm
            active:scale-[0.98]
          "
        >
          <RotateCcw size={16} aria-hidden="true" />
          Calcular otra carta
        </button>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

function AngleCard({ label, point }: { label: string; point: { sign: ZodiacSign; degree: number; minutes: number; absoluteDegree: number } }) {
  const elemColors = getElementColors(point.sign)

  return (
    <div className="
      bg-white/80 backdrop-blur-sm
      border border-stone-200/60 rounded-xl
      p-5
      transition-all duration-200
      hover:border-gold-300/60 hover:shadow-sm
    ">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium uppercase tracking-wider text-stone-400">
          {label}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${elemColors.bg} ${elemColors.text}`}>
          {getSignElement(point.sign)}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {getSignSymbol(point.sign)}
        </span>
        <div>
          <p className="text-[18px] font-semibold text-stone-900 font-serif">
            {point.sign}
          </p>
          <p className="text-[13px] text-stone-400 font-mono tabular-nums">
            {point.degree}° {point.minutes}'
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
        {title}
      </h3>
      {subtitle && (
        <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
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
