import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MessageCircle } from 'lucide-react'

type MatchItem = {
  id: string
  mood: { id: string; name: string; mood_images: { url: string }[] }
  user?: { id: string; name: string; profile_images: { url: string }[] }
}

export default function MessagesPage() {
  const { user, isArtin } = useAuth()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const loadUnread = async (matchList: MatchItem[]) => {
    if (!user || matchList.length === 0) return
    const ids = matchList.map(m => m.id)

    const { data: reads } = await supabase
      .from('match_reads')
      .select('match_id, last_read_at')
      .eq('user_id', user.id)
      .in('match_id', ids)

    const readMap: Record<string, string> = {}
    for (const r of reads || []) readMap[r.match_id] = r.last_read_at

    const counts = await Promise.all(
      ids.map(async id => {
        const lastRead = readMap[id] || '1970-01-01T00:00:00Z'
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('match_id', id)
          .neq('sender_id', user.id)
          .gt('created_at', lastRead)
        return { id, count: count || 0 }
      })
    )

    const map: Record<string, number> = {}
    for (const { id, count } of counts) map[id] = count
    setUnreadMap(map)
  }

  useEffect(() => {
    if (!user) return

    const load = async () => {
      let matchList: MatchItem[] = []
      if (isArtin) {
        const { data } = await supabase
          .from('matches')
          .select('id, mood:moods(id, name, mood_images(url)), user:profiles!matches_user_id_fkey(id, name, profile_images(url))')
          .order('created_at', { ascending: false })
        matchList = (data as unknown as MatchItem[]) || []
      } else {
        const { data } = await supabase
          .from('matches')
          .select('id, mood:moods(id, name, mood_images(url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        matchList = (data as unknown as MatchItem[]) || []
      }
      setMatches(matchList)
      setLoading(false)
      await loadUnread(matchList)
    }

    load()

    const msgSub = supabase
      .channel('msglist-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        setMatches(prev => { loadUnread(prev); return prev })
      })
      .subscribe()

    const readSub = supabase
      .channel('msglist-reads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_reads' }, () => {
        setMatches(prev => { loadUnread(prev); return prev })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgSub)
      supabase.removeChannel(readSub)
    }
  }, [user, isArtin])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <MessageCircle size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Ingen beskeder endnu</h3>
        <p className="text-sm text-gray-500 mt-1">Swipe ja på Artin for at starte en samtale</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-gray-50">
        {matches.map(match => {
          const moodImages = match.mood?.mood_images || []
          const userImages = match.user?.profile_images || []
          const avatarUrl = isArtin ? (userImages[0]?.url || null) : (moodImages[0]?.url || null)
          const title = isArtin ? `${match.user?.name} → ${match.mood?.name}` : match.mood?.name
          const unread = unreadMap[match.id] || 0

          return (
            <Link to={`/messages/${match.id}`} key={match.id} className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" alt={title} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{title?.[0]}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{title}</p>
                {isArtin && (
                  <p className="text-xs text-primary mt-0.5">Swipede på: {match.mood?.name}</p>
                )}
              </div>
              {unread > 0 && (
                <span className="min-w-[22px] h-[22px] bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
