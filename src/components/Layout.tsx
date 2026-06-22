import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Heart, MessageCircle, User, Plus, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function useUnreadCount() {
  const { user, isArtin } = useAuth()
  const [count, setCount] = useState(0)
  const location = useLocation()

  const load = async () => {
    if (!user) return

    // Get all matches for this user
    let matchQuery = supabase.from('matches').select('id, user_id')
    if (!isArtin) matchQuery = matchQuery.eq('user_id', user.id)
    const { data: matches } = await matchQuery
    if (!matches || matches.length === 0) { setCount(0); return }

    const matchIds = matches.map(m => m.id)

    // Get last_read per match for current user
    const { data: reads } = await supabase
      .from('match_reads')
      .select('match_id, last_read_at')
      .eq('user_id', user.id)
      .in('match_id', matchIds)

    const readMap: Record<string, string> = {}
    for (const r of reads || []) readMap[r.match_id] = r.last_read_at

    // Count matches that have messages newer than last_read, sent by someone else
    let unread = 0
    for (const match of matches) {
      const lastRead = readMap[match.id] || '1970-01-01T00:00:00Z'
      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', match.id)
        .neq('sender_id', user.id)
        .gt('created_at', lastRead)
      unread += c || 0
    }
    setCount(unread)
  }

  // Reset when visiting messages
  useEffect(() => {
    if (location.pathname === '/messages') {
      // Will reload on next message
    }
    load()
  }, [location.pathname, user])

  // Subscribe to new messages + reads globally
  useEffect(() => {
    if (!user) return
    const msgSub = supabase
      .channel('global-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe()
    const readSub = supabase
      .channel('global-reads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_reads' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(msgSub)
      supabase.removeChannel(readSub)
    }
  }, [user])

  return count
}

export default function Layout() {
  const { isArtin } = useAuth()
  const unread = useUnreadCount()

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto bg-white overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-center py-4 border-b border-gray-100">
        <span className="text-2xl font-bold tracking-tight text-primary">Artinder</span>
      </header>
      <main className="flex-1 overflow-hidden min-h-0">
        <Outlet />
      </main>
      <nav className="border-t border-gray-100 bg-white safe-bottom">
        <div className={`flex justify-around py-2 ${isArtin ? 'grid-cols-4' : 'grid grid-cols-3'}`}>
          <NavLink to="/" end className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <Heart size={24} />
            <span className="text-xs mt-1">Discover</span>
          </NavLink>

          <NavLink to="/messages" className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 relative ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <div className="relative">
              <MessageCircle size={24} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Messages</span>
          </NavLink>

          {isArtin && (
            <>
              <NavLink to="/artin" className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
              }>
                <LayoutDashboard size={24} />
                <span className="text-xs mt-1">Dashboard</span>
              </NavLink>
              <NavLink to="/artin/create-mood" className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
              }>
                <Plus size={24} />
                <span className="text-xs mt-1">Ny Persona</span>
              </NavLink>
            </>
          )}

          <NavLink to="/profile" className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
