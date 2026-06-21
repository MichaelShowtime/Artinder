import { useState, useRef, useEffect } from 'react'
import { DANISH_CITIES } from '../data/cities'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function CityInput({ value, onChange, placeholder = 'Fx. København', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = value.length >= 1
    ? DANISH_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary ${className}`}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 overflow-hidden">
          {suggestions.map(city => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(city); setOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-gray-800"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
