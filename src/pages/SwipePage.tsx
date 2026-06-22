import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { Heart, X, ChevronLeft, ChevronRight, RotateCcw, Undo2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type MoodImage = { id: string; url: string; order_index: number }
type MoodPrompt = { question: string; answer: string }
type Mood = {
  id: string
  name: string
  description: string | null
  tags: string[]
  prompts: MoodPrompt[] | null
  mood_images: MoodImage[]
}
type HistoryItem = {
  mood: Mood
  liked: boolean
  swipeId: string
  matchId?: string
}

// --- Profile sheet shown when tapping the card ---
function ProfileSheet({ mood, onClose, onSwipe }: {
  mood: Mood
  onClose: () => void
  onSwipe: (liked: boolean) => void
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = [...mood.mood_images].sort((a, b) => a.order_index - b.order_index)

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
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
        style={{ maxHeight: '92vh', overflow: 'hidden' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Photo */}
        <div className="relative flex-shrink-0" style={{ height: '70vw', maxHeight: 380 }}>
          {images.length > 0 ? (
            <img src={images[imgIndex]?.url} className="w-full h-full object-cover object-top" alt={mood.name} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
              <span className="text-white text-6xl font-bold">{mood.name[0]}</span>
            </div>
          )}

          {/* Image progress dots */}
          {images.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex gap-1 px-4">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`flex-1 h-1 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}

          {/* Prev/next */}
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                <ChevronLeft size={22} className="text-white drop-shadow" />
              </button>
              <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                <ChevronRight size={22} className="text-white drop-shadow" />
              </button>
            </>
          )}

          </div>

        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-4 space-y-4">
            {/* Name + tags */}
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

            {/* Description */}
            {mood.description && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-800 leading-relaxed">{mood.description}</p>
              </div>
            )}

            {/* Prompts */}
            {mood.prompts?.filter(p => p.answer).map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1.5">{p.question}</p>
                <p className="text-lg font-bold text-gray-900 leading-snug">{p.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Like / Dislike buttons */}
        <div className="flex-shrink-0 px-6 pb-8 pt-3 flex gap-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => { onSwipe(false); onClose() }}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-500 font-semibold text-sm"
          >
            <X size={20} /> Nej tak
          </button>
          <button
            onClick={() => { onSwipe(true); onClose() }}
            className="flex-1 py-3.5 rounded-2xl bg-primary flex items-center justify-center gap-2 text-white font-semibold text-sm"
          >
            <Heart size={20} fill="white" /> Synes godt om
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Swipe card ---
function MoodCard({ mood, onSwipe, onTap }: {
  mood: Mood
  onSwipe: (liked: boolean) => void
  onTap: () => void
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])
  const draggedRef = useRef(false)

  const images = [...mood.mood_images].sort((a, b) => a.order_index - b.order_index)

  const handleDragStart = () => { draggedRef.current = false }
  const handleDrag = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8) draggedRef.current = true
  }
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) onSwipe(true)
    else if (info.offset.x < -120) onSwipe(false)
  }
  const handleClick = () => { if (!draggedRef.current) onTap() }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden card-shadow bg-gray-200">
        {images.length > 0 ? (
          <img src={images[imgIndex]?.url} className="w-full h-full object-cover object-top" draggable={false} alt={mood.name} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">{mood.name[0]}</span>
          </div>
        )}

        <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-6 rotate-[-20deg] border-4 border-green-400 rounded-lg px-3 py-1">
          <span className="text-green-400 font-black text-2xl">LIKE</span>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-6 rotate-[20deg] border-4 border-red-400 rounded-lg px-3 py-1">
          <span className="text-red-400 font-black text-2xl">NOPE</span>
        </motion.div>

        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 px-3">
            {images.map((_, i) => (
              <div key={i} className={`flex-1 h-0.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setImgIndex(i => Math.max(0, i - 1)) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
              <ChevronLeft size={20} className="text-white drop-shadow" />
            </button>
            <button onClick={e => { e.stopPropagation(); setImgIndex(i => Math.min(images.length - 1, i + 1)) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
              <ChevronRight size={20} className="text-white drop-shadow" />
            </button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
          <h2 className="text-white text-xl font-bold">{mood.name}</h2>
          {mood.description && <p className="text-white/80 text-sm mt-1 line-clamp-2">{mood.description}</p>}
          {mood.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {mood.tags.map(tag => (
                <span key={tag} className="text-white text-xs bg-white/25 backdrop-blur-sm px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          {/* Tap hint */}
          <p className="text-white/50 text-xs mt-2">Tryk for at se profil</p>
        </div>
      </div>
    </motion.div>
  )
}

// --- Main page ---
export default function SwipePage() {
  const { user } = useAuth()
  const [moods, setMoods] = useState<Mood[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [matched, setMatched] = useState(false)
  const [viewingMood, setViewingMood] = useState<Mood | null>(null)
  const processingRef = useRef(false)

  const loadMoods = async (userId: string, includeNoSwipes = false) => {
    let likedIds: string[] = []
    if (includeNoSwipes) {
      await supabase.from('swipes').delete().eq('user_id', userId).eq('liked', false)
      const { data: liked } = await supabase.from('swipes').select('mood_id').eq('user_id', userId).eq('liked', true)
      likedIds = (liked || []).map(s => s.mood_id)
    } else {
      const { data: swiped } = await supabase.from('swipes').select('mood_id').eq('user_id', userId)
      likedIds = (swiped || []).map(s => s.mood_id)
    }

    let query = supabase
      .from('moods')
      .select('id, name, description, tags, prompts, mood_images(id, url, order_index)')
      .order('created_at')
    if (likedIds.length > 0) {
      query = query.not('id', 'in', `(${likedIds.join(',')})`)
    }
    const { data } = await query
    return (data as Mood[]) || []
  }

  useEffect(() => {
    if (!user) return
    loadMoods(user.id).then(data => {
      setMoods(data)
      setLoading(false)
    })
  }, [user])

  const handleSwipe = async (liked: boolean) => {
    if (processingRef.current || !user) return
    const mood = moods[currentIndex]
    if (!mood) return
    processingRef.current = true

    const { data: swipeData } = await supabase
      .from('swipes')
      .insert({ user_id: user.id, mood_id: mood.id, liked })
      .select()
      .single()

    let matchId: string | undefined
    if (liked) {
      const { data: matchData } = await supabase
        .from('matches')
        .insert({ user_id: user.id, mood_id: mood.id })
        .select()
        .single()
      matchId = matchData?.id
    }

    setHistory(prev => [...prev, { mood, liked, swipeId: swipeData?.id ?? '', matchId }])

    if (liked) {
      setMatched(true)
      setTimeout(() => {
        setMatched(false)
        setCurrentIndex(i => i + 1)
        processingRef.current = false
      }, 1500)
    } else {
      setCurrentIndex(i => i + 1)
      processingRef.current = false
    }
  }

  const handleUndo = async () => {
    if (processingRef.current || history.length === 0) return
    processingRef.current = true
    const last = history[history.length - 1]
    if (last.swipeId) await supabase.from('swipes').delete().eq('id', last.swipeId)
    if (last.matchId) await supabase.from('matches').delete().eq('id', last.matchId)
    setHistory(prev => prev.slice(0, -1))
    setCurrentIndex(i => i - 1)
    processingRef.current = false
  }

  const handleReset = async () => {
    if (!user) return
    setLoading(true)
    setHistory([])
    const data = await loadMoods(user.id, true)
    setMoods(data)
    setCurrentIndex(0)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const remaining = moods.slice(currentIndex)

  if (remaining.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Heart size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Ingen flere personaer</h3>
        <p className="text-gray-500 text-sm mt-2">Du har set alle Artins personaer.</p>
        <button onClick={handleReset}
          className="mt-6 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold">
          <RotateCcw size={16} /> Se dem igen
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      {matched && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-500 to-red-500">
          <div className="text-center text-white">
            <Heart size={64} fill="white" className="mx-auto mb-4" />
            <h2 className="text-3xl font-black">Det er et match!</h2>
            <p className="mt-2 opacity-80">Du og Artin er forbundet</p>
          </div>
        </div>
      )}

      <div className="relative flex-1 mb-4">
        {remaining.slice(0, 3).reverse().map((mood, i) => {
          const total = Math.min(remaining.length, 3)
          const isTop = i === total - 1
          return isTop ? (
            <MoodCard
              key={mood.id}
              mood={mood}
              onSwipe={handleSwipe}
              onTap={() => setViewingMood(mood)}
            />
          ) : (
            <div key={mood.id} className="absolute inset-0 rounded-2xl bg-gray-200 card-shadow"
              style={{ transform: `scale(${0.95 - (total - 1 - i) * 0.03}) translateY(${(total - 1 - i) * 10}px)` }} />
          )
        })}
      </div>

      <div className="flex justify-center items-center gap-4 pb-2">
        <button onClick={handleUndo} disabled={history.length === 0}
          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 disabled:opacity-30">
          <Undo2 size={20} className="text-yellow-500" />
        </button>
        <button onClick={() => handleSwipe(false)}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
          <X size={28} className="text-gray-400" />
        </button>
        <button onClick={() => handleSwipe(true)}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
          <Heart size={28} className="text-primary" fill="#FF4458" />
        </button>
        <button onClick={handleReset}
          className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
          <RotateCcw size={20} className="text-blue-400" />
        </button>
      </div>

      <AnimatePresence>
        {viewingMood && (
          <ProfileSheet
            mood={viewingMood}
            onClose={() => setViewingMood(null)}
            onSwipe={handleSwipe}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
