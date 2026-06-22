import { useState, useMemo } from 'react'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { INTEREST_CATEGORIES } from '../data/interests'

const MAX_VISIBLE = 10

type Props = {
  value: string[]
  onChange: (v: string[]) => void
  max?: number
}

export default function InterestPicker({ value, onChange, max = 10 }: Props) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else if (value.length < max) {
      onChange([...value, tag])
    }
  }

  const toggleExpand = (catName: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(catName)) next.delete(catName)
      else next.add(catName)
      return next
    })
  }

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return INTEREST_CATEGORIES
    const q = search.toLowerCase()
    return INTEREST_CATEGORIES
      .map(cat => ({ ...cat, tags: cat.tags.filter(t => t.toLowerCase().includes(q)) }))
      .filter(cat => cat.tags.length > 0)
  }, [search])

  return (
    <div className="flex flex-col gap-4">
      {/* Selected chips — horizontally scrollable */}
      {value.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {value.map(tag => (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white text-gray-900 border border-gray-300 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {tag}
              <X size={11} className="text-gray-500" />
            </button>
          ))}
        </div>
      )}

      {/* Counter + search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg interesser..."
            className="w-full border border-gray-200 rounded-full pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} className="text-gray-400" />
            </button>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-500 whitespace-nowrap tabular-nums">
          {value.length} / {max}
        </span>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {filteredCategories.map(cat => {
          const isExpanded = expanded.has(cat.name) || !!search.trim()
          const visibleTags = isExpanded ? cat.tags : cat.tags.slice(0, MAX_VISIBLE)
          const hiddenCount = cat.tags.length - MAX_VISIBLE

          return (
            <div key={cat.name}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                {cat.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleTags.map(tag => {
                  const selected = value.includes(tag)
                  const disabled = !selected && value.length >= max
                  return (
                    <button
                      key={tag}
                      onClick={() => toggle(tag)}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 disabled:opacity-30 ${
                        selected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-900 border-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>

              {!search.trim() && hiddenCount > 0 && (
                <button
                  onClick={() => toggleExpand(cat.name)}
                  className="mt-2.5 flex items-center gap-1 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
                >
                  {isExpanded ? (
                    <><ChevronUp size={13} /> Vis færre</>
                  ) : (
                    <><ChevronDown size={13} /> Vis {hiddenCount} mere</>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
