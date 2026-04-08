import { useEffect, useState } from 'react'

const PHASES = [
  'Calculando alineaciones celestes…',
  'Trazando posiciones planetarias…',
  'Identificando casas astrológicas…',
  'Determinando ascendente y medio cielo…',
]

export default function LoadingScreen() {
  const [phaseIndex, setPhaseIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-28" role="status" aria-live="polite">
      {/* Rotating astro glyph */}
      <div className="relative mb-10" aria-hidden="true">
        {/* Outer ring — slow rotation */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          className="animate-[spin_8s_linear_infinite] text-amber-500/70"
        >
          <circle cx="36" cy="36" r="34" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" />
          {/* Tick marks at 30° intervals */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            const x1 = 36 + 32 * Math.cos(angle)
            const y1 = 36 + 32 * Math.sin(angle)
            const x2 = 36 + 34 * Math.cos(angle)
            const y2 = 36 + 34 * Math.sin(angle)
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="currentColor" strokeWidth="0.75"
              />
            )
          })}
        </svg>

        {/* Inner cross — counter-rotation */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_6s_linear_infinite_reverse] text-amber-500"
        >
          <path
            d="M18 4L18 32M4 18L32 18M8 8L28 28M28 8L8 28"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <circle cx="18" cy="18" r="3" fill="currentColor" opacity="0.6" />
        </svg>

        {/* Center pulse dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      </div>

      {/* Phase text */}
      <p
        className="font-serif text-xl sm:text-2xl text-slate-600 text-center transition-opacity duration-300 min-h-[2em]"
        key={phaseIndex}
        style={{ animation: 'phaseIn 500ms ease-out' }}
      >
        {PHASES[phaseIndex]}
      </p>

      {/* Subtle progress bar */}
      <div className="mt-8 w-48 h-px bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
          style={{ animation: 'progressFill 2s ease-in-out forwards' }}
        />
      </div>

      {/* Screen reader text */}
      <span className="sr-only">Calculando carta natal, por favor espere…</span>
    </div>
  )
}
