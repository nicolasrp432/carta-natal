import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, ChevronDown, Loader2 } from 'lucide-react'
import type { CityData } from '../types'

interface CityAutocompleteProps {
  value: CityData | null
  onChange: (city: CityData | null) => void
  id: string
}

export default function CityAutocomplete({ value, onChange, id }: CityAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<CityData[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const selectCity = useCallback((city: CityData) => {
    onChange(city)
    setQuery(`${city.name}, ${city.country}`)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [onChange])

  const clearSelection = useCallback(() => {
    onChange(null)
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          selectCity(results[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)

    if (value) {
      onChange(null)
    }

    if (newValue.length < 3) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    setIsOpen(true)
    setIsLoading(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newValue)}&format=json&addressdetails=1&limit=5`
        const response = await fetch(url)
        if (!response.ok) throw new Error('API fetch error')
        
        const data: any[] = await response.json()
        
        const fetchedCities: CityData[] = data.map((item) => {
          const address = item.address || {}
          const cityName = address.city || address.town || address.village || address.municipality || item.name || 'Ciudad'
          const stateOrRegion = address.state || address.region || ''
          const countryName = address.country || 'Desconocido'
          
          return {
            name: `${cityName}${stateOrRegion && stateOrRegion !== cityName ? `, ${stateOrRegion}` : ''}`,
            country: countryName,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            timezone: 'Auto',
          }
        })
        
        const uniqueCities = Array.from(new Map(fetchedCities.map(c => [`${c.name}-${c.country}`, c])).values())
        
        setResults(uniqueCities)
      } catch (error) {
        console.error("Geocoding fetch failed:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && !value) setIsOpen(true)
          }}
          placeholder="Escribe tu ciudad..."
          className={`
            w-full pl-11 pr-10 py-4
            bg-white/70 border rounded-xl
            text-[16px] text-slate-800 placeholder:text-slate-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60
            ${value 
              ? 'border-amber-500/40 bg-amber-50/40' 
              : 'border-slate-200 hover:border-slate-300'
            }
          `}
        />
        
        {value ? (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
            aria-label="Limpiar selección"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        ) : (
          <ChevronDown
            size={16}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden="true"
          />
        )}
        
        {/* Loading Spinner Indicator */}
        {!value && isLoading && (
          <Loader2 
            size={16} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-spin pointer-events-none" 
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="
            city-dropdown-enter city-list
            absolute z-50 w-full mt-2
            bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl
            shadow-xl shadow-black/8
            max-h-[240px] overflow-y-auto
            py-1
          "
        >
          {isLoading && results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
               <Loader2 size={14} className="animate-spin text-slate-400" />
               Buscando ciudad...
            </li>
          ) : results.length === 0 && !isLoading && query.length >= 3 ? (
            <li className="px-4 py-3 text-sm text-slate-400">
               No encontramos esa ciudad.
            </li>
          ) : (
            results.map((city, index) => (
              <li
                key={`${city.name}-${city.country}-${index}`}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={() => selectCity(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer
                  transition-colors duration-100
                  ${highlightedIndex === index
                    ? 'bg-amber-50 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <MapPin
                  size={14}
                  className={`shrink-0 ${highlightedIndex === index ? 'text-amber-500' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-medium truncate">{city.name}</span>
                  <span className="text-[12px] text-slate-400 truncate">{city.country}</span>
                </div>
                <span className="ml-auto text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                  {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Selected city info badge */}
      {value && (
        <div className="mt-2 flex items-center justify-between text-[12px] text-slate-400">
          <span className="font-mono tabular-nums text-slate-400 tracking-wider">
            {value.latitude.toFixed(4)}°, {value.longitude.toFixed(4)}°
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-600 font-medium">
            GPS Exacto
          </span>
        </div>
      )}
    </div>
  )
}
