import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const ROWS_VISIBLE = 6

export const MOOD_CATEGORIES = [
  {
    name: 'Vibe',
    tags: ['Romantisk', 'Sjov', 'Mystisk', 'Chill', 'Intens', 'Vild', 'Seriøs', 'Legesyg', 'Afslappet', 'Drømmende', 'Mørk', 'Energisk', 'Kaotisk'],
  },
  {
    name: 'Personlighed',
    tags: ['Sporty', 'Kreativ', 'Eventyrlysten', 'Nørdet', 'Charmerende', 'Selvsikker', 'Genert', 'Diva', 'Gentleman', 'Rebel', 'Filosofisk', 'Sarkastisk'],
  },
  {
    name: 'Æstetik',
    tags: ['Clean', 'Streetwear', 'Vintage', 'Dark mode', 'Cottagecore', 'Y2K', 'Old money', 'Hypebeast', 'Minimalistisk', 'Retro', 'Edgy', 'Preppy'],
  },
  {
    name: 'Energi',
    tags: ['Morgenmenneske', 'Nattugle', 'Party mode', 'Træt', 'Hyper', 'Zen', 'Fokuseret', 'Flirty', 'Main character', 'Villain arc', 'NPC-energy'],
  },
  {
    name: 'Stemning',
    tags: ['Date night', 'Adventure', 'Netflix & chill', 'Deep talks', 'Road trip', 'Beach day', 'Gym bro', 'Hjemmehygge', 'Festival', 'Café vibes'],
  },
]

export const ALL_MOOD_TAGS = MOOD_CATEGORIES.flatMap(c => c.tags)

type Props = {
  value: string[]
  onChange: (v: string[]) => void
}

export default function MoodTagPicker({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else {
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

  return (
    <div className="space-y-5">
      {MOOD_CATEGORIES.map(cat => {
        const isExpanded = expanded.has(cat.name)
        const visible = isExpanded ? cat.tags : cat.tags.slice(0, ROWS_VISIBLE)
        const hiddenCount = cat.tags.length - ROWS_VISIBLE

        return (
          <div key={cat.name}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              {cat.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {visible.map(tag => {
                const selected = value.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
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
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => toggleExpand(cat.name)}
                className="mt-2 flex items-center gap-1 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
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
  )
}
