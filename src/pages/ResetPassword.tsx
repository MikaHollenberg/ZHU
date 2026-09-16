import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Status = 'controleren' | 'klaar' | 'ongeldig'

export function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('controleren')
  const [wachtwoord, setWachtwoord] = useState('')
  const [wachtwoordHerhaal, setWachtwoordHerhaal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Supabase verwerkt de resetlink automatisch en vuurt daarna dit event —
    // dat is het enige betrouwbare signaal dat de link echt geldig was. Bewust
    // geen fallback op "is er al een sessie": iemand die hier toevallig al
    // ingelogd was (met een gewone sessie, niet via deze resetlink) zou anders
    // per ongeluk het wachtwoord-formulier te zien krijgen.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('klaar')
      }
    })

    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === 'controleren' ? 'ongeldig' : prev))
    }, 4000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (wachtwoord.length < 8) {
      setError('Het wachtwoord moet minimaal 8 tekens lang zijn.')
      return
    }
    if (wachtwoord !== wachtwoordHerhaal) {
      setError('De wachtwoorden komen niet overeen.')
      return
    }

    setError(null)
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: wachtwoord })

    if (updateError) {
      setSubmitting(false)
      setError('Het wachtwoord kon niet worden gewijzigd. Vraag een nieuwe link aan en probeer het opnieuw.')
      return
    }

    // Uitloggen na het instellen: gebruiker logt bewust opnieuw in met het
    // nieuwe wachtwoord, geen verwarring over een "toevallig" actieve sessie.
    await supabase.auth.signOut()
    setSubmitting(false)
    navigate('/login', { replace: true, state: { wachtwoordGewijzigd: true } })
  }

  if (status === 'controleren') {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 py-16 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        Link controleren...
      </div>
    )
  }

  if (status === 'ongeldig') {
    return (
      <div className="mx-auto max-w-md py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-brand-blue-dark">Link ongeldig of verlopen</h1>
        <p className="mb-4 text-slate-600">
          Deze link om je wachtwoord in te stellen is niet (meer) geldig. Vraag een nieuwe aan.
        </p>
        <Link to="/wachtwoord-vergeten" className="font-medium text-brand-blue-dark underline">
          Nieuwe link aanvragen
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Nieuw wachtwoord instellen</h1>
      <p className="mb-6 text-sm text-slate-500">Kies een nieuw wachtwoord van minimaal 8 tekens.</p>
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nieuw wachtwoord</span>
          <input
            required
            minLength={8}
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Herhaal wachtwoord</span>
          <input
            required
            minLength={6}
            type="password"
            value={wachtwoordHerhaal}
            onChange={(e) => setWachtwoordHerhaal(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Bezig...' : 'Wachtwoord instellen'}
        </button>
      </form>
    </div>
  )
}
