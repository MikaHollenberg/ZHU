import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

    const { error: signUpError } = await supabase.auth.signUp({
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

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Aanmelden voor priveles</h1>

      {success ? (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          Je account is aangemaakt. Check je e-mail om je adres te bevestigen. Je wordt zo doorgestuurd naar de
          inlogpagina...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
