import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

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
    return <p className="text-slate-500">Profiel laden...</p>
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Mijn gegevens</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
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
        {saved && <p className="text-sm text-green-600">Gegevens opgeslagen.</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </div>
  )
}
