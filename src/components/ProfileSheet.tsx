import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, ChevronDown } from 'lucide-react'

export type MoodImage = { id: string; url: string; order_index: number }
export type MoodPrompt = { question: string; answer: string }
export type SheetMood = {
  id: string
  name: string
  description: string | null
  tags: string[]
  prompts: MoodPrompt[] | null
  mood_images: MoodImage[]
}

type Props = {
  mood: SheetMood
  onClose: () => void
  onSwipe?: (liked: boolean) => void
  startIndex?: number
  readOnly?: boolean
}

export { AnimatePresence }

export default function ProfileSheet({ mood, onClose, onSwipe, startIndex = 0, readOnly = false }: Props) {
  const [imgIndex, setImgIndex] = useState(startIndex)
  const images = [...mood.mood_images].sort((a, b) => a.order_index - b.order_index)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: '94vh', overflow: 'hidden' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Close button — hangs at the very top of the sheet */}
        <div className="absolute top-0 left-0 right-0 flex justify-center z-20 -translate-y-1/2">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <ChevronDown size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Photo carousel */}
        <div className="relative flex-shrink-0 h-72">
          {images.length > 0 ? (
            <img
              src={images[imgIndex]?.url}
              className="w-full h-full object-cover object-top rounded-t-3xl"
              alt={mood.name}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 rounded-t-3xl flex items-center justify-center">
              <span className="text-white text-6xl font-bold">{mood.name[0]}</span>
            </div>
          )}

          {/* Progress dots */}
          {images.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 pointer-events-none">
              {images.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}

          {/* Tap zones */}
          <div className="absolute inset-0 flex rounded-t-3xl overflow-hidden">
            <div className="flex-1" onClick={() => setImgIndex(i => Math.max(0, i - 1))} />
            <div className="flex-1" onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))} />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-4 pb-4 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{mood.name}</h2>
              {mood.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mood.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {mood.description && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-800 leading-relaxed">{mood.description}</p>
              </div>
            )}

            {mood.prompts?.filter(p => p.answer).map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1.5">{p.question}</p>
                <p className="text-lg font-bold text-gray-900 leading-snug">{p.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {readOnly ? (
          <div className="flex-shrink-0 px-6 pb-8 pt-3 border-t border-gray-100 bg-white">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm"
            >
              Luk forhåndsvisning
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 px-6 pb-8 pt-3 flex gap-4 border-t border-gray-100 bg-white">
            <button
              onClick={() => { onSwipe?.(false); onClose() }}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-500 font-semibold text-sm"
            >
              <X size={20} /> Nej tak
            </button>
            <button
              onClick={() => { onSwipe?.(true); onClose() }}
              className="flex-1 py-3.5 rounded-2xl bg-primary flex items-center justify-center gap-2 text-white font-semibold text-sm"
            >
              <Heart size={20} fill="white" /> Synes godt om
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
