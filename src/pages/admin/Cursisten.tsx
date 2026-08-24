import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/profile'

export function AdminCursisten() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'cursist')
      .order('achternaam', { ascending: true })
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [])

  const gefilterd = useMemo(() => {
    const term = zoekterm.trim().toLowerCase()
    if (!term) return profiles
    return profiles.filter((p) =>
      [p.voornaam, p.achternaam, p.email, p.telefoonnummer, p.geboorteplaats]
        .filter(Boolean)
        .some((veld) => veld!.toLowerCase().includes(term)),
    )
  }, [profiles, zoekterm])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Cursisten</h1>

      <input
        type="text"
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        placeholder="Zoek op naam, e-mail, telefoon of woonplaats..."
        className="input mb-4 max-w-sm"
      />

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">Naam</th>
                <th className="px-4 py-2">E-mail</th>
                <th className="px-4 py-2">Telefoon</th>
                <th className="px-4 py-2">Geboortedatum</th>
                <th className="px-4 py-2">Geboorteplaats</th>
              </tr>
            </thead>
            <tbody>
              {gefilterd.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {p.voornaam} {p.achternaam}
                  </td>
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.telefoonnummer ?? '-'}</td>
                  <td className="px-4 py-2">{p.geboortedatum ?? '-'}</td>
                  <td className="px-4 py-2">{p.geboorteplaats ?? '-'}</td>
                </tr>
              ))}
              {gefilterd.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    {profiles.length === 0 ? 'Nog geen cursisten aangemeld.' : 'Geen cursisten gevonden.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
