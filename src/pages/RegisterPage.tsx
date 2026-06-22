import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Mail } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (!data.session) {
      // Supabase kræver email-bekræftelse
      setConfirmationSent(true)
      setLoading(false)
    }
    // Hvis session oprettes med det samme, opdaterer AuthContext og App.tsx redirecter automatisk
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tjek din email</h2>
          <p className="text-gray-500 text-sm mb-6">
            Vi har sendt en bekræftelsesmail til <span className="font-semibold text-gray-800">{email}</span>.
            Klik på linket i mailen for at aktivere din konto.
          </p>
          <Link to="/login" className="text-primary font-semibold text-sm">
            Tilbage til login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center text-primary mb-2">Artinder</h1>
        <p className="text-center text-gray-500 mb-10 text-sm">Opret din profil</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Dit navn"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Adgangskode (min. 6 tegn)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Opretter...' : 'Opret konto'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Har du allerede en konto?{' '}
          <Link to="/login" className="text-primary font-semibold">Log ind her</Link>
        </p>
      </div>
    </div>
  )
}
