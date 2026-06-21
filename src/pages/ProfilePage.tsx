import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { ProfilePrompt } from '../context/AuthContext'
import { Camera, LogOut, Trash2, X, MapPin, Ruler, User2, Languages, ChevronRight, Plus, Check } from 'lucide-react'
import CityInput from '../components/CityInput'
import InterestPicker from '../components/InterestPicker'
import { INTEREST_CATEGORIES } from '../data/interests'

type ProfileImage = { id: string; url: string; order_index: number }

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

const LANGUAGES = [
  'Dansk', 'Engelsk', 'Arabisk', 'Tyrkisk', 'Persisk', 'Urdu', 'Hindi',
  'Somali', 'Polsk', 'Rumænsk', 'Spansk', 'Portugisisk', 'Fransk', 'Tysk',
  'Norsk', 'Svensk', 'Kinesisk', 'Vietnamesisk', 'Tagalog', 'Punjabi',
  'Tamil', 'Italiensk', 'Hollandsk', 'Russisk', 'Japansk', 'Koreansk',
  'Græsk', 'Ungarsk', 'Tjekkisk', 'Bosnisk', 'Serbisk', 'Kroatisk',
  'Albansk', 'Bulgarsk', 'Ukrainsk', 'Amharisk', 'Swahili', 'Hebraisk',
  'Thai', 'Indonesisk', 'Malay', 'Tigrinya',
]

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'edit' | 'preview'>('preview')
  const [images, setImages] = useState<ProfileImage[]>([])

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [prompts, setPrompts] = useState<ProfilePrompt[]>([])

  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLanguagesModal, setShowLanguagesModal] = useState(false)
  const [promptSelectSlot, setPromptSelectSlot] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profile_images').select('*').eq('user_id', user.id).order('order_index').then(({ data }) => {
      setImages(data || [])
    })
  }, [user])

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setAge(String(profile.age || ''))
      setHeight(String(profile.height || ''))
      setGender(profile.gender || '')
      setLocation(profile.location || '')
      setBio(profile.bio || '')
      setInterests(profile.interests || [])
      setLanguages(profile.languages || [])
      setPrompts(profile.prompts || [])
    }
  }, [profile])

  const save = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      name,
      age: parseInt(age) || null,
      height: parseInt(height) || null,
      gender,
      location,
      bio,
      interests,
      languages,
      prompts,
    }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setMode('preview')
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { data } = await supabase.storage.from('avatars').upload(path, file)
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const { data: img } = await supabase.from('profile_images').insert({ user_id: user.id, url: publicUrl, order_index: images.length }).select().single()
      if (img) setImages(prev => [...prev, img as ProfileImage])
    }
  }

  const removeImage = async (imgId: string) => {
    await supabase.from('profile_images').delete().eq('id', imgId)
    setImages(prev => prev.filter(i => i.id !== imgId))
  }


  const toggleLanguage = (lang: string) =>
    setLanguages(prev => prev.includes(lang) ? prev.filter(x => x !== lang) : [...prev, lang])

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

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const handleDeleteAccount = async () => {
    if (!user) return
    await supabase.from('profiles').delete().eq('id', user.id)
    await signOut()
    navigate('/login')
  }

  const usedQuestions = prompts.map(p => p.question)

  return (
    <div className="h-full flex flex-col">
      {/* Tab switcher */}
      <div className="flex-shrink-0 flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setMode('edit')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${mode === 'edit' ? 'text-primary border-primary' : 'text-gray-400 border-transparent'}`}
        >
          Rediger
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${mode === 'preview' ? 'text-primary border-primary' : 'text-gray-400 border-transparent'}`}
        >
          Forhåndsvisning
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === 'preview' ? (
          /* ---- PREVIEW ---- */
          <div className="h-full overflow-y-auto">
            <div className="relative h-72 bg-gradient-to-br from-pink-400 to-red-500 flex-shrink-0">
              {images[0]?.url && <img src={images[0].url} className="w-full h-full object-cover" alt="Profil" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h2 className="text-white text-3xl font-bold drop-shadow">
                  {profile?.name}{profile?.age ? `, ${profile.age}` : ''}
                </h2>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Essentials */}
              {(profile?.location || profile?.height || profile?.gender || profile?.languages?.length) ? (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Essentials</p>
                  {profile?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{profile.location}</span>
                    </div>
                  )}
                  {profile?.height && (
                    <div className="flex items-center gap-3">
                      <Ruler size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{profile.height} cm</span>
                    </div>
                  )}
                  {profile?.gender && (
                    <div className="flex items-center gap-3">
                      <User2 size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{profile.gender}</span>
                    </div>
                  )}
                  {profile?.languages && profile.languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Languages size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800">{profile.languages.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Bio */}
              {profile?.bio && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Prompts */}
              {profile?.prompts?.filter(p => p.answer).map((p, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1.5">{p.question}</p>
                  <p className="text-lg font-bold text-gray-900 leading-snug">{p.answer}</p>
                </div>
              ))}

              {/* Interests grouped by category */}
              {profile?.interests && profile.interests.length > 0 && (() => {
                const userInterests = profile.interests!
                const categoriesWithMatches = INTEREST_CATEGORIES
                  .map(cat => ({ name: cat.name, tags: cat.tags.filter(t => userInterests.includes(t)) }))
                  .filter(cat => cat.tags.length > 0)
                return (
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Interesser</p>
                    {categoriesWithMatches.map(cat => (
                      <div key={cat.name}>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {cat.tags.map(tag => (
                            <span key={tag} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Extra photos */}
              {images.length > 1 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Billeder</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map(img => (
                      <div key={img.id} className="aspect-square rounded-xl overflow-hidden">
                        <img src={img.url} className="w-full h-full object-cover" alt="Profil" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden mt-2">
                <button onClick={handleSignOut} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <LogOut size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Log ud</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
                <div className="border-t border-gray-100" />
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-50">
                  <div className="flex items-center gap-3">
                    <Trash2 size={18} className="text-red-400" />
                    <span className="text-sm text-red-500">Slet konto</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ---- EDIT ---- */
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-6">

              {/* Photos */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Billeder</p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map(img => (
                    <div key={img.id} className="relative aspect-square">
                      <img src={img.url} className="w-full h-full object-cover rounded-xl" alt="Profil" />
                      <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 9 && (
                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer">
                      <Camera size={22} className="text-gray-400" />
                      <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Grundinfo</p>
                <div className="space-y-2">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Navn" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="Alder" className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                    <div className="relative">
                      <input value={height} onChange={e => setHeight(e.target.value)} type="number" placeholder="Højde" className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-primary" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                    </div>
                  </div>
                  <CityInput value={location} onChange={setLocation} placeholder="By / Område" />
                </div>
              </div>

              {/* Gender */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Køn</p>
                <div className="flex gap-2">
                  {['Mand', 'Kvinde', 'Andet'].map(g => (
                    <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${gender === g ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700'}`}>{g}</button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Sprog</p>
                <button onClick={() => setShowLanguagesModal(true)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between">
                  <span className={languages.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
                    {languages.length > 0 ? languages.join(', ') : 'Vælg sprog...'}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Bio */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Bio</p>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Hvem er du?" rows={3} maxLength={300} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
                <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/300</p>
              </div>

              {/* Interests */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Interesser</p>
                <InterestPicker value={interests} onChange={setInterests} max={10} />
              </div>

              {/* Prompts */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Prompts</p>
                <div className="space-y-3">
                  {prompts.map((p, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <button onClick={() => setPromptSelectSlot(i)} className="text-xs text-primary font-semibold flex-1 text-left line-clamp-1 pr-2">{p.question}</button>
                        <button onClick={() => removePrompt(i)}>
                          <X size={15} className="text-gray-400" />
                        </button>
                      </div>
                      <input
                        value={p.answer}
                        onChange={e => updatePromptAnswer(i, e.target.value)}
                        placeholder="Dit svar..."
                        className="w-full px-4 py-3 text-sm focus:outline-none"
                      />
                    </div>
                  ))}
                  {prompts.length < 3 && (
                    <button onClick={() => setPromptSelectSlot(prompts.length)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Plus size={18} /> Tilføj prompt
                    </button>
                  )}
                </div>
              </div>

              <button onClick={save} disabled={saving} className="w-full bg-primary text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50">
                {saving ? 'Gemmer...' : 'Gem profil'}
              </button>

              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50">
                  <LogOut size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Log ud</span>
                </button>
                <div className="border-t border-gray-100" />
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50">
                  <Trash2 size={18} className="text-red-400" />
                  <span className="text-sm text-red-500">Slet konto</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Languages modal */}
      {showLanguagesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold">Vælg sprog</h3>
              <button onClick={() => setShowLanguagesModal(false)}>
                <Check size={22} className="text-primary" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => toggleLanguage(lang)} className={`px-3 py-1.5 rounded-full text-sm border transition-all ${languages.includes(lang) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <button key={p} onClick={() => selectPromptQuestion(p)} className="w-full text-left px-4 py-4 text-sm text-gray-800 hover:bg-gray-50 active:bg-gray-100">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Slet konto</h3>
            <p className="text-sm text-gray-500 mb-6">Er du sikker? Denne handling kan ikke fortrydes.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold">Annuller</button>
              <button onClick={handleDeleteAccount} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold">Slet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
