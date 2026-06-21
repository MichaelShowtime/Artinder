import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          age: number | null
          gender: string | null
          location: string | null
          bio: string | null
          interests: string[] | null
          is_artin: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      profile_images: {
        Row: {
          id: string
          user_id: string
          url: string
          order_index: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profile_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profile_images']['Insert']>
      }
      moods: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['moods']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['moods']['Insert']>
      }
      mood_images: {
        Row: {
          id: string
          mood_id: string
          url: string
          order_index: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mood_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mood_images']['Insert']>
      }
      swipes: {
        Row: {
          id: string
          user_id: string
          mood_id: string
          liked: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['swipes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['swipes']['Insert']>
      }
      matches: {
        Row: {
          id: string
          user_id: string
          mood_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          is_nej: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
  }
}
