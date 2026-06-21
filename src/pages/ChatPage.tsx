import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Send, UserCircle } from 'lucide-react'

type Message = {
  id: string
  sender_id: string
  content: string
  is_nej: boolean
  created_at: string
}

type Reaction = { message_id: string; user_id: string; emoji: string }

type MatchInfo = {
  id: string
  user_id: string
  mood: { name: string }
  user: { id: string; name: string; profile_images: { url: string }[] }
}

const EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

function formatReadTime(iso: string) {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return `Læst ${formatTime(iso)}`
  return `Læst ${d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} kl. ${formatTime(iso)}`
}

export default function ChatPage() {
  const { matchId } = useParams()
  const { user, isArtin } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [tappedId, setTappedId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userLastRead, setUserLastRead] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark match as read when opening
  useEffect(() => {
    if (!matchId || !user) return
    supabase.from('match_reads').upsert(
      { match_id: matchId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: 'match_id,user_id' }
    )
  }, [matchId, user])

  useEffect(() => {
    if (!matchId) return

    const loadMatch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, user_id, mood:moods(name), user:profiles!matches_user_id_fkey(id, name, profile_images(url))')
        .eq('id', matchId)
        .single()
      setMatch(data as unknown as MatchInfo)
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at')
      setMessages(data || [])
    }

    const loadReactions = async () => {
      const { data } = await supabase
        .from('message_reactions')
        .select('message_id, user_id, emoji')
      setReactions(data || [])
    }

    const loadUserLastRead = async () => {
      if (!isArtin) return
      const { data: matchData } = await supabase
        .from('matches')
        .select('user_id')
        .eq('id', matchId)
        .single()
      if (!matchData) return
      const { data } = await supabase
        .from('match_reads')
        .select('last_read_at')
        .eq('match_id', matchId)
        .eq('user_id', matchData.user_id)
        .single()
      setUserLastRead(data?.last_read_at || null)
    }

    loadMatch()
    loadMessages()
    loadReactions()
    loadUserLastRead()

    const msgSub = supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, payload => {
        setMessages(prev => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()

    const reactionSub = supabase
      .channel(`reactions:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => {
        loadReactions()
      })
      .subscribe()

    const readSub = isArtin
      ? supabase
          .channel(`reads:${matchId}`)
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'match_reads',
            filter: `match_id=eq.${matchId}`,
          }, () => loadUserLastRead())
          .subscribe()
      : null

    return () => {
      supabase.removeChannel(msgSub)
      supabase.removeChannel(reactionSub)
      if (readSub) supabase.removeChannel(readSub)
    }
  }, [matchId, isArtin])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || !user || !matchId || sending) return
    setSending(true)
    const content = text.trim()
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: user.id,
      content,
      is_nej: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')

    const { data } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: user.id, content })
      .select()
      .single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data as Message : m))
    }
    setSending(false)
  }

  const sendNej = async () => {
    if (!user || !matchId || sending) return
    setSending(true)
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: user.id,
      content: 'NEJ',
      is_nej: true,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    const { data } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: user.id, content: 'NEJ', is_nej: true })
      .select()
      .single()
    if (data) setMessages(prev => prev.map(m => m.id === optimistic.id ? data as Message : m))
    setSending(false)
  }

  const toggleTapped = (id: string) =>
    setTappedId(prev => prev === id ? null : id)

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    await supabase.from('message_reactions').upsert(
      { message_id: messageId, user_id: user.id, emoji },
      { onConflict: 'message_id,user_id' }
    )
    setTappedId(null)
  }

  const getReactions = (messageId: string) =>
    reactions.filter(r => r.message_id === messageId)

  // Last message Artin sent — show "read" below it if user has read after
  const artinIdxs = isArtin
    ? messages.map((m, i) => (m.sender_id === user?.id ? i : -1)).filter(i => i >= 0)
    : []
  const lastArtinMsgIdx = artinIdxs.length > 0 ? artinIdxs[artinIdxs.length - 1] : -1

  const otherName = isArtin ? match?.user?.name : 'Artin'
  const subtitle = isArtin ? `Swipede på: ${match?.mood?.name}` : match?.mood?.name

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        {isArtin && match?.user?.id ? (
          <Link to={`/artin/user/${match.user.id}`} className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {match.user.profile_images?.[0]?.url
                ? <img src={match.user.profile_images[0].url} className="w-full h-full object-cover" alt={match.user.name} />
                : <UserCircle size={40} className="text-gray-400" />}
            </div>
            <div>
              <p className="font-semibold text-sm">{otherName}</p>
              <p className="text-xs text-primary">{subtitle}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{otherName}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        )}
        {isArtin && (
          <button onClick={sendNej} className="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-full">
            Nej
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" onClick={() => setTappedId(null)}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id
          const msgReactions = getReactions(msg.id)
          const showRead =
            isArtin &&
            idx === lastArtinMsgIdx &&
            userLastRead != null &&
            new Date(userLastRead) > new Date(msg.created_at)

          return (
            <div key={msg.id}>
              {msg.is_nej ? (
                <div className="w-full text-center py-4">
                  <span className="text-6xl font-black text-red-600 tracking-widest block animate-bounce">NEJ</span>
                </div>
              ) : (
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleTapped(msg.id) }}
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm text-left leading-relaxed ${
                      isMe
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </button>

                  {msgReactions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 px-1">
                      {msgReactions.map((r, i) => (
                        <span key={i} className="text-base leading-none">{r.emoji}</span>
                      ))}
                    </div>
                  )}

                  {tappedId === msg.id && (
                    <div
                      className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(msg.created_at)}</span>
                      <div className="flex gap-1 bg-white border border-gray-100 rounded-full px-2 py-1.5 shadow-lg">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="text-xl hover:scale-125 transition-transform active:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showRead && (
                <p className="text-right text-xs text-gray-400 pr-1 -mt-0.5 mb-1">
                  {formatReadTime(userLastRead!)}
                </p>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          placeholder="Skriv en besked..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center disabled:opacity-40"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}
