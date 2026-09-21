import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckIcon } from '../components/icons'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verzonden, setVerzonden] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/wachtwoord-instellen`,
    })

    // Altijd dezelfde uitkomst tonen, ongeacht of dit adres een account
    // heeft — zo is niet af te lezen welke e-mailadressen wel/niet bestaan.
    setSubmitting(false)
    setVerzonden(true)
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Wachtwoord vergeten</h1>
      <p className="mb-1 text-sm text-slate-500">Geen paniek — we sturen je een link om een nieuwe in te stellen.</p>
      <p className="mb-6 text-sm italic text-slate-400">
        Zelfs de beste stuurlui raken weleens hun wachtwoord kwijt.
      </p>

      {verzonden ? (
        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-status-bevestigd-bg text-status-bevestigd">
            <CheckIcon className="h-4.5 w-4.5" />
          </span>
          <p className="text-slate-700">
            Als dit e-mailadres bekend is, ontvang je binnen enkele minuten een e-mail met een link om een nieuw
            wachtwoord in te stellen. Geen mail ontvangen? Controleer ook je spamfolder.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <p className="text-sm text-slate-600">
            Vul je e-mailadres in. Als hier een account bekend is, sturen we een link om een nieuw wachtwoord in te
            stellen.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">E-mailadres</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Bezig...' : 'Verstuur reset-link'}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-slate-600">
        <Link to="/login" className="font-medium text-brand-blue-dark underline">
          Terug naar inloggen
        </Link>
      </p>
    </div>
  )
}
