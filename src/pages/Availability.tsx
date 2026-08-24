import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MINIMALE_TIJDVAK_MINUTEN, TIJD_OPTIES, tijdNaarMinuten } from '../lib/tijd'
import { getMaandWeken, toDateKey } from '../lib/kalender'
import { DISCIPLINE_LABELS, DISCIPLINES } from '../lib/disciplines'
import type { Discipline } from '../lib/disciplines'
import { DisciplineBadge } from '../components/DisciplineBadge'
import type { Beschikbaarheid, BeschikbaarheidType, LesSoort } from '../types/availability'
import { LEEG_TWEEDE_PERSOON } from '../types/tweedePersoon'
import type { TweedePersoon, TweedePersoonInvoer } from '../types/tweedePersoon'

const TYPE_LABELS: Record<BeschikbaarheidType, string> = {
  hele_dag_beschikbaar: 'Hele dag beschikbaar',
  hele_dag_onbeschikbaar: 'Hele dag onbeschikbaar',
  tijdvak: 'Specifiek tijdvak',
}

const SOORT_LABELS: Record<LesSoort, string> = {
  priveles: 'Privéles (1 persoon)',
  duo_cursus: 'Duo-cursus (2 personen)',
}

function samenvatting(entry?: Beschikbaarheid) {
  if (!entry) return '–'
  const basis = entry.type === 'tijdvak' ? `${entry.starttijd?.slice(0, 5)} - ${entry.eindtijd?.slice(0, 5)}` : TYPE_LABELS[entry.type]
  return entry.soort === 'duo_cursus' ? `${basis} · Duo-cursus` : basis
}

function vandaag() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function Availability() {
  const { user, profile, refreshProfile } = useAuth()
  const isInstructeur = profile?.rol === 'instructeur'
  const [maand, setMaand] = useState(() => {
    const n = new Date()
    return { jaar: n.getFullYear(), maand: n.getMonth() }
  })
  const [itemsByDatum, setItemsByDatum] = useState<Record<string, Beschikbaarheid>>({})
  const [eigenTweedePersoon, setEigenTweedePersoon] = useState<TweedePersoon | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [standaardDiscipline, setStandaardDiscipline] = useState<Discipline>('polyvalk')
  const [disciplineOpslaan, setDisciplineOpslaan] = useState(false)

  const [editingDatum, setEditingDatum] = useState<string | null>(null)
  const [editType, setEditType] = useState<BeschikbaarheidType>('hele_dag_beschikbaar')
  const [editStart, setEditStart] = useState('17:00')
  const [editEind, setEditEind] = useState('19:00')
  const [editSoort, setEditSoort] = useState<LesSoort>('priveles')
  const [editTweedePersoon, setEditTweedePersoon] = useState<TweedePersoonInvoer>(LEEG_TWEEDE_PERSOON)
  const [editDiscipline, setEditDiscipline] = useState<Discipline>('polyvalk')

  const today = useMemo(() => vandaag(), [])
  const weken = useMemo(
    () =>
      getMaandWeken(maand.jaar, maand.maand)
        .map((week) => ({ ...week, dagen: week.dagen.filter((dag) => dag >= today) }))
        .filter((week) => week.dagen.length > 0),
    [maand, today],
  )

  const load = async () => {
    if (!user || weken.length === 0) return
    setLoading(true)
    const eerste = toDateKey(weken[0].dagen[0])
    const laatste = toDateKey(weken[weken.length - 1].dagen[6])

    const { data, error: loadError } = await supabase
      .from('beschikbaarheid')
      .select('*')
      .eq('cursist_id', user.id)
      .gte('datum', eerste)
      .lte('datum', laatste)

    if (loadError) {
      setError(loadError.message)
      setLoading(false)
      return
    }

    const map: Record<string, Beschikbaarheid> = {}
    for (const item of data ?? []) {
      map[item.datum] = item
    }
    setItemsByDatum(map)

    const { data: persoon } = await supabase.from('tweede_persoon').select('*').eq('boeker_id', user.id).maybeSingle()
    setEigenTweedePersoon(persoon ?? null)

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, maand.jaar, maand.maand])

  useEffect(() => {
    setStandaardDiscipline(profile?.standaard_discipline ?? 'polyvalk')
  }, [profile?.standaard_discipline])

  const handleStandaardDisciplineChange = async (waarde: Discipline) => {
    if (!user) return
    setStandaardDiscipline(waarde)
    setDisciplineOpslaan(true)
    await supabase.from('profiles').update({ standaard_discipline: waarde }).eq('id', user.id)
    await refreshProfile()
    setDisciplineOpslaan(false)
  }

  const shiftMaand = (delta: number) => {
    setEditingDatum(null)
    setMaand((prev) => {
      const d = new Date(prev.jaar, prev.maand + delta, 1)
      return { jaar: d.getFullYear(), maand: d.getMonth() }
    })
  }

  const eindOpties = useMemo(
    () => TIJD_OPTIES.filter((t) => tijdNaarMinuten(t) - tijdNaarMinuten(editStart) >= MINIMALE_TIJDVAK_MINUTEN),
    [editStart],
  )

  const handleStartChange = (waarde: string) => {
    setEditStart(waarde)
    if (tijdNaarMinuten(editEind) - tijdNaarMinuten(waarde) < MINIMALE_TIJDVAK_MINUTEN) {
      const eersteGeldige = TIJD_OPTIES.find(
        (t) => tijdNaarMinuten(t) - tijdNaarMinuten(waarde) >= MINIMALE_TIJDVAK_MINUTEN,
      )
      if (eersteGeldige) setEditEind(eersteGeldige)
    }
  }

  const openEditor = (key: string, entry?: Beschikbaarheid) => {
    setEditingDatum(key)
    setError(null)
    setEditType(entry?.type ?? 'hele_dag_beschikbaar')
    setEditStart(entry?.starttijd?.slice(0, 5) ?? '17:00')
    setEditEind(entry?.eindtijd?.slice(0, 5) ?? '19:00')
    setEditSoort(entry?.soort ?? 'priveles')
    setEditDiscipline(entry?.discipline ?? standaardDiscipline)
    setEditTweedePersoon(
      eigenTweedePersoon
        ? {
            voornaam: eigenTweedePersoon.voornaam,
            achternaam: eigenTweedePersoon.achternaam,
            email: eigenTweedePersoon.email,
            telefoonnummer: eigenTweedePersoon.telefoonnummer ?? '',
            geboortedatum: eigenTweedePersoon.geboortedatum ?? '',
            geboorteplaats: eigenTweedePersoon.geboorteplaats ?? '',
          }
        : LEEG_TWEEDE_PERSOON,
    )
  }

  const tweedePersoonVeldWijzig = (veld: keyof TweedePersoonInvoer, waarde: string) => {
    setEditTweedePersoon((prev) => ({ ...prev, [veld]: waarde }))
  }

  const handleSave = async (key: string) => {
    if (!user) return
    if (editType === 'tijdvak' && tijdNaarMinuten(editEind) - tijdNaarMinuten(editStart) < MINIMALE_TIJDVAK_MINUTEN) {
      setError('Een tijdvak moet minimaal 2 uur duren.')
      return
    }

    if (editType !== 'hele_dag_onbeschikbaar' && editSoort === 'duo_cursus') {
      const { voornaam, achternaam, email, geboortedatum, geboorteplaats } = editTweedePersoon
      if (!voornaam.trim() || !achternaam.trim() || !email.trim() || !geboortedatum || !geboorteplaats.trim()) {
        setError('Vul alle gegevens van de tweede persoon in.')
        return
      }
    }

    setError(null)
    setSubmitting(true)

    let tweedePersoonId: string | null = null

    if (editType !== 'hele_dag_onbeschikbaar' && editSoort === 'duo_cursus') {
      const { data: persoon, error: persoonError } = await supabase
        .from('tweede_persoon')
        .upsert(
          {
            boeker_id: user.id,
            voornaam: editTweedePersoon.voornaam.trim(),
            achternaam: editTweedePersoon.achternaam.trim(),
            email: editTweedePersoon.email.trim(),
            telefoonnummer: editTweedePersoon.telefoonnummer.trim() || null,
            geboortedatum: editTweedePersoon.geboortedatum || null,
            geboorteplaats: editTweedePersoon.geboorteplaats.trim() || null,
          },
          { onConflict: 'boeker_id' },
        )
        .select()
        .single()

      if (persoonError) {
        setSubmitting(false)
        setError(persoonError.message)
        return
      }
      tweedePersoonId = persoon.id
      setEigenTweedePersoon(persoon)
    }

    const soort = editType !== 'hele_dag_onbeschikbaar' ? editSoort : 'priveles'

    const { error: saveError } = await supabase.from('beschikbaarheid').upsert(
      {
        cursist_id: user.id,
        datum: key,
        type: editType,
        starttijd: editType === 'tijdvak' ? editStart : null,
        eindtijd: editType === 'tijdvak' ? editEind : null,
        status: 'open',
        soort,
        tweede_persoon_id: soort === 'duo_cursus' ? tweedePersoonId : null,
        discipline: editDiscipline,
      },
      { onConflict: 'cursist_id,datum' },
    )
    setSubmitting(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setEditingDatum(null)
    await load()
  }

  const handleClear = async (key: string) => {
    if (!user) return
    setSubmitting(true)
    await supabase.from('beschikbaarheid').delete().eq('cursist_id', user.id).eq('datum', key)
    setSubmitting(false)
    setEditingDatum(null)
    await load()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Beschikbaarheid</h1>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMaand(-1)}
          aria-label="Vorige maand"
          className="rounded-full px-3 py-1 text-xl text-brand-blue hover:bg-brand-blue-light/20"
        >
          ‹
        </button>
        <span className="text-lg font-semibold capitalize text-slate-800">
          {new Date(maand.jaar, maand.maand, 1).toLocaleDateString('nl-NL', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          type="button"
          onClick={() => shiftMaand(1)}
          aria-label="Volgende maand"
          className="rounded-full px-3 py-1 text-xl text-brand-blue hover:bg-brand-blue-light/20"
        >
          ›
        </button>
      </div>

      {!isInstructeur && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Jouw discipline</span>
            <select
              value={standaardDiscipline}
              onChange={(e) => handleStandaardDisciplineChange(e.target.value as Discipline)}
              className="input"
            >
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {DISCIPLINE_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-xs text-slate-500">
            {disciplineOpslaan ? 'Bezig met opslaan...' : 'Wordt onthouden en automatisch gebruikt bij het doorgeven van beschikbaarheid.'}
          </p>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        weken.map((week) => (
          <div key={week.weekNummer} className="mb-5">
            <p className="mb-2 text-sm font-semibold text-slate-500">Week {week.weekNummer}</p>
            <div className="space-y-2">
              {week.dagen.map((dag) => {
                const key = toDateKey(dag)
                const entry = itemsByDatum[key]
                const isPast = dag < today
                const isLocked = entry?.status === 'ingepland'
                const isEditing = editingDatum === key

                return (
                  <div
                    key={key}
                    className={`overflow-hidden rounded-lg border bg-slate-50 ${
                      isEditing ? 'border-brand-blue' : 'border-slate-200'
                    } ${isPast ? 'opacity-50' : ''}`}
                  >
                    <button
                      type="button"
                      disabled={isPast || isLocked}
                      onClick={() => openEditor(key, entry)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left disabled:cursor-not-allowed"
                    >
                      <div>
                        <p className="font-medium capitalize text-slate-800">
                          {dag.toLocaleDateString('nl-NL', { weekday: 'long' })}{' '}
                          <span className="font-normal text-slate-500">
                            {dag.getDate()} {dag.toLocaleDateString('nl-NL', { month: 'short' })}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 text-sm text-slate-500">
                          {samenvatting(entry)}
                          {!isInstructeur && entry && entry.type !== 'hele_dag_onbeschikbaar' && (
                            <DisciplineBadge discipline={entry.discipline} />
                          )}
                        </p>
                      </div>
                      {isLocked && (
                        <span className="rounded-full bg-brand-blue-light/40 px-2 py-1 text-xs font-medium text-brand-blue-dark">
                          Ingepland
                        </span>
                      )}
                    </button>

                    {isEditing && (
                      <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-4">
                        <div className="space-y-2">
                          {(Object.keys(TYPE_LABELS) as BeschikbaarheidType[]).map((optie) => (
                            <label key={optie} className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="radio"
                                name={`type-${key}`}
                                value={optie}
                                checked={editType === optie}
                                onChange={() => setEditType(optie)}
                              />
                              {TYPE_LABELS[optie]}
                            </label>
                          ))}
                        </div>

                        {editType === 'tijdvak' && (
                          <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">Van</span>
                              <select
                                value={editStart}
                                onChange={(e) => handleStartChange(e.target.value)}
                                className="input"
                              >
                                {TIJD_OPTIES.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-sm font-medium text-slate-700">Tot</span>
                              <select
                                value={editEind}
                                onChange={(e) => setEditEind(e.target.value)}
                                className="input"
                              >
                                {eindOpties.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}

                        {!isInstructeur && editType !== 'hele_dag_onbeschikbaar' && (
                          <div className="space-y-3 border-t border-slate-100 pt-3">
                            <div className="space-y-2">
                              {(Object.keys(SOORT_LABELS) as LesSoort[]).map((optie) => (
                                <label key={optie} className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                    type="radio"
                                    name={`soort-${key}`}
                                    value={optie}
                                    checked={editSoort === optie}
                                    onChange={() => setEditSoort(optie)}
                                  />
                                  {SOORT_LABELS[optie]}
                                </label>
                              ))}
                            </div>

                            {editSoort === 'duo_cursus' && (
                              <div className="space-y-3 rounded-md bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-700">Gegevens tweede persoon</p>
                                {eigenTweedePersoon && (
                                  <p className="text-xs text-slate-500">
                                    Onthouden van je vaste duo-partner. Pas aan indien nodig.
                                  </p>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="block">
                                    <span className="mb-1 block text-sm text-slate-700">Voornaam *</span>
                                    <input
                                      required
                                      type="text"
                                      value={editTweedePersoon.voornaam}
                                      onChange={(e) => tweedePersoonVeldWijzig('voornaam', e.target.value)}
                                      className="input"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="mb-1 block text-sm text-slate-700">Achternaam *</span>
                                    <input
                                      required
                                      type="text"
                                      value={editTweedePersoon.achternaam}
                                      onChange={(e) => tweedePersoonVeldWijzig('achternaam', e.target.value)}
                                      className="input"
                                    />
                                  </label>
                                </div>
                                <label className="block">
                                  <span className="mb-1 block text-sm text-slate-700">E-mailadres *</span>
                                  <input
                                    required
                                    type="email"
                                    value={editTweedePersoon.email}
                                    onChange={(e) => tweedePersoonVeldWijzig('email', e.target.value)}
                                    className="input"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-sm text-slate-700">Telefoonnummer</span>
                                  <input
                                    type="tel"
                                    value={editTweedePersoon.telefoonnummer}
                                    onChange={(e) => tweedePersoonVeldWijzig('telefoonnummer', e.target.value)}
                                    className="input"
                                  />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="block">
                                    <span className="mb-1 block text-sm text-slate-700">Geboortedatum *</span>
                                    <input
                                      required
                                      type="date"
                                      value={editTweedePersoon.geboortedatum}
                                      onChange={(e) => tweedePersoonVeldWijzig('geboortedatum', e.target.value)}
                                      className="input"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="mb-1 block text-sm text-slate-700">Geboorteplaats *</span>
                                    <input
                                      required
                                      type="text"
                                      value={editTweedePersoon.geboorteplaats}
                                      onChange={(e) => tweedePersoonVeldWijzig('geboorteplaats', e.target.value)}
                                      className="input"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSave(key)}
                            className="btn-primary"
                          >
                            {submitting ? 'Bezig...' : 'Opslaan'}
                          </button>
                          {entry && (
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleClear(key)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Wissen
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingDatum(null)}
                            className="ml-auto text-sm text-slate-500 hover:underline"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
