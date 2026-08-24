import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Label } from '../../types/lesson'

const TYPE_LABELS: Record<Label['type'], string> = {
  verzetten: 'Alleen verzetten',
  annuleren: 'Alleen annuleren',
  beide: 'Verzetten en annuleren',
}

export function AdminLabels() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [naam, setNaam] = useState('')
  const [type, setType] = useState<Label['type']>('beide')
  const [submitting, setSubmitting] = useState(false)

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkType, setBewerkType] = useState<Label['type']>('beide')

  const load = async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('labels').select('*').order('naam', { ascending: true })
    if (loadError) setError(loadError.message)
    else setLabels(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleToevoegen = async (event: FormEvent) => {
    event.preventDefault()
    if (!naam.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from('labels').insert({ naam: naam.trim(), type })
    setSubmitting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setNaam('')
    setType('beide')
    await load()
  }

  const startBewerken = (label: Label) => {
    setBewerkId(label.id)
    setBewerkNaam(label.naam)
    setBewerkType(label.type)
    setError(null)
  }

  const handleOpslaan = async (id: string) => {
    if (!bewerkNaam.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('labels')
      .update({ naam: bewerkNaam.trim(), type: bewerkType })
      .eq('id', id)
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setBewerkId(null)
    await load()
  }

  const handleVerwijderen = async (id: string) => {
    setSubmitting(true)
    setError(null)
    const { error: deleteError } = await supabase.from('labels').delete().eq('id', id)
    setSubmitting(false)
    if (deleteError) {
      setError(
        'Dit label kan niet verwijderd worden omdat het al bij een les gebruikt is. Je kunt het wel hernoemen.',
      )
      return
    }
    await load()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Labels / redenen</h1>
      <p className="mb-6 text-sm text-slate-600">
        Dit zijn de redenen die je kunt kiezen bij het verzetten of annuleren van een les.
      </p>

      <form onSubmit={handleToevoegen} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-brand-blue-light/40 bg-white p-4">
        <label className="block flex-1 min-w-[180px]">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nieuwe reden</span>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. Motorpech"
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Te gebruiken bij</span>
          <select value={type} onChange={(e) => setType(e.target.value as Label['type'])} className="input">
            {(Object.keys(TYPE_LABELS) as Label['type'][]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={submitting || !naam.trim()} className="btn-primary">
          Toevoegen
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        <ul className="space-y-2">
          {labels.map((label) => (
            <li key={label.id} className="rounded-md border border-slate-200 bg-white px-4 py-3">
              {bewerkId === label.id ? (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block flex-1 min-w-[160px]">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Naam</span>
                    <input
                      type="text"
                      value={bewerkNaam}
                      onChange={(e) => setBewerkNaam(e.target.value)}
                      className="input"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Te gebruiken bij</span>
                    <select
                      value={bewerkType}
                      onChange={(e) => setBewerkType(e.target.value as Label['type'])}
                      className="input"
                    >
                      {(Object.keys(TYPE_LABELS) as Label['type'][]).map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleOpslaan(label.id)}
                    className="btn-primary"
                  >
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBewerkId(null)}
                    className="text-sm text-slate-500 hover:underline"
                  >
                    Annuleren
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{label.naam}</p>
                    <p className="text-sm text-slate-500">{TYPE_LABELS[label.type]}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startBewerken(label)}
                      className="text-sm text-brand-blue hover:underline"
                    >
                      Bewerken
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerwijderen(label.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {labels.length === 0 && <p className="text-slate-500">Nog geen labels aangemaakt.</p>}
        </ul>
      )}
    </div>
  )
}
