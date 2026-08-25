import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { LesSoort } from '../../types/availability'
import type { Profile, UserRole } from '../../types/profile'
import type { TweedePersoon } from '../../types/tweedePersoon'
import { DUO_CURSUS_TYPE_LABELS } from '../../lib/duoCursusType'
import type { DuoCursusType } from '../../lib/duoCursusType'

type Sortering = 'nieuwste' | 'naam'
type RolFilter = 'cursist' | 'instructeur'

interface EerstvolgendeBoeking {
  soort: LesSoort
  duoCursusType: DuoCursusType | null
}

const SOORT_LABELS: Record<LesSoort, string> = {
  priveles: 'Privéles',
  duo_cursus: 'Duo-cursus',
}

function DuoPartnerPaneel({
  cursist,
  partner,
  onClose,
  onLosgekoppeld,
}: {
  cursist: Profile
  partner: TweedePersoon
  onClose: () => void
  onLosgekoppeld: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoskoppelen = async () => {
    setSubmitting(true)
    setError(null)
    const { error: deleteError } = await supabase.from('tweede_persoon').delete().eq('id', partner.id)
    setSubmitting(false)

    if (deleteError) {
      setError(
        'Kan niet worden losgekoppeld: deze persoon is nog gekoppeld aan bestaande beschikbaarheid of lessen.',
      )
      return
    }
    onLosgekoppeld()
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-800">
              Duo-partner van {cursist.voornaam} {cursist.achternaam}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <dl className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <dt className="text-slate-500">Naam</dt>
            <dd className="text-slate-800">
              {partner.voornaam} {partner.achternaam}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <dt className="text-slate-500">E-mail</dt>
            <dd className="text-slate-800">{partner.email}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <dt className="text-slate-500">Telefoon</dt>
            <dd className="text-slate-800">{partner.telefoonnummer ?? '-'}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <dt className="text-slate-500">Geboortedatum</dt>
            <dd className="text-slate-800">{partner.geboortedatum ?? '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Geboorteplaats</dt>
            <dd className="text-slate-800">{partner.geboorteplaats ?? '-'}</dd>
          </div>
        </dl>

        <button
          type="button"
          disabled={submitting}
          onClick={handleLoskoppelen}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {submitting ? 'Bezig...' : 'Loskoppelen'}
        </button>
      </div>
    </div>
  )
}

export function AdminCursisten() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [eerstvolgendeSoort, setEerstvolgendeSoort] = useState<Record<string, EerstvolgendeBoeking>>({})
  const [tweedePersoonPerBoeker, setTweedePersoonPerBoeker] = useState<Record<string, TweedePersoon>>({})
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')
  const [sortering, setSortering] = useState<Sortering>('nieuwste')
  const [rolFilter, setRolFilter] = useState<RolFilter>('cursist')
  const [toonGearchiveerd, setToonGearchiveerd] = useState(false)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [bekekenPartnerVoor, setBekekenPartnerVoor] = useState<Profile | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('rol', rolFilter)
    setProfiles(data ?? [])

    if (rolFilter === 'cursist') {
      const vandaag = new Date().toISOString().slice(0, 10)
      const { data: lessenData } = await supabase
        .from('lessen')
        .select('cursist_id, datum, soort, duo_cursus_type')
        .eq('status', 'gepland')
        .gte('datum', vandaag)
        .order('datum', { ascending: true })

      const map: Record<string, EerstvolgendeBoeking> = {}
      for (const les of lessenData ?? []) {
        if (!(les.cursist_id in map)) {
          map[les.cursist_id] = { soort: les.soort, duoCursusType: les.duo_cursus_type }
        }
      }
      setEerstvolgendeSoort(map)

      const cursistIds = (data ?? []).map((p) => p.id)
      if (cursistIds.length > 0) {
        const { data: personen } = await supabase.from('tweede_persoon').select('*').in('boeker_id', cursistIds)
        const byBoeker: Record<string, TweedePersoon> = {}
        for (const p of personen ?? []) {
          byBoeker[p.boeker_id] = p
        }
        setTweedePersoonPerBoeker(byBoeker)
      } else {
        setTweedePersoonPerBoeker({})
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolFilter])

  const gefilterd = useMemo(() => {
    const term = zoekterm.trim().toLowerCase()
    let lijst = profiles.filter((p) => p.gearchiveerd === toonGearchiveerd)

    if (term) {
      lijst = lijst.filter((p) =>
        [p.voornaam, p.achternaam, p.email, p.telefoonnummer, p.geboorteplaats]
          .filter(Boolean)
          .some((veld) => veld!.toLowerCase().includes(term)),
      )
    }

    return [...lijst].sort((a, b) => {
      if (sortering === 'nieuwste') {
        return b.aangemaakt_op.localeCompare(a.aangemaakt_op)
      }
      return a.achternaam.localeCompare(b.achternaam)
    })
  }, [profiles, zoekterm, sortering, toonGearchiveerd])

  const toggleArchief = async (profile: Profile) => {
    setSubmitting(profile.id)
    await supabase.from('profiles').update({ gearchiveerd: !profile.gearchiveerd }).eq('id', profile.id)
    setSubmitting(null)
    await load()
  }

  const wijzigRol = async (profile: Profile, nieuweRol: UserRole) => {
    setSubmitting(profile.id)
    await supabase
      .from('profiles')
      .update({ rol: nieuweRol, ...(nieuweRol === 'instructeur' ? { instructeur_goedgekeurd: false } : {}) })
      .eq('id', profile.id)
    setSubmitting(null)
    await load()
  }

  const wijzigGoedkeuring = async (profile: Profile, goedgekeurd: boolean) => {
    setSubmitting(profile.id)
    await supabase.from('profiles').update({ instructeur_goedgekeurd: goedgekeurd }).eq('id', profile.id)
    setSubmitting(null)
    await load()
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Cursisten &amp; instructeurs</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex overflow-hidden rounded-md border border-slate-300">
          <button
            type="button"
            onClick={() => setRolFilter('cursist')}
            className={`px-3 py-2 text-sm ${rolFilter === 'cursist' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
          >
            Cursisten
          </button>
          <button
            type="button"
            onClick={() => setRolFilter('instructeur')}
            className={`px-3 py-2 text-sm ${rolFilter === 'instructeur' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
          >
            Instructeurs
          </button>
        </div>

        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoek op naam, e-mail, telefoon of woonplaats..."
          className="input max-w-sm"
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Sorteren op</span>
          <select
            value={sortering}
            onChange={(e) => setSortering(e.target.value as Sortering)}
            className="input"
          >
            <option value="nieuwste">Nieuwste aanmelding eerst</option>
            <option value="naam">Achternaam (A-Z)</option>
          </select>
        </label>
        <div className="flex overflow-hidden rounded-md border border-slate-300">
          <button
            type="button"
            onClick={() => setToonGearchiveerd(false)}
            className={`px-3 py-2 text-sm ${!toonGearchiveerd ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
          >
            Actief
          </button>
          <button
            type="button"
            onClick={() => setToonGearchiveerd(true)}
            className={`px-3 py-2 text-sm ${toonGearchiveerd ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
          >
            Gearchiveerd
          </button>
        </div>
      </div>

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
                <th className="px-4 py-2">Aangemeld op</th>
                {rolFilter === 'cursist' && (
                  <>
                    <th className="px-4 py-2">Prive of Duo</th>
                    <th className="px-4 py-2">Duo-partner</th>
                  </>
                )}
                {rolFilter === 'instructeur' && <th className="px-4 py-2">Goedkeuring</th>}
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Actie</th>
              </tr>
            </thead>
            <tbody>
              {gefilterd.map((p) => {
                const boeking = eerstvolgendeSoort[p.id]
                const partner = tweedePersoonPerBoeker[p.id]
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      {p.voornaam} {p.achternaam}
                    </td>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">{p.telefoonnummer ?? '-'}</td>
                    <td className="px-4 py-2">{p.geboortedatum ?? '-'}</td>
                    <td className="px-4 py-2">{p.geboorteplaats ?? '-'}</td>
                    <td className="px-4 py-2">{new Date(p.aangemaakt_op).toLocaleDateString('nl-NL')}</td>
                    {rolFilter === 'cursist' && (
                      <>
                        <td className="px-4 py-2">
                          {boeking ? (
                            <span
                              className={
                                boeking.soort === 'duo_cursus'
                                  ? 'rounded-full bg-brand-yellow/40 px-2 py-1 text-xs font-medium text-brand-blue-dark'
                                  : 'rounded-full bg-brand-blue-light/40 px-2 py-1 text-xs font-medium text-brand-blue-dark'
                              }
                            >
                              {SOORT_LABELS[boeking.soort]}
                              {boeking.soort === 'duo_cursus' && boeking.duoCursusType
                                ? ` (${DUO_CURSUS_TYPE_LABELS[boeking.duoCursusType]})`
                                : ''}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {partner ? (
                            <button
                              type="button"
                              onClick={() => setBekekenPartnerVoor(p)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/40 px-2 py-1 text-xs font-medium text-brand-blue-dark hover:bg-brand-yellow/60"
                            >
                              <span className="h-2 w-2 rounded-full bg-brand-yellow-dark" />
                              {partner.voornaam} {partner.achternaam}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </>
                    )}
                    {rolFilter === 'instructeur' && (
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              p.instructeur_goedgekeurd
                                ? 'rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700'
                                : 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700'
                            }
                          >
                            {p.instructeur_goedgekeurd ? 'Goedgekeurd' : 'Wacht op goedkeuring'}
                          </span>
                          <button
                            type="button"
                            disabled={submitting === p.id}
                            onClick={() => wijzigGoedkeuring(p, !p.instructeur_goedgekeurd)}
                            className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-50"
                          >
                            {p.instructeur_goedgekeurd ? 'Intrekken' : 'Goedkeuren'}
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        disabled={submitting === p.id}
                        onClick={() => wijzigRol(p, rolFilter === 'cursist' ? 'instructeur' : 'cursist')}
                        className="rounded-md border border-brand-blue px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue-light/20 disabled:opacity-50"
                      >
                        {rolFilter === 'cursist' ? 'Maak instructeur' : 'Maak cursist'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        disabled={submitting === p.id}
                        onClick={() => toggleArchief(p)}
                        className={
                          p.gearchiveerd
                            ? 'rounded-md border border-brand-blue px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue-light/20 disabled:opacity-50'
                            : 'rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50'
                        }
                      >
                        {submitting === p.id ? 'Bezig...' : p.gearchiveerd ? 'Activeren' : 'Archiveren'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {gefilterd.length === 0 && (
                <tr>
                  <td colSpan={rolFilter === 'cursist' ? 9 : 8} className="px-4 py-6 text-center text-slate-400">
                    {toonGearchiveerd
                      ? 'Niets gearchiveerd gevonden.'
                      : rolFilter === 'cursist'
                        ? 'Geen cursisten gevonden.'
                        : 'Geen instructeurs gevonden.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {bekekenPartnerVoor &&
        tweedePersoonPerBoeker[bekekenPartnerVoor.id] &&
        (() => {
          const cursist = bekekenPartnerVoor
          return (
            <DuoPartnerPaneel
              cursist={cursist}
              partner={tweedePersoonPerBoeker[cursist.id]}
              onClose={() => setBekekenPartnerVoor(null)}
              onLosgekoppeld={async () => {
                setBekekenPartnerVoor(null)
                await load()
              }}
            />
          )
        })()}
    </div>
  )
}
