import { useState, type FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import CityAutocomplete from './CityAutocomplete'
import type { BirthChartFormData, BirthChartPayload, CityData } from '../types'
import { getUtcOffset, buildLocalDateTime } from '../data'

interface BirthChartFormProps {
  onSubmit: (payload: BirthChartPayload) => void
  isSubmitting: boolean
}

export default function BirthChartForm({ onSubmit, isSubmitting }: BirthChartFormProps) {
  const [formData, setFormData] = useState<BirthChartFormData>({
    name: '',
    birthDate: '',
    birthTime: '',
    city: null,
  })

  const isValid =
    formData.name.trim().length > 0 &&
    formData.birthDate !== '' &&
    formData.birthTime !== '' &&
    formData.city !== null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || !formData.city || isSubmitting) return

    const date = new Date(
      `${formData.birthDate}T${formData.birthTime}:00`
    )

    const utcOffset = getUtcOffset(formData.city.timezone, date)
    const localDateTime = buildLocalDateTime(
      formData.birthDate,
      formData.birthTime,
      formData.city.timezone
    )

    const payload: BirthChartPayload = {
      name: formData.name.trim(),
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      city: formData.city.name,
      country: formData.city.country,
      latitude: formData.city.latitude,
      longitude: formData.city.longitude,
      timezone: formData.city.timezone,
      utcOffset,
      localDateTime,
    }

    onSubmit(payload)
  }

  const updateField = <K extends keyof BirthChartFormData>(
    field: K,
    value: BirthChartFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-8"
      noValidate
      aria-label="Formulario de carta natal"
    >
      {/* Name */}
      <fieldset className="space-y-2">
        <label
          htmlFor="birth-name"
          className="block text-[13px] font-medium tracking-wide uppercase text-slate-500"
        >
          Nombre
        </label>
        <input
          id="birth-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Tu nombre completo"
          autoComplete="given-name"
          disabled={isSubmitting}
          className="
            w-full px-4 py-4
            bg-white/70 border border-slate-200 rounded-xl
            text-[16px] text-slate-800 placeholder:text-slate-400
            transition-all duration-200
            hover:border-slate-300
            focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
      </fieldset>

      {/* Date & Time — Side by side on tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <fieldset className="space-y-2">
          <label
            htmlFor="birth-date"
            className="block text-[13px] font-medium tracking-wide uppercase text-slate-500"
          >
            Fecha de nacimiento
          </label>
          <input
            id="birth-date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
            className="
              w-full px-4 py-4
              bg-white/70 border border-slate-200 rounded-xl
              text-[16px] text-slate-800
              transition-all duration-200
              hover:border-slate-300
              focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </fieldset>

        <fieldset className="space-y-2">
          <label
            htmlFor="birth-time"
            className="block text-[13px] font-medium tracking-wide uppercase text-slate-500"
          >
            Hora exacta
          </label>
          <input
            id="birth-time"
            type="time"
            value={formData.birthTime}
            onChange={(e) => updateField('birthTime', e.target.value)}
            disabled={isSubmitting}
            className="
              w-full px-4 py-4
              bg-white/70 border border-slate-200 rounded-xl
              text-[16px] text-slate-800
              transition-all duration-200
              hover:border-slate-300
              focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
          <p className="text-[12px] text-slate-400 mt-1">
            Si no la sabes exacta, usa una aproximación
          </p>
        </fieldset>
      </div>

      {/* City */}
      <fieldset className="space-y-2">
        <label
          htmlFor="birth-city"
          className="block text-[13px] font-medium tracking-wide uppercase text-slate-500"
        >
          Ciudad de nacimiento
        </label>
        <CityAutocomplete
          id="birth-city"
          value={formData.city}
          onChange={(city: CityData | null) => updateField('city', city)}
        />
      </fieldset>

      {/* Divider */}
      <div className="pt-2">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* Submit */}
      <button
        id="submit-chart"
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`
          btn-shimmer
          w-full py-4 px-8 rounded-xl
          text-[15px] font-semibold tracking-wide
          transition-all duration-300 cursor-pointer
          flex items-center justify-center gap-3
          ${isValid && !isSubmitting
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] shadow-lg shadow-amber-600/20'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }
        `}
      >
        <Sparkles size={18} aria-hidden="true" />
        <span>Calcular mi Carta</span>
      </button>
    </form>
  )
}
