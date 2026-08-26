import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Wachtwoord vergeten</h1>

      {verzonden ? (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          Als dit e-mailadres bekend is, ontvang je binnen enkele minuten een e-mail met een link om een nieuw
          wachtwoord in te stellen. Geen mail ontvangen? Controleer ook je spamfolder.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
