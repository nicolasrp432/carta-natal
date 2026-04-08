import { useState, useCallback } from 'react'
import BirthChartForm from './components/BirthChartForm'
import LoadingScreen from './components/LoadingScreen'
import ChartResults from './components/ChartResults'
import { calculateNatalChart } from './services/astrologyService'
import type { AppView, BirthChartPayload, NatalChartData } from './types'

export default function App() {
  const [view, setView] = useState<AppView>('form')
  const [chartData, setChartData] = useState<NatalChartData | null>(null)

  const handleSubmit = useCallback(async (payload: BirthChartPayload) => {
    setView('loading')

    try {
      const result = await calculateNatalChart(payload)
      setChartData(result)
      setView('results')
    } catch (error) {
      console.error('Error calculating chart:', error)
      setView('form')
    }
  }, [])

  const handleReset = useCallback(() => {
    setChartData(null)
    setView('form')
  }, [])

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 flex flex-col items-center px-5 py-12 sm:py-16">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <main className={`relative w-full ${view === 'results' ? 'max-w-2xl' : 'max-w-lg'} transition-all duration-500`}>

        {/* ─── Header (always visible) ─── */}
        <header className="text-center mb-12 sm:mb-14">
          {/* Decorative star */}
          <div className="mb-6 flex justify-center" aria-hidden="true">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="text-amber-500"
            >
              <path
                d="M20 0L20 40M0 20L40 20M5.86 5.86L34.14 34.14M34.14 5.86L5.86 34.14"
                stroke="currentColor"
                strokeWidth="0.75"
              />
              <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-slate-800 tracking-tight leading-tight">
            Carta Natal
          </h1>

          {view === 'form' && (
            <p className="mt-3 text-[15px] sm:text-base text-slate-500 max-w-sm mx-auto leading-relaxed">
              Introduce los datos de tu nacimiento para calcular
              la posición exacta de los astros.
            </p>
          )}

          {/* Gold accent line */}
          <div className="mt-6 mx-auto w-12 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" aria-hidden="true" />
        </header>

        {/* ─── View: Form ─── */}
        {view === 'form' && (
          <div className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-2xl p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <BirthChartForm
              onSubmit={handleSubmit}
              isSubmitting={false}
            />
          </div>
        )}

        {/* ─── View: Loading ─── */}
        {view === 'loading' && (
          <div className="bg-white/60 backdrop-blur-2xl border border-white/50 rounded-2xl p-6 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <LoadingScreen />
          </div>
        )}

        {/* ─── View: Results ─── */}
        {view === 'results' && chartData && (
          <ChartResults data={chartData} onReset={handleReset} />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[12px] text-slate-400 leading-relaxed">
            {view === 'results'
              ? 'Datos simulados con fines demostrativos. Motor astronómico mock.'
              : (
                <>
                  Los datos se procesan localmente en tu navegador.
                  <br />
                  No almacenamos información personal.
                </>
              )
            }
          </p>
        </footer>
      </main>
    </div>
  )
}
