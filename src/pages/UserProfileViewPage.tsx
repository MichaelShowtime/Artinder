import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, MapPin, Ruler, User2, Languages } from 'lucide-react'

type ProfilePrompt = { question: string; answer: string }

type UserProfile = {
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
  profile_images: { url: string; order_index: number }[]
}

export default function UserProfileViewPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*, profile_images(url, order_index)')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data as UserProfile))
  }, [userId])

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const images = [...(profile.profile_images || [])].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero image */}
      <div className="relative h-72 flex-shrink-0">
        {images.length > 0 ? (
          <img src={images[imgIndex]?.url} className="w-full h-full object-cover" alt={profile.name} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">{profile.name[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
          <ArrowLeft size={20} className="text-white" />
        </button>
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 px-3">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIndex(i)} className={`flex-1 h-1 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <h2 className="text-white text-2xl font-bold drop-shadow">
            {profile.name}{profile.age ? `, ${profile.age}` : ''}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Essentials */}
        {(profile.location || profile.height || profile.gender || profile.languages?.length) ? (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Essentials</p>
            {profile.location && (
              <div className="flex items-center gap-3">
                <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800">{profile.location}</span>
              </div>
            )}
            {profile.height && (
              <div className="flex items-center gap-3">
                <Ruler size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800">{profile.height} cm</span>
              </div>
            )}
            {profile.gender && (
              <div className="flex items-center gap-3">
                <User2 size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800">{profile.gender}</span>
              </div>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex items-start gap-3">
                <Languages size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-800">{profile.languages.join(', ')}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Bio */}
        {profile.bio && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-800 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Prompts */}
        {profile.prompts?.filter(p => p.answer).map((p, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1.5">{p.question}</p>
            <p className="text-lg font-bold text-gray-900 leading-snug">{p.answer}</p>
          </div>
        ))}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Interesser</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => (
                <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700">{i}</span>
              ))}
            </div>
          </div>
        )}

        {/* More photos */}
        {images.length > 1 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billeder</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={img.url} className="w-full h-full object-cover" alt={profile.name} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
