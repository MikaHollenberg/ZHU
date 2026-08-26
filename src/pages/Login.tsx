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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Welkom terug</h1>
      <p className="mb-6 text-sm text-slate-500">Log in om je lessen te bekijken of beschikbaarheid door te geven.</p>

      {wachtwoordGewijzigd && (
        <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-status-bevestigd-bg px-3.5 py-3 text-sm text-status-bevestigd">
          Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
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
