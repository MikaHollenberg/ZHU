import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const wachtwoordGewijzigd = Boolean((location.state as { wachtwoordGewijzigd?: boolean } | null)?.wachtwoordGewijzigd)
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: wachtwoord,
    })

    setSubmitting(false)

    if (signInError) {
      setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.')
      return
    }

    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Inloggen</h1>

      {wachtwoordGewijzigd && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">E-mailadres</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Wachtwoord</span>
          <input
            required
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Bezig...' : 'Inloggen'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        <Link to="/wachtwoord-vergeten" className="font-medium text-brand-blue-dark underline">
          Wachtwoord vergeten?
        </Link>
      </p>

      <p className="mt-2 text-sm text-slate-600">
        Nog geen account?{' '}
        <Link to="/registreren" className="font-medium text-brand-blue-dark underline">
          Meld je hier aan
        </Link>
      </p>
    </div>
  )
}
