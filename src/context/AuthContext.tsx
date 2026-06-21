import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type ProfilePrompt = { question: string; answer: string }

export type Profile = {
  id: string
  name: string
  age: number | null
  height: number | null
  gender: string | null
  location: string | null
  bio: string | null
  interests: string[] | null
  languages: string[] | null
  prompts: ProfilePrompt[] | null
  is_artin: boolean
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  isArtin: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isArtin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, userName?: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data as Profile)
    } else {
      // Trigger didn't create profile — create it now
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId, name: userName || 'Bruger' })
        .select()
        .single()
      if (created) setProfile(created as Profile)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.user_metadata?.name)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata?.name).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata?.name)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isArtin: profile?.is_artin ?? false,
      loading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
