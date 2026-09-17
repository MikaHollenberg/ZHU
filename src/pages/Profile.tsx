import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CheckIcon } from '../components/icons'
import { Loader } from '../components/Loader'

export function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    voornaam: '',
    achternaam: '',
    telefoonnummer: '',
    geboortedatum: '',
    geboorteplaats: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        voornaam: profile.voornaam ?? '',
        achternaam: profile.achternaam ?? '',
        telefoonnummer: profile.telefoonnummer ?? '',
        geboortedatum: profile.geboortedatum ?? '',
        geboorteplaats: profile.geboorteplaats ?? '',
      })
    }
  }, [profile])

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setSaved(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return

    setError(null)
    setSubmitting(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        voornaam: form.voornaam,
        achternaam: form.achternaam,
        telefoonnummer: form.telefoonnummer || null,
        geboortedatum: form.geboortedatum || null,
        geboorteplaats: form.geboorteplaats || null,
      })
      .eq('id', profile.id)

    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await refreshProfile()
    setSaved(true)
  }

  if (!profile) {
    return <Loader label="Profiel laden..." />
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Mijn gegevens</h1>
      <p className="mb-6 text-sm text-slate-500">Houd je contactgegevens up-to-date.</p>

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Voornaam</span>
            <input required type="text" value={form.voornaam} onChange={handleChange('voornaam')} className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Achternaam</span>
            <input
              required
              type="text"
              value={form.achternaam}
              onChange={handleChange('achternaam')}
              className="input"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">E-mailadres</span>
          <input type="email" value={profile.email} disabled className="input bg-slate-100 text-slate-500" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Telefoonnummer</span>
          <input
            type="tel"
            value={form.telefoonnummer}
            onChange={handleChange('telefoonnummer')}
            className="input"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Geboortedatum</span>
            <input
              type="date"
              value={form.geboortedatum}
              onChange={handleChange('geboortedatum')}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Geboorteplaats</span>
            <input
              type="text"
              value={form.geboorteplaats}
              onChange={handleChange('geboorteplaats')}
              className="input"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-status-bevestigd">
            <CheckIcon className="h-4 w-4" /> Gegevens opgeslagen.
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </div>
  )
}
