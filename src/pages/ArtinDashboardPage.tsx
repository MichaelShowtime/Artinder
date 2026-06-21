import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2 } from 'lucide-react'

type Persona = {
  id: string
  name: string
  description: string | null
  tags: string[]
  mood_images: { url: string }[]
}

export default function ArtinDashboardPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('moods')
      .select('id, name, description, tags, mood_images(url)')
      .order('created_at')
    setPersonas((data as Persona[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deletePersona = async (id: string) => {
    await supabase.from('moods').delete().eq('id', id)
    setPersonas(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Mine personaer</h2>
        <Link to="/artin/create-mood" className="flex items-center gap-1 text-primary text-sm font-semibold">
          <Plus size={18} /> Ny persona
        </Link>
      </div>

      {personas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">Ingen personaer endnu. Opret din første!</p>
          <Link to="/artin/create-mood" className="mt-4 inline-block bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-semibold">Opret persona</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {personas.map(persona => (
            <div key={persona.id} className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
              {persona.mood_images?.[0]?.url ? (
                <img src={persona.mood_images[0].url} className="w-full h-full object-cover" alt={persona.name} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{persona.name[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-semibold text-sm truncate">{persona.name}</p>
                {persona.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {persona.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1.5">
                <Link to={`/artin/edit-mood/${persona.id}`} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                  <Edit2 size={14} className="text-gray-700" />
                </Link>
                <button onClick={() => deletePersona(persona.id)} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
