import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Upload, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import type { ProfilePrompt } from '../context/AuthContext'
import InterestPicker from '../components/InterestPicker'

const PROMPTS = [
  'Perks of dating me:',
  'If I had 20 minutes left to live, I would:',
  'My worst midnight snack habit:',
  'The most romantic thing you can do for me is …',
  'My biography would be called:',
  "Life's too short to...",
  "Me: I'm a grown up. Also me:",
  'I can beat you in a game of:',
  'My biggest green flag is …',
  'My hidden talent is:',
  'People would describe me as:',
  'My weird but true story is:',
  'My dream job is:',
  'The first item on my bucket list is:',
  'My favourite playlist is:',
  'Message me if you also love...',
  'My go-to karaoke song is:',
  "If I'm not home, you can find me:",
  'First date wish list:',
  'A surprising thing about me is:',
  'The way to my heart is:',
  "I'm convinced that:",
  'My most controversial opinion is:',
  'I get too excited about:',
  'Two truths and a lie:',
  "I'll know it's time to delete this app when:",
  'Never have I ever:',
  'Dating me is like:',
  'My love language is:',
  'My go-to comfort show is:',
]

export default function CreateMoodPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [prompts, setPrompts] = useState<ProfilePrompt[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [promptSelectSlot, setPromptSelectSlot] = useState<number | null>(null)
  const [tagsOpen, setTagsOpen] = useState(false)


  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const selectPromptQuestion = (question: string) => {
    if (promptSelectSlot === null) return
    const updated = [...prompts]
    if (promptSelectSlot < updated.length) {
      updated[promptSelectSlot] = { ...updated[promptSelectSlot], question }
    } else {
      updated.push({ question, answer: '' })
    }
    setPrompts(updated)
    setPromptSelectSlot(null)
  }

  const updatePromptAnswer = (idx: number, answer: string) => {
    const updated = [...prompts]
    updated[idx] = { ...updated[idx], answer }
    setPrompts(updated)
  }

  const removePrompt = (idx: number) =>
    setPrompts(prev => prev.filter((_, i) => i !== idx))

  const usedQuestions = prompts.map(p => p.question)

  const save = async () => {
    if (!name.trim()) { setError('Giv personaen et navn'); return }
    setSaving(true)
    setError('')
    try {
      const { data: persona } = await supabase.from('moods').insert({ name, description, tags, prompts }).select().single()
      if (!persona) throw new Error('Kunne ikke oprette persona')

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop()
        const path = `moods/${persona.id}/${Date.now()}_${i}.${ext}`
        const { data: up } = await supabase.storage.from('moods').upload(path, file)
        if (up) {
          const { data: { publicUrl } } = supabase.storage.from('moods').getPublicUrl(path)
          await supabase.from('mood_images').insert({ mood_id: persona.id, url: publicUrl, order_index: i })
        }
      }
      navigate('/artin')
    } catch (_err) {
      setError('Noget gik galt. Prøv igen.')
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-gray-600" /></button>
        <h2 className="font-bold text-lg">Opret ny persona</h2>
      </div>
      <div className="p-4 space-y-5">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Navn</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Fx. Rizz Artin"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Beskrivelse</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Beskriv denne version af dig..." rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setTagsOpen(v => !v)}
            className="w-full flex items-center justify-between py-1 mb-1"
          >
            <span className="text-sm font-semibold text-gray-700">
              Tags{tags.length > 0 ? ` (${tags.length} valgt)` : ''}
            </span>
            {tagsOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {tagsOpen && <InterestPicker value={tags} onChange={setTags} max={30} />}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Prompts</label>
          <div className="space-y-3">
            {prompts.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <button onClick={() => setPromptSelectSlot(i)} className="text-xs text-primary font-semibold flex-1 text-left line-clamp-1 pr-2">{p.question}</button>
                  <button onClick={() => removePrompt(i)}><X size={15} className="text-gray-400" /></button>
                </div>
                <input value={p.answer} onChange={e => updatePromptAnswer(i, e.target.value)} placeholder="Dit svar..."
                  className="w-full px-4 py-3 text-sm focus:outline-none" />
              </div>
            ))}
            {prompts.length < 3 && (
              <button onClick={() => setPromptSelectSlot(prompts.length)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Plus size={18} /> Tilføj prompt
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Billeder</label>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-square">
                <img src={p} className="w-full h-full object-cover rounded-xl" alt={`Preview ${i}`} />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer">
              <Upload size={20} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Tilføj</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={save} disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50">
          {saving ? 'Gemmer...' : 'Opret persona'}
        </button>
      </div>

      {/* Prompt select modal */}
      {promptSelectSlot !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold">Vælg en prompt</h3>
              <button onClick={() => setPromptSelectSlot(null)}><X size={22} /></button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {PROMPTS.filter(p => !usedQuestions.includes(p) || prompts[promptSelectSlot]?.question === p).map(p => (
                <button key={p} onClick={() => selectPromptQuestion(p)}
                  className="w-full text-left px-4 py-4 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-100">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
