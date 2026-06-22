import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { Heart, X, RotateCcw, Undo2, ChevronUp, ChevronDown, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { SheetMood } from '../components/ProfileSheet'

type Mood = SheetMood
type HistoryItem = { mood: Mood; liked: boolean; swipeId: string; matchId?: string }

// --- Confetti ---
const COLORS = ['#FF4458','#FFD700','#00C851','#3F51B5','#FF6B35','#A855F7','#FF69B4','#00BCD4']
function Confetti() {
  const particles = useRef(
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2.5}s`,
      size: `${5 + Math.random() * 8}px`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: `${2.2 + Math.random() * 1.8}s`,
      round: Math.random() > 0.5,
    }))
  ).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

// --- Match screen ---
function MatchScreen({ mood, userImageUrl, onMessage, onContinue }: {
  mood: Mood
  userImageUrl: string | null
  matchId?: string
  onMessage: () => void
  onContinue: () => void
}) {
  const artinImg = [...mood.mood_images].sort((a, b) => a.order_index - b.order_index)[0]?.url

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a0010] via-[#3d0020] to-[#1a0010] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Confetti />

      {/* Curved "Det er et match!" */}
      <div className="relative w-full px-2 mb-1 z-10">
        <svg viewBox="0 0 360 88" className="w-full">
          <defs>
            <path id="textArc" d="M 28,78 Q 180,4 332,78" />
          </defs>
          <text
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontSize="27"
            fontWeight="900"
            fill="white"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="5"
            paintOrder="stroke"
          >
            <textPath href="#textArc" textAnchor="middle" startOffset="50%">
              Det er et match! 💕
            </textPath>
          </text>
        </svg>
      </div>

      {/* Two images sliding in */}
      <div className="flex gap-3 px-6 mb-6 z-10 w-full">
        <motion.div
          className="flex-1 aspect-square rounded-2xl overflow-hidden border-[3px] border-white shadow-2xl"
          initial={{ x: -220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        >
          {userImageUrl ? (
            <img src={userImageUrl} className="w-full h-full object-cover object-top" alt="Dig" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <span className="text-white text-5xl">👤</span>
            </div>
          )}
        </motion.div>

        <motion.div
          className="flex-1 aspect-square rounded-2xl overflow-hidden border-[3px] border-white shadow-2xl"
          initial={{ x: 220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        >
          {artinImg ? (
            <img src={artinImg} className="w-full h-full object-cover object-top" alt={mood.name} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
              <span className="text-white text-5xl font-bold">{mood.name[0]}</span>
            </div>
          )}
        </motion.div>
      </div>

      <motion.p
        className="text-white/65 text-sm mb-8 z-10 text-center px-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        Du og <span className="text-white font-semibold">{mood.name}</span> passer perfekt sammen
      </motion.p>

      <motion.div
        className="flex flex-col gap-3 w-full px-6 z-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <button
          onClick={onMessage}
          className="w-full py-4 bg-white rounded-2xl font-bold text-gray-900 flex items-center justify-center gap-2 shadow-lg text-sm active:scale-95 transition-transform"
        >
          <MessageCircle size={20} /> Skriv til Artin
        </button>
        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-white/10 border border-white/25 rounded-2xl text-white font-semibold text-sm active:scale-95 transition-transform"
        >
          Fortsæt med at swipe
        </button>
      </motion.div>
    </motion.div>
  )
}

// --- Swipe card ---
function MoodCard({ mood, onSwipe }: { mood: Mood; onSwipe: (liked: boolean) => void }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const x = useMotionValue(0)
  const rotate   = useTransform(x, [-260, 260], [-18, 18])
  const opacity  = useTransform(x, [-260, -180, 0, 180, 260], [0, 1, 1, 1, 0])
  const likeOp   = useTransform(x, [0, 110],  [0, 0.42])
  const nopeOp   = useTransform(x, [-110, 0], [0.42, 0])
  const likeStamp = useTransform(x, [18, 85],  [0, 1])
  const nopeStamp = useTransform(x, [-85, -18],[1, 0])

  const images = [...mood.mood_images].sort((a, b) => a.order_index - b.order_index)
  const draggedRef = useRef(false)
  const swipingRef = useRef(false)

  const handleDragStart = () => { draggedRef.current = false }
  const handleDrag = (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (Math.abs(info.offset.x) > 12 || Math.abs(info.offset.y) > 12) draggedRef.current = true
  }

  const handleDragEnd = async (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (swipingRef.current) return
    const shouldLike = info.offset.x > 75 || info.velocity.x > 480
    const shouldNope = info.offset.x < -75 || info.velocity.x < -480

    if (shouldLike) {
      swipingRef.current = true
      await animate(x, 680, { duration: 0.28, ease: 'easeOut' })
      onSwipe(true)
    } else if (shouldNope) {
      swipingRef.current = true
      await animate(x, -680, { duration: 0.28, ease: 'easeOut' })
      onSwipe(false)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 38 })
    }
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedRef.current || expanded) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX < rect.left + rect.width / 2) {
      setImgIndex(i => Math.max(0, i - 1))
    } else {
      setImgIndex(i => Math.min(images.length - 1, i + 1))
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity, cursor: expanded ? 'default' : 'grab' }}
      drag={expanded ? false : 'x'}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className="absolute inset-0 select-none active:cursor-grabbing"
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden card-shadow bg-black">

        {/* Background image */}
        {images.length > 0 ? (
          <img src={images[imgIndex]?.url} className="w-full h-full object-contain" draggable={false} alt={mood.name} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">{mood.name[0]}</span>
          </div>
        )}

        {/* Like / Nope color overlays */}
        <motion.div className="absolute inset-0 bg-green-400 pointer-events-none" style={{ opacity: likeOp }} />
        <motion.div className="absolute inset-0 bg-red-500 pointer-events-none"  style={{ opacity: nopeOp }} />

        {/* Dim when panel open */}
        <motion.div
          className="absolute inset-0 bg-black/50 pointer-events-none"
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.22 }}
        />

        {/* Stamps */}
        <motion.div style={{ opacity: likeStamp }} className="absolute top-10 left-6 rotate-[-20deg] border-4 border-green-400 rounded-lg px-3 py-1 pointer-events-none">
          <span className="text-green-400 font-black text-2xl">LIKE</span>
        </motion.div>
        <motion.div style={{ opacity: nopeStamp }} className="absolute top-10 right-6 rotate-[20deg] border-4 border-red-400 rounded-lg px-3 py-1 pointer-events-none">
          <span className="text-red-400 font-black text-2xl">NOPE</span>
        </motion.div>

        {/* Progress bar */}
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 px-3 pointer-events-none">
            {images.map((_, i) => (
              <div key={i} className={`flex-1 h-0.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Compact bottom overlay */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent"
          animate={{ opacity: expanded ? 0 : 1 }}
          transition={{ duration: 0.18 }}
          style={{ pointerEvents: expanded ? 'none' : 'auto' }}
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-base font-bold leading-tight">{mood.name}</h2>
              {mood.description && <p className="text-white/75 text-[11px] mt-0.5 line-clamp-1">{mood.description}</p>}
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
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-0.5 active:scale-90 transition-transform"
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
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{mood.name}</h2>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(false) }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronDown size={18} className="text-gray-600" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            {images.length > 0 && (
              <div className="relative h-52 flex-shrink-0">
                <img src={images[imgIndex]?.url} className="w-full h-full object-cover object-top" alt={mood.name} draggable={false} />
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
  const navigate = useNavigate()
  const [moods, setMoods] = useState<Mood[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [matchedMood, setMatchedMood] = useState<Mood | null>(null)
  const [matchId, setMatchId] = useState<string | undefined>()
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profile_images').select('url').eq('user_id', user.id).order('order_index').limit(1).single()
      .then(({ data }) => { if (data) setUserImageUrl(data.url) })
  }, [user])

  const loadMoods = async (userId: string, includeNoSwipes = false) => {
    let excludeIds: string[] = []
    if (includeNoSwipes) {
      await supabase.from('swipes').delete().eq('user_id', userId).eq('liked', false)
      const { data } = await supabase.from('swipes').select('mood_id').eq('user_id', userId).eq('liked', true)
      excludeIds = (data || []).map(s => s.mood_id)
    } else {
      const { data } = await supabase.from('swipes').select('mood_id').eq('user_id', userId)
      excludeIds = (data || []).map(s => s.mood_id)
    }
    let query = supabase.from('moods').select('id, name, description, tags, prompts, mood_images(id, url, order_index)').order('created_at')
    if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    const { data } = await query
    return (data as Mood[]) || []
  }

  useEffect(() => {
    if (!user) return
    loadMoods(user.id).then(data => { setMoods(data); setLoading(false) })
  }, [user])

  const handleSwipe = async (liked: boolean) => {
    if (processingRef.current || !user) return
    const mood = moods[currentIndex]
    if (!mood) return
    processingRef.current = true

    const { data: swipeData } = await supabase.from('swipes').insert({ user_id: user.id, mood_id: mood.id, liked }).select().single()

    let createdMatchId: string | undefined
    if (liked) {
      const { data: matchData } = await supabase.from('matches').insert({ user_id: user.id, mood_id: mood.id }).select().single()
      createdMatchId = matchData?.id
      setMatchId(createdMatchId)
      setMatchedMood(mood)
    } else {
      setCurrentIndex(i => i + 1)
      processingRef.current = false
    }
    setHistory(prev => [...prev, { mood, liked, swipeId: swipeData?.id ?? '', matchId: createdMatchId }])
  }

  const dismissMatch = (goToMessages: boolean) => {
    if (goToMessages && matchId) navigate(`/messages/${matchId}`)
    setMatchedMood(null)
    setMatchId(undefined)
    setCurrentIndex(i => i + 1)
    processingRef.current = false
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

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const remaining = moods.slice(currentIndex)

  if (remaining.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Heart size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">Ingen flere personaer</h3>
      <p className="text-gray-500 text-sm mt-2">Du har set alle Artins personaer.</p>
      <button onClick={handleReset} className="mt-6 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold active:scale-95 transition-transform">
        <RotateCcw size={16} /> Se dem igen
      </button>
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-x-hidden relative" style={{ padding: '6px 8px 8px' }}>

      <AnimatePresence>
        {matchedMood && (
          <MatchScreen
            mood={matchedMood}
            userImageUrl={userImageUrl}
            matchId={matchId}
            onMessage={() => dismissMatch(true)}
            onContinue={() => dismissMatch(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative flex-1 mb-2">
        {remaining.slice(0, 3).reverse().map((mood, i) => {
          const total = Math.min(remaining.length, 3)
          const isTop = i === total - 1
          return isTop ? (
            <MoodCard key={mood.id} mood={mood} onSwipe={handleSwipe} />
          ) : (
            <div
              key={mood.id}
              className="absolute inset-0 rounded-2xl bg-gray-200 card-shadow"
              style={{ transform: `scale(${0.95 - (total - 1 - i) * 0.03}) translateY(${(total - 1 - i) * 10}px)` }}
            />
          )
        })}
      </div>

      <div className="flex justify-center items-center gap-3 py-1">
        <button onClick={handleUndo} disabled={history.length === 0}
          className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 disabled:opacity-30 active:scale-90 transition-transform">
          <Undo2 size={18} className="text-yellow-500" />
        </button>
        <button onClick={() => handleSwipe(false)}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 active:scale-90 transition-transform">
          <X size={26} className="text-gray-400" />
        </button>
        <button onClick={() => handleSwipe(true)}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 active:scale-90 transition-transform">
          <Heart size={26} className="text-primary" fill="#FF4458" />
        </button>
        <button onClick={handleReset}
          className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 active:scale-90 transition-transform">
          <RotateCcw size={18} className="text-blue-400" />
        </button>
      </div>
    </div>
  )
}
