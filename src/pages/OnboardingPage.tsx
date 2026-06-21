import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronRight, Upload, Check, X } from 'lucide-react'

const INTERESTS = ['Musik', 'Film', 'Sport', 'Gaming', 'Rejser', 'Mad', 'Fitness', 'Kunst', 'Natur', 'Bøger', 'Mode', 'Teknologi']

const LANGUAGES = [
  'Dansk', 'Engelsk', 'Arabisk', 'Tyrkisk', 'Persisk', 'Urdu', 'Hindi',
  'Somali', 'Polsk', 'Rumænsk', 'Spansk', 'Portugisisk', 'Fransk', 'Tysk',
  'Norsk', 'Svensk', 'Kinesisk', 'Vietnamesisk', 'Tagalog', 'Punjabi',
  'Tamil', 'Italiensk', 'Hollandsk', 'Russisk', 'Japansk', 'Koreansk',
  'Græsk', 'Ungarsk', 'Tjekkisk', 'Bosnisk', 'Serbisk', 'Kroatisk',
  'Albansk', 'Bulgarsk', 'Ukrainsk', 'Amharisk', 'Swahili', 'Hebraisk',
  'Thai', 'Indonesisk', 'Malay', 'Tigrinya',
]

const steps = ['name', 'age', 'height', 'gender', 'location', 'languages', 'bio', 'interests', 'photos'] as const
type Step = typeof steps[number]

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showLangModal, setShowLangModal] = useState(false)

  const stepIndex = steps.indexOf(step)
  const progress = ((stepIndex + 1) / steps.length) * 100

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

  const toggleLanguage = (lang: string) =>
    setLanguages(prev => prev.includes(lang) ? prev.filter(x => x !== lang) : [...prev, lang])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const next = () => {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  const finish = async () => {
    if (!user) return
    setUploading(true)
    setError('')
    try {
      await supabase.from('profiles').update({
        name,
        age: parseInt(age) || null,
        height: parseInt(height) || null,
        gender,
        location,
        bio,
        interests,
        languages,
      }).eq('id', user.id)

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}_${i}.${ext}`
        const { data: uploadData } = await supabase.storage.from('avatars').upload(path, file)
        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
          await supabase.from('profile_images').insert({ user_id: user.id, url: publicUrl, order_index: i })
        }
      }

      await refreshProfile()
      navigate('/')
    } catch (_err) {
      setError('Noget gik galt. Prøv igen.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-10">
      <div className="mb-8">
        <div className="h-1 bg-gray-100 rounded-full">
          <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{stepIndex + 1} / {steps.length}</p>
      </div>

      {step === 'name' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvad hedder du?</h2>
          <p className="text-gray-500 text-sm mb-6">Det vises på din profil</p>
          <input type="text" placeholder="Dit navn" value={name} onChange={e => setName(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>
      )}

      {step === 'age' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvor gammel er du?</h2>
          <p className="text-gray-500 text-sm mb-6">Du skal være mindst 18 år</p>
          <input type="number" placeholder="Din alder" value={age} min={18} max={99} onChange={e => setAge(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>
      )}

      {step === 'height' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvor høj er du?</h2>
          <p className="text-gray-500 text-sm mb-6">Valgfrit — kan ændres senere</p>
          <div className="relative">
            <input type="number" placeholder="Fx. 175" value={height} min={100} max={250} onChange={e => setHeight(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">cm</span>
          </div>
        </div>
      )}

      {step === 'gender' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvad er dit køn?</h2>
          <div className="space-y-3 mt-6">
            {['Mand', 'Kvinde', 'Andet'].map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-left transition-all ${gender === g ? 'border-primary bg-red-50 text-primary font-semibold' : 'border-gray-200'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'location' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvor bor du?</h2>
          <p className="text-gray-500 text-sm mb-6">By eller område</p>
          <input type="text" placeholder="Fx. København" value={location} onChange={e => setLocation(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
        </div>
      )}

      {step === 'languages' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Hvilke sprog taler du?</h2>
          <p className="text-gray-500 text-sm mb-6">Valgfrit — kan ændres senere</p>
          {languages.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {languages.map(lang => (
                <span key={lang} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-full text-sm">
                  {lang}
                  <button onClick={() => toggleLanguage(lang)}><X size={13} /></button>
                </span>
              ))}
            </div>
          ) : null}
          <button onClick={() => setShowLangModal(true)}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400">
            + Vælg sprog
          </button>
        </div>
      )}

      {step === 'bio' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Skriv lidt om dig selv</h2>
          <p className="text-gray-500 text-sm mb-6">Max 300 tegn</p>
          <textarea placeholder="Hvem er du?" value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={4}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/300</p>
        </div>
      )}

      {step === 'interests' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Dine interesser</h2>
          <p className="text-gray-500 text-sm mb-6">Vælg hvad der passer dig</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(i => (
              <button key={i} onClick={() => toggleInterest(i)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${interests.includes(i) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'photos' && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Tilføj billeder</h2>
          <p className="text-gray-500 text-sm mb-6">Upload mindst ét billede af dig selv</p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer">
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Vælg billeder</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {previews.map((p, i) => (
                <img key={i} src={p} className="w-full h-24 object-cover rounded-lg" alt={`Preview ${i}`} />
              ))}
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      <div className="mt-8">
        {step !== 'photos' ? (
          <button
            onClick={next}
            disabled={
              (step === 'name' && !name.trim()) ||
              (step === 'age' && !age) ||
              (step === 'gender' && !gender)
            }
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Næste <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={finish} disabled={uploading}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50">
            {uploading ? 'Gemmer...' : 'Kom i gang'}
          </button>
        )}
      </div>

      {/* Languages modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold">Vælg sprog</h3>
              <button onClick={() => setShowLangModal(false)}>
                <Check size={22} className="text-primary" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${languages.includes(lang) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-700'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
