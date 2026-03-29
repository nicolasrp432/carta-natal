import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import type { CityData } from '../types'
import { searchCities } from '../data'

interface CityAutocompleteProps {
  value: CityData | null
  onChange: (city: CityData | null) => void
  id: string
}

export default function CityAutocomplete({ value, onChange, id }: CityAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Derive search results from query — no useEffect needed
  const results = useMemo<CityData[]>(() => {
    if (query.length >= 2 && !value) {
      return searchCities(query)
    }
    return []
  }, [query, value])

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
    // Open dropdown when typing
    if (newValue.length >= 2) {
      setIsOpen(true)
      setHighlightedIndex(-1)
    } else {
      setIsOpen(false)
    }
    if (value) {
      onChange(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
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
            bg-white border rounded-xl
            text-[16px] text-stone-900 placeholder:text-stone-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500
            ${value 
              ? 'border-gold-500/40 bg-gold-50/30' 
              : 'border-stone-200 hover:border-stone-300'
            }
          `}
        />
        {value ? (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-150 cursor-pointer"
            aria-label="Limpiar selección"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        ) : (
          <ChevronDown
            size={16}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="
            city-dropdown-enter city-list
            absolute z-50 w-full mt-2
            bg-white border border-stone-200 rounded-xl
            shadow-lg shadow-stone-900/5
            max-h-[240px] overflow-y-auto
            py-1
          "
        >
          {results.map((city, index) => (
            <li
              key={`${city.name}-${city.country}`}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              onClick={() => selectCity(city)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer
                transition-colors duration-100
                ${highlightedIndex === index
                  ? 'bg-gold-50 text-stone-900'
                  : 'text-stone-700 hover:bg-stone-50'
                }
              `}
            >
              <MapPin
                size={14}
                className={`shrink-0 ${highlightedIndex === index ? 'text-gold-500' : 'text-stone-400'}`}
                aria-hidden="true"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-medium truncate">{city.name}</span>
                <span className="text-[12px] text-stone-400">{city.country}</span>
              </div>
              <span className="ml-auto text-[11px] text-stone-300 font-mono tabular-nums shrink-0">
                {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Selected city info badge */}
      {value && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-stone-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-600 font-medium">
            {value.timezone}
          </span>
          <span className="text-stone-300">·</span>
          <span className="font-mono tabular-nums">
            {value.latitude.toFixed(4)}°, {value.longitude.toFixed(4)}°
          </span>
        </div>
      )}
    </div>
  )
}
