import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckIcon } from '../components/icons'

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    voornaam: '',
    achternaam: '',
    email: '',
    wachtwoord: '',
    telefoonnummer: '',
    geboortedatum: '',
    geboorteplaats: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.wachtwoord,
      options: {
        data: {
          voornaam: form.voornaam,
          achternaam: form.achternaam,
          telefoonnummer: form.telefoonnummer || null,
          geboortedatum: form.geboortedatum || null,
          geboorteplaats: form.geboorteplaats || null,
        },
      },
    })

    if (signUpError) {
      setSubmitting(false)
      setError(signUpError.message)
      return
    }

    // Supabase geeft bij een al bestaand e-mailadres geen foutmelding terug
    // (dat zou account-enumeratie mogelijk maken), maar wel een lege
    // identities-array. Stuur in dat geval in plaats daarvan een
    // wachtwoord-reset-mail — de gebruiker ziet hoe dan ook dezelfde melding.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/wachtwoord-instellen`,
      })
    }

    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Aanmelden voor priveles</h1>
      <p className="mb-6 text-sm text-slate-500">Maak een account aan om je beschikbaarheid door te geven.</p>

      {success ? (
        <div className="card flex items-start gap-3 p-5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-status-bevestigd-bg text-status-bevestigd">
            <CheckIcon className="h-4.5 w-4.5" />
          </span>
          <p className="text-slate-700">
            Je account is aangemaakt. Check je e-mail om je adres te bevestigen. Je wordt zo doorgestuurd naar de
            inlogpagina...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Voornaam" required>
              <input
                required
                type="text"
                value={form.voornaam}
                onChange={handleChange('voornaam')}
                className="input"
              />
            </Field>
            <Field label="Achternaam" required>
              <input
                required
                type="text"
                value={form.achternaam}
                onChange={handleChange('achternaam')}
                className="input"
              />
            </Field>
          </div>

          <Field label="E-mailadres" required>
            <input
              required
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="input"
            />
          </Field>

          <Field label="Wachtwoord" required>
            <input
              required
              minLength={6}
              type="password"
              value={form.wachtwoord}
              onChange={handleChange('wachtwoord')}
              className="input"
            />
          </Field>

          <Field label="Telefoonnummer">
            <input
              type="tel"
              value={form.telefoonnummer}
              onChange={handleChange('telefoonnummer')}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Geboortedatum">
              <input
                type="date"
                value={form.geboortedatum}
                onChange={handleChange('geboortedatum')}
                className="input"
              />
            </Field>
            <Field label="Geboorteplaats">
              <input
                type="text"
                value={form.geboorteplaats}
                onChange={handleChange('geboorteplaats')}
                className="input"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-slate-600">
        Heb je al een account?{' '}
        <Link to="/login" className="font-medium text-brand-blue-dark underline">
          Log hier in
        </Link>
      </p>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
