import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Heart, X, RotateCcw, Undo2, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { SheetMood } from '../components/ProfileSheet'

type Mood = SheetMood
type HistoryItem = {
  mood: Mood
  liked: boolean
  swipeId: string
  matchId?: string
}

// --- Swipe card ---
function MoodCard({ mood, onSwipe }: {
  mood: Mood
  onSwipe: (liked: boolean) => void
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedRef.current || expanded) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = e.clientX < rect.left + rect.width / 2
    if (isLeft) {
      setImgIndex(i => Math.max(0, i - 1))
    } else {
      setImgIndex(i => Math.min(images.length - 1, i + 1))
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity, cursor: expanded ? 'default' : 'grab' }}
      drag={expanded ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className="absolute inset-0 select-none"
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden card-shadow bg-black">

        {/* Background image */}
        {images.length > 0 ? (
          <img
            src={images[imgIndex]?.url}
            className="w-full h-full object-contain"
            draggable={false}
            alt={mood.name}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">{mood.name[0]}</span>
          </div>
        )}

        {/* Dim overlay when info panel is open */}
        <motion.div
          className="absolute inset-0 bg-black/50 pointer-events-none"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />

        {/* LIKE / NOPE stamps */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-6 rotate-[-20deg] border-4 border-green-400 rounded-lg px-3 py-1 pointer-events-none">
          <span className="text-green-400 font-black text-2xl">LIKE</span>
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-6 rotate-[20deg] border-4 border-red-400 rounded-lg px-3 py-1 pointer-events-none">
          <span className="text-red-400 font-black text-2xl">NOPE</span>
        </motion.div>

        {/* Image progress bar */}
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 px-3 pointer-events-none">
            {images.map((_, i) => (
              <div key={i} className={`flex-1 h-0.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Compact bottom overlay — hides when panel opens */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-3 pt-8 pb-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent"
          animate={{ opacity: expanded ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          style={{ pointerEvents: expanded ? 'none' : 'auto' }}
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-base font-bold leading-tight">{mood.name}</h2>
              {mood.description && (
                <p className="text-white/75 text-[11px] mt-0.5 line-clamp-1">{mood.description}</p>
              )}
              {mood.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {mood.tags.slice(0, 5).map(tag => (
                    <span key={tag} className="text-white text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(true) }}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-0.5"
            >
              <ChevronUp size={20} className="text-white" />
            </button>
          </div>
        </motion.div>

        {/* Info panel — glides up from bottom of card */}
        <motion.div
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl flex flex-col"
          style={{ maxHeight: '84%' }}
          initial={false}
          animate={{ y: expanded ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{mood.name}</h2>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(false) }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ChevronDown size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            {/* Photo carousel inside panel */}
            {images.length > 0 && (
              <div className="relative h-48 flex-shrink-0">
                <img
                  src={images[imgIndex]?.url}
                  className="w-full h-full object-cover object-top"
                  alt={mood.name}
                  draggable={false}
                />
                {images.length > 1 && (
                  <div className="absolute top-2 left-0 right-0 flex gap-1 px-4 pointer-events-none">
                    {images.map((_, i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                )}
                <div className="absolute inset-0 flex">
                  <div className="flex-1" onClick={e => { e.stopPropagation(); setImgIndex(i => Math.max(0, i - 1)) }} />
                  <div className="flex-1" onClick={e => { e.stopPropagation(); setImgIndex(i => Math.min(images.length - 1, i + 1)) }} />
                </div>
              </div>
            )}

            <div className="px-4 pb-4 pt-3 space-y-3">
              {mood.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {mood.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
              )}
              {mood.description && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed">{mood.description}</p>
                </div>
              )}
              {mood.prompts?.filter(p => p.answer).map((p, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1.5">{p.question}</p>
                  <p className="text-base font-bold text-gray-900 leading-snug">{p.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

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
    <div className="h-full flex flex-col overflow-x-hidden" style={{ padding: '6px 8px 8px' }}>
      {matched && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-500 to-red-500">
          <div className="text-center text-white">
            <Heart size={64} fill="white" className="mx-auto mb-4" />
            <h2 className="text-3xl font-black">Det er et match!</h2>
            <p className="mt-2 opacity-80">Du og Artin er forbundet</p>
          </div>
        </div>
      )}

      <div className="relative flex-1 mb-2">
        {remaining.slice(0, 3).reverse().map((mood, i) => {
          const total = Math.min(remaining.length, 3)
          const isTop = i === total - 1
          return isTop ? (
            <MoodCard
              key={mood.id}
              mood={mood}
              onSwipe={handleSwipe}
            />
          ) : (
            <div key={mood.id} className="absolute inset-0 rounded-2xl bg-gray-200 card-shadow"
              style={{ transform: `scale(${0.95 - (total - 1 - i) * 0.03}) translateY(${(total - 1 - i) * 10}px)` }} />
          )
        })}
      </div>

      <div className="flex justify-center items-center gap-3 py-1">
        <button onClick={handleUndo} disabled={history.length === 0}
          className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 disabled:opacity-30">
          <Undo2 size={18} className="text-yellow-500" />
        </button>
        <button onClick={() => handleSwipe(false)}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
          <X size={26} className="text-gray-400" />
        </button>
        <button onClick={() => handleSwipe(true)}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
          <Heart size={26} className="text-primary" fill="#FF4458" />
        </button>
        <button onClick={handleReset}
          className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
          <RotateCcw size={18} className="text-blue-400" />
        </button>
      </div>
    </div>
  )
}
