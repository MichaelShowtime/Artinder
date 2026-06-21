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

type MatchInfo = {
  id: string
  user_id: string
  mood: { name: string }
  user: { id: string; name: string; profile_images: { url: string }[] }
}

export default function ChatPage() {
  const { matchId } = useParams()
  const { user, isArtin } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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

    loadMatch()
    loadMessages()

    const sub = supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || !user || !matchId || sending) return
    setSending(true)
    await supabase.from('messages').insert({ match_id: matchId, sender_id: user.id, content: text.trim() })
    setText('')
    setSending(false)
  }

  const sendNej = async () => {
    if (!user || !matchId || sending) return
    setSending(true)
    await supabase.from('messages').insert({ match_id: matchId, sender_id: user.id, content: 'NEJ', is_nej: true })
    setSending(false)
  }

  const otherName = isArtin ? match?.user?.name : 'Artin'
  const subtitle = isArtin ? `Swipede på: ${match?.mood?.name}` : match?.mood?.name

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        {isArtin && match?.user?.id ? (
          <Link to={`/artin/user/${match.user.id}`} className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {match.user.profile_images?.[0]?.url ? (
                <img src={match.user.profile_images[0].url} className="w-full h-full object-cover" alt={match.user.name} />
              ) : (
                <UserCircle size={40} className="text-gray-400" />
              )}
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
          <button
            onClick={sendNej}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-full"
          >
            Nej
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {msg.is_nej ? (
                <div className="w-full text-center py-4">
                  <span className="text-6xl font-black text-red-600 tracking-widest block animate-bounce">NEJ</span>
                </div>
              ) : (
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
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
