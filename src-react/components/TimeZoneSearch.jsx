import { useState, useRef } from 'react'
import { getLocations, isValidLocation } from '../data/timeZoneData'

export default function TimeZoneSearch({ onSelect, onTogglePeripherals, peripheralsEnabled }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [highlighted, setHighlighted] = useState(0)
  const isSelectingRef = useRef(false)
  const validationTimer = useRef(null)

  function filterSuggestions(value) {
    if (!value) return []
    const lower = value.toLowerCase()
    return getLocations()
      .filter(loc => loc.toLowerCase().startsWith(lower) || loc.toLowerCase().includes(lower))
      .slice(0, 10)
  }

  function handleChange(e) {
    const value = e.target.value
    setQuery(value)
    isSelectingRef.current = false
    clearTimeout(validationTimer.current)

    if (!value) {
      setIsValid(true)
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const filtered = filterSuggestions(value)
    setSuggestions(filtered)
    setIsOpen(filtered.length > 0)
    setHighlighted(0)

    if (isValidLocation(value)) {
      setIsValid(true)
    } else {
      // Delay the error so it doesn't flash while user is clicking a suggestion.
      validationTimer.current = setTimeout(() => {
        if (!isSelectingRef.current) setIsValid(false)
      }, 150)
    }
  }

  function handleSelect(location) {
    isSelectingRef.current = true
    clearTimeout(validationTimer.current)
    setIsValid(true)
    setIsOpen(false)
    setQuery('')
    setSuggestions([])
    onSelect(location)
  }

  function handleKeyDown(e) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[highlighted]) handleSelect(suggestions[highlighted])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Try New York, India, PST, GMT+4:30 etc."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c6ff] ${
            !isValid ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        {isOpen && (
          <ul className="absolute z-50 w-full bg-white border border-[#46d633] rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
            {suggestions.map((loc, i) => (
              <li
                key={loc}
                onMouseDown={() => handleSelect(loc)}
                className={`px-3 py-1.5 cursor-pointer text-sm ${
                  i === highlighted ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                {loc}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isValid && (
        <p className="text-sm text-red-500 mt-1 italic">
          Sorry, that time zone is not supported.
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={peripheralsEnabled}
            onChange={e => onTogglePeripherals(e.target.checked)}
            className="rounded"
          />
          <span>Include all locations</span>
        </label>
      </div>
    </div>
  )
}
