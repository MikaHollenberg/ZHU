import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MINIMALE_TIJDVAK_MINUTEN, TIJD_OPTIES, tijdNaarMinuten } from '../../lib/tijd'
import { getWeekDagen, isoWeekNumber, startOfWeek, toDateKey } from '../../lib/kalender'
import { STATUS_LABELS } from '../../lib/lesStatus'
import { DISCIPLINE_BADGE_CLASSES, DISCIPLINE_LABELS, DISCIPLINES } from '../../lib/disciplines'
import type { Discipline } from '../../lib/disciplines'
import { DisciplineBadge } from '../../components/DisciplineBadge'
import type { Beschikbaarheid, BeschikbaarheidType, LesSoort } from '../../types/availability'
import type { Label, Les } from '../../types/lesson'
import type { Profile } from '../../types/profile'
import { LEEG_TWEEDE_PERSOON } from '../../types/tweedePersoon'
import type { TweedePersoon, TweedePersoonInvoer } from '../../types/tweedePersoon'

interface LesMetLabel extends Les {
  label: { naam: string } | null
}

const BESCHIKBAAR_LABELS: Record<BeschikbaarheidType, string> = {
  hele_dag_beschikbaar: 'Hele dag beschikbaar',
  hele_dag_onbeschikbaar: 'Hele dag onbeschikbaar',
  tijdvak: 'Tijdvak',
}

const SOORT_LABELS: Record<LesSoort, string> = {
  priveles: 'Privéles (1 persoon)',
  duo_cursus: 'Duo-cursus (2 personen)',
}

const DAG_NAMEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

interface CelSelectie {
  cursist: Profile
  datum: string
  beschikbaarheid: Beschikbaarheid | null
  les: LesMetLabel | null
}

function TijdSelect({
  label,
  value,
  onChange,
  opties = TIJD_OPTIES,
}: {
  label: string
  value: string
  onChange: (waarde: string) => void
  opties?: string[]
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {opties.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  )
}

function LabelSelect({
  labels,
  contextType,
  value,
  onChange,
}: {
  labels: Label[]
  contextType: 'verzetten' | 'annuleren'
  value: string
  onChange: (waarde: string) => void
}) {
  const opties = labels.filter((l) => l.type === contextType || l.type === 'beide')
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">Reden</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">Kies een reden...</option>
        {opties.map((l) => (
          <option key={l.id} value={l.id}>
            {l.naam}
          </option>
        ))}
      </select>
    </label>
  )
}

function TweedePersoonFormulier({
  waarde,
  onChange,
}: {
  waarde: TweedePersoonInvoer
  onChange: (veld: keyof TweedePersoonInvoer, waarde: string) => void
}) {
  return (
    <div className="space-y-3 rounded-md bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-700">Gegevens tweede persoon</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Voornaam *</span>
          <input
            required
            type="text"
            value={waarde.voornaam}
            onChange={(e) => onChange('voornaam', e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Achternaam *</span>
          <input
            required
            type="text"
            value={waarde.achternaam}
            onChange={(e) => onChange('achternaam', e.target.value)}
            className="input"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">E-mailadres *</span>
        <input
          required
          type="email"
          value={waarde.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="input"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Telefoonnummer</span>
        <input
          type="tel"
          value={waarde.telefoonnummer}
          onChange={(e) => onChange('telefoonnummer', e.target.value)}
          className="input"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Geboortedatum *</span>
          <input
            required
            type="date"
            value={waarde.geboortedatum}
            onChange={(e) => onChange('geboortedatum', e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Geboorteplaats *</span>
          <input
            required
            type="text"
            value={waarde.geboorteplaats}
            onChange={(e) => onChange('geboorteplaats', e.target.value)}
            className="input"
          />
        </label>
      </div>
    </div>
  )
}

function CelPaneel({
  selectie,
  labels,
  tweedePersonen,
  tweedePersoonPerBoeker,
  instructeurs,
  onClose,
  onChanged,
}: {
  selectie: CelSelectie
  labels: Label[]
  tweedePersonen: Record<string, TweedePersoon>
  tweedePersoonPerBoeker: Record<string, TweedePersoon>
  instructeurs: Profile[]
  onClose: () => void
  onChanged: () => void
}) {
  const { cursist, datum, beschikbaarheid, les } = selectie
  const [modus, setModus] = useState<'bekijken' | 'inplannen' | 'verzetten' | 'annuleren'>(
    les ? 'bekijken' : 'inplannen',
  )
  const [start, setStart] = useState(
    beschikbaarheid?.type === 'tijdvak' ? (beschikbaarheid.starttijd?.slice(0, 5) ?? '17:00') : '17:00',
  )
  const [eind, setEind] = useState(
    beschikbaarheid?.type === 'tijdvak' ? (beschikbaarheid.eindtijd?.slice(0, 5) ?? '19:00') : '19:00',
  )
  const [nieuweDatum, setNieuweDatum] = useState(datum)
  const [labelId, setLabelId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructeurKeuze, setInstructeurKeuze] = useState(les?.instructeur_id ?? '')
  const [instructeurOpslaan, setInstructeurOpslaan] = useState(false)
  const [planDiscipline, setPlanDiscipline] = useState<Discipline>(beschikbaarheid?.discipline ?? 'polyvalk')
  const [lesDiscipline, setLesDiscipline] = useState<Discipline>(les?.discipline ?? 'polyvalk')
  const [disciplineOpslaan, setDisciplineOpslaan] = useState(false)

  const beschikbaarheidDuo = beschikbaarheid?.soort === 'duo_cursus' ? beschikbaarheid : null
  const opgeslagenPartner = tweedePersoonPerBoeker[cursist.id] ?? null
  const [planSoort, setPlanSoort] = useState<LesSoort>(beschikbaarheidDuo ? 'duo_cursus' : 'priveles')
  const [planTweedePersoon, setPlanTweedePersoon] = useState<TweedePersoonInvoer>(
    opgeslagenPartner
      ? {
          voornaam: opgeslagenPartner.voornaam,
          achternaam: opgeslagenPartner.achternaam,
          email: opgeslagenPartner.email,
          telefoonnummer: opgeslagenPartner.telefoonnummer ?? '',
          geboortedatum: opgeslagenPartner.geboortedatum ?? '',
          geboorteplaats: opgeslagenPartner.geboorteplaats ?? '',
        }
      : LEEG_TWEEDE_PERSOON,
  )

  const eindOpties = TIJD_OPTIES.filter(
    (t) => tijdNaarMinuten(t) - tijdNaarMinuten(start) >= MINIMALE_TIJDVAK_MINUTEN,
  )

  const handleStartChange = (waarde: string) => {
    setStart(waarde)
    if (tijdNaarMinuten(eind) - tijdNaarMinuten(waarde) < MINIMALE_TIJDVAK_MINUTEN) {
      const eersteGeldige = TIJD_OPTIES.find(
        (t) => tijdNaarMinuten(t) - tijdNaarMinuten(waarde) >= MINIMALE_TIJDVAK_MINUTEN,
      )
      if (eersteGeldige) setEind(eersteGeldige)
    }
  }

  const formattedDatum = new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const planTweedePersoonVeldWijzig = (veld: keyof TweedePersoonInvoer, waarde: string) => {
    setPlanTweedePersoon((prev) => ({ ...prev, [veld]: waarde }))
  }

  const lesTweedePersoon = les?.tweede_persoon_id ? tweedePersonen[les.tweede_persoon_id] : null
  const beschikbaarheidTweedePersoon = beschikbaarheidDuo?.tweede_persoon_id
    ? tweedePersonen[beschikbaarheidDuo.tweede_persoon_id]
    : null

  const handleInplannen = async () => {
    if (tijdNaarMinuten(eind) - tijdNaarMinuten(start) < MINIMALE_TIJDVAK_MINUTEN) {
      setError('Een les moet minimaal 2 uur duren.')
      return
    }

    let tweedePersoonId: string | null = null

    if (beschikbaarheidDuo) {
      tweedePersoonId = beschikbaarheidDuo.tweede_persoon_id
    } else if (planSoort === 'duo_cursus') {
      const { voornaam, achternaam, email, geboortedatum, geboorteplaats } = planTweedePersoon
      if (!voornaam.trim() || !achternaam.trim() || !email.trim() || !geboortedatum || !geboorteplaats.trim()) {
        setError('Vul alle gegevens van de tweede persoon in.')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    if (!beschikbaarheidDuo && planSoort === 'duo_cursus') {
      const { data: persoon, error: persoonError } = await supabase
        .from('tweede_persoon')
        .upsert(
          {
            boeker_id: cursist.id,
            voornaam: planTweedePersoon.voornaam.trim(),
            achternaam: planTweedePersoon.achternaam.trim(),
            email: planTweedePersoon.email.trim(),
            telefoonnummer: planTweedePersoon.telefoonnummer.trim() || null,
            geboortedatum: planTweedePersoon.geboortedatum || null,
            geboorteplaats: planTweedePersoon.geboorteplaats.trim() || null,
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
    }

    const soort = beschikbaarheidDuo ? 'duo_cursus' : planSoort
    const discipline = beschikbaarheid ? beschikbaarheid.discipline : planDiscipline

    const { error: rpcError } = await supabase.rpc('plan_les', {
      p_cursist_id: cursist.id,
      p_datum: datum,
      p_starttijd: start,
      p_eindtijd: eind,
      p_beschikbaarheid_id:
        beschikbaarheid && beschikbaarheid.type !== 'hele_dag_onbeschikbaar' ? beschikbaarheid.id : null,
      p_soort: soort,
      p_tweede_persoon_id: tweedePersoonId,
      p_discipline: discipline,
    })
    setSubmitting(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onChanged()
  }

  const handleVerzetten = async () => {
    if (!les) return
    if (tijdNaarMinuten(eind) - tijdNaarMinuten(start) < MINIMALE_TIJDVAK_MINUTEN) {
      setError('Een les moet minimaal 2 uur duren.')
      return
    }
    if (!labelId) {
      setError('Kies een reden.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('verzet_les', {
      p_les_id: les.id,
      p_nieuwe_datum: nieuweDatum,
      p_nieuwe_starttijd: start,
      p_nieuwe_eindtijd: eind,
      p_label_id: labelId,
    })
    setSubmitting(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onChanged()
  }

  const handleAnnuleren = async () => {
    if (!les) return
    if (!labelId) {
      setError('Kies een reden.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('annuleer_les', {
      p_les_id: les.id,
      p_label_id: labelId,
    })
    setSubmitting(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onChanged()
  }

  const handleInstructeurOpslaan = async () => {
    if (!les) return
    setInstructeurOpslaan(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('lessen')
      .update({ instructeur_id: instructeurKeuze || null })
      .eq('id', les.id)
    setInstructeurOpslaan(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onChanged()
  }

  const handleDisciplineOpslaan = async () => {
    if (!les) return
    setDisciplineOpslaan(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('lessen')
      .update({ discipline: lesDiscipline })
      .eq('id', les.id)
    setDisciplineOpslaan(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onChanged()
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
              {cursist.voornaam} {cursist.achternaam}
            </p>
            <p className="text-sm capitalize text-slate-500">{formattedDatum}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {les && modus === 'bekijken' && (
          <div>
            <p className="mb-1 text-sm text-slate-600">
              {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} ({STATUS_LABELS[les.status]})
            </p>
            <p className="mb-2 text-sm text-slate-600">
              {les.soort === 'duo_cursus'
                ? `Duo-cursus${lesTweedePersoon ? ` met ${lesTweedePersoon.voornaam} ${lesTweedePersoon.achternaam}` : ''}`
                : 'Privéles'}
            </p>
            {les.label && <p className="mb-3 text-sm text-slate-500">Reden: {les.label.naam}</p>}

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Discipline</span>
              <div className="flex items-center gap-2">
                <select
                  value={lesDiscipline}
                  onChange={(e) => setLesDiscipline(e.target.value as Discipline)}
                  className="input"
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {DISCIPLINE_LABELS[d]}
                    </option>
                  ))}
                </select>
                <DisciplineBadge discipline={les.discipline} />
                <button
                  type="button"
                  disabled={disciplineOpslaan || lesDiscipline === les.discipline}
                  onClick={handleDisciplineOpslaan}
                  className="btn-accent whitespace-nowrap"
                >
                  {disciplineOpslaan ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Instructeur</span>
              <div className="flex gap-2">
                <select
                  value={instructeurKeuze}
                  onChange={(e) => setInstructeurKeuze(e.target.value)}
                  className="input"
                >
                  <option value="">Geen instructeur gekoppeld</option>
                  {instructeurs.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.voornaam} {i.achternaam}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={instructeurOpslaan || instructeurKeuze === (les.instructeur_id ?? '')}
                  onClick={handleInstructeurOpslaan}
                  className="btn-accent whitespace-nowrap"
                >
                  {instructeurOpslaan ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </label>

            {les.status === 'gepland' && (
              <div className="flex gap-3">
                <button type="button" className="btn-primary" onClick={() => setModus('verzetten')}>
                  Verzetten
                </button>
                <button type="button" className="btn-accent" onClick={() => setModus('annuleren')}>
                  Annuleren
                </button>
              </div>
            )}
          </div>
        )}

        {modus === 'inplannen' && (
          <div className="space-y-3">
            {beschikbaarheid && (
              <p className="text-sm text-slate-500">
                Opgegeven beschikbaarheid:{' '}
                {beschikbaarheid.type === 'tijdvak'
                  ? `${beschikbaarheid.starttijd?.slice(0, 5)} - ${beschikbaarheid.eindtijd?.slice(0, 5)}`
                  : BESCHIKBAAR_LABELS[beschikbaarheid.type]}
              </p>
            )}

            {beschikbaarheid ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                Discipline: <DisciplineBadge discipline={beschikbaarheid.discipline} />
              </p>
            ) : (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Discipline</span>
                <select
                  value={planDiscipline}
                  onChange={(e) => setPlanDiscipline(e.target.value as Discipline)}
                  className="input"
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {DISCIPLINE_LABELS[d]}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-2 gap-4">
              <TijdSelect label="Van" value={start} onChange={handleStartChange} />
              <TijdSelect label="Tot" value={eind} onChange={setEind} opties={eindOpties} />
            </div>

            {beschikbaarheidDuo ? (
              <p className="rounded-md bg-brand-blue-light/20 px-3 py-2 text-sm text-brand-blue-dark">
                Duo-cursus, opgegeven met{' '}
                {beschikbaarheidTweedePersoon
                  ? `${beschikbaarheidTweedePersoon.voornaam} ${beschikbaarheidTweedePersoon.achternaam}`
                  : 'een tweede persoon'}
              </p>
            ) : (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="space-y-2">
                  {(Object.keys(SOORT_LABELS) as LesSoort[]).map((optie) => (
                    <label key={optie} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="plan-soort"
                        value={optie}
                        checked={planSoort === optie}
                        onChange={() => setPlanSoort(optie)}
                      />
                      {SOORT_LABELS[optie]}
                    </label>
                  ))}
                </div>
                {planSoort === 'duo_cursus' && (
                  <>
                    {opgeslagenPartner && (
                      <p className="text-xs text-slate-500">
                        Vaste duo-partner van deze cursist, onthouden van een eerdere keer. Pas aan indien nodig.
                      </p>
                    )}
                    <TweedePersoonFormulier waarde={planTweedePersoon} onChange={planTweedePersoonVeldWijzig} />
                  </>
                )}
              </div>
            )}

            <button type="button" disabled={submitting} onClick={handleInplannen} className="btn-primary">
              {submitting ? 'Bezig...' : 'Inplannen'}
            </button>
          </div>
        )}

        {modus === 'verzetten' && les && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Nieuwe datum</span>
              <input
                type="date"
                value={nieuweDatum}
                onChange={(e) => setNieuweDatum(e.target.value)}
                className="input"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <TijdSelect label="Van" value={start} onChange={handleStartChange} />
              <TijdSelect label="Tot" value={eind} onChange={setEind} opties={eindOpties} />
            </div>
            <LabelSelect labels={labels} contextType="verzetten" value={labelId} onChange={setLabelId} />
            <div className="flex gap-3">
              <button type="button" disabled={submitting} onClick={handleVerzetten} className="btn-primary">
                {submitting ? 'Bezig...' : 'Bevestig verzetten'}
              </button>
              <button
                type="button"
                onClick={() => setModus('bekijken')}
                className="text-sm text-slate-500 hover:underline"
              >
                Terug
              </button>
            </div>
          </div>
        )}

        {modus === 'annuleren' && les && (
          <div className="space-y-3">
            <LabelSelect labels={labels} contextType="annuleren" value={labelId} onChange={setLabelId} />
            <div className="flex gap-3">
              <button type="button" disabled={submitting} onClick={handleAnnuleren} className="btn-accent">
                {submitting ? 'Bezig...' : 'Bevestig annuleren'}
              </button>
              <button
                type="button"
                onClick={() => setModus('bekijken')}
                className="text-sm text-slate-500 hover:underline"
              >
                Terug
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface InstructeurCelSelectie {
  instructeur: Profile
  datum: string
  beschikbaarheid: Beschikbaarheid | null
  les: LesMetLabel | null
}

function InstructeurCelPaneel({
  selectie,
  cursistenById,
  onClose,
  onChanged,
}: {
  selectie: InstructeurCelSelectie
  cursistenById: Record<string, Profile>
  onClose: () => void
  onChanged: () => void
}) {
  const { instructeur, datum, beschikbaarheid, les } = selectie
  const [discipline, setDiscipline] = useState<Discipline>(les?.discipline ?? beschikbaarheid?.discipline ?? 'polyvalk')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formattedDatum = new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const cursistNaam = les ? cursistenById[les.cursist_id] : null

  const handleDisciplineOpslaan = async () => {
    if (!les) return
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase.from('lessen').update({ discipline }).eq('id', les.id)
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onChanged()
  }

  const handleLoskoppelen = async () => {
    if (!les) return
    setSubmitting(true)
    setError(null)
    const { error: updateError } = await supabase.from('lessen').update({ instructeur_id: null }).eq('id', les.id)
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onChanged()
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
              {instructeur.voornaam} {instructeur.achternaam}
            </p>
            <p className="text-sm capitalize text-slate-500">{formattedDatum}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {les ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} ({STATUS_LABELS[les.status]})
            </p>
            <p className="text-sm text-slate-600">
              Cursist: {cursistNaam ? `${cursistNaam.voornaam} ${cursistNaam.achternaam}` : 'Onbekend'}
            </p>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Discipline</span>
              <div className="flex items-center gap-2">
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as Discipline)}
                  className="input"
                >
                  {DISCIPLINES.map((d) => (
                    <option key={d} value={d}>
                      {DISCIPLINE_LABELS[d]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={submitting || discipline === les.discipline}
                  onClick={handleDisciplineOpslaan}
                  className="btn-accent whitespace-nowrap"
                >
                  Opslaan
                </button>
              </div>
            </label>

            {les.status === 'gepland' && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleLoskoppelen}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Instructeur loskoppelen
              </button>
            )}
          </div>
        ) : beschikbaarheid ? (
          <p className="text-sm text-slate-600">
            Opgegeven beschikbaarheid:{' '}
            {beschikbaarheid.type === 'tijdvak'
              ? `${beschikbaarheid.starttijd?.slice(0, 5)} - ${beschikbaarheid.eindtijd?.slice(0, 5)}`
              : BESCHIKBAAR_LABELS[beschikbaarheid.type]}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Geen beschikbaarheid opgegeven.</p>
        )}
      </div>
    </div>
  )
}

export function AdminBeschikbaarheid() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [cursisten, setCursisten] = useState<Profile[]>([])
  const [instructeurs, setInstructeurs] = useState<Profile[]>([])
  const [beschikbaarheid, setBeschikbaarheid] = useState<Beschikbaarheid[]>([])
  const [lessen, setLessen] = useState<LesMetLabel[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [tweedePersonen, setTweedePersonen] = useState<Record<string, TweedePersoon>>({})
  const [tweedePersoonPerBoeker, setTweedePersoonPerBoeker] = useState<Record<string, TweedePersoon>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectie, setSelectie] = useState<CelSelectie | null>(null)
  const [instructeurSelectie, setInstructeurSelectie] = useState<InstructeurCelSelectie | null>(null)
  const [zoekterm, setZoekterm] = useState('')
  const [instructeurZoekterm, setInstructeurZoekterm] = useState('')

  const dagen = useMemo(() => getWeekDagen(weekStart), [weekStart])
  const weekNummer = useMemo(() => isoWeekNumber(weekStart), [weekStart])

  const gefilterdeCursisten = useMemo(() => {
    const term = zoekterm.trim().toLowerCase()
    if (!term) return cursisten
    return cursisten.filter((c) => `${c.voornaam} ${c.achternaam}`.toLowerCase().includes(term))
  }, [cursisten, zoekterm])

  const gefilterdeInstructeurs = useMemo(() => {
    const term = instructeurZoekterm.trim().toLowerCase()
    if (!term) return instructeurs
    return instructeurs.filter((i) => `${i.voornaam} ${i.achternaam}`.toLowerCase().includes(term))
  }, [instructeurs, instructeurZoekterm])

  const cursistenById = useMemo(() => {
    const map: Record<string, Profile> = {}
    for (const c of cursisten) map[c.id] = c
    return map
  }, [cursisten])

  const load = async () => {
    setLoading(true)
    setError(null)
    const eerste = toDateKey(dagen[0])
    const laatste = toDateKey(dagen[6])

    const [cursistenRes, instructeurRes, beschikbaarheidRes, lessenRes, labelsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('rol', 'cursist')
        .eq('gearchiveerd', false)
        .order('achternaam', { ascending: true }),
      supabase
        .from('profiles')
        .select('*')
        .eq('rol', 'instructeur')
        .eq('gearchiveerd', false)
        .order('achternaam', { ascending: true }),
      supabase.from('beschikbaarheid').select('*').gte('datum', eerste).lte('datum', laatste),
      supabase.from('lessen').select('*, label:labels(naam)').gte('datum', eerste).lte('datum', laatste),
      supabase.from('labels').select('*'),
    ])

    if (cursistenRes.error) setError(cursistenRes.error.message)
    setCursisten(cursistenRes.data ?? [])
    setInstructeurs(instructeurRes.data ?? [])
    setBeschikbaarheid(beschikbaarheidRes.data ?? [])
    setLessen((lessenRes.data ?? []) as unknown as LesMetLabel[])
    setLabels(labelsRes.data ?? [])

    const cursistIds = (cursistenRes.data ?? []).map((c) => c.id)
    if (cursistIds.length > 0) {
      const { data: personen } = await supabase.from('tweede_persoon').select('*').in('boeker_id', cursistIds)
      const byId: Record<string, TweedePersoon> = {}
      const byBoeker: Record<string, TweedePersoon> = {}
      for (const p of personen ?? []) {
        byId[p.id] = p
        byBoeker[p.boeker_id] = p
      }
      setTweedePersonen(byId)
      setTweedePersoonPerBoeker(byBoeker)
    } else {
      setTweedePersonen({})
      setTweedePersoonPerBoeker({})
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const shiftWeek = (delta: number) => {
    setSelectie(null)
    setInstructeurSelectie(null)
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  const vindBeschikbaarheid = (cursistId: string, datum: string) =>
    beschikbaarheid.find((b) => b.cursist_id === cursistId && b.datum === datum) ?? null

  const vindLes = (cursistId: string, datum: string) =>
    lessen.find((l) => l.cursist_id === cursistId && l.datum === datum) ?? null

  const openCel = (cursist: Profile, datum: string) => {
    setError(null)
    setSelectie({
      cursist,
      datum,
      beschikbaarheid: vindBeschikbaarheid(cursist.id, datum),
      les: vindLes(cursist.id, datum),
    })
  }

  const vindLesVoorInstructeur = (instructeurId: string, datum: string) =>
    lessen.find((l) => l.instructeur_id === instructeurId && l.datum === datum) ?? null

  const openInstructeurCel = (instructeur: Profile, datum: string) => {
    setError(null)
    setInstructeurSelectie({
      instructeur,
      datum,
      beschikbaarheid: vindBeschikbaarheid(instructeur.id, datum),
      les: vindLesVoorInstructeur(instructeur.id, datum),
    })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Rooster</h1>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="rounded-full px-3 py-1 text-xl text-brand-blue hover:bg-brand-blue-light/20"
        >
          ‹
        </button>
        <span className="text-lg font-semibold text-slate-800">
          Week {weekNummer}, {dagen[0].getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="rounded-full px-3 py-1 text-xl text-brand-blue hover:bg-brand-blue-light/20"
        >
          ›
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        <>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Beschikbaarheid van cursisten</h2>

        <input
          type="text"
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          placeholder="Zoek op naam van cursist..."
          className="input mb-4 max-w-sm"
        />

        <div className="mb-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="sticky left-0 z-10 min-w-[160px] bg-slate-50 px-3 py-2 text-left">Cursist</th>
                {dagen.map((dag, i) => (
                  <th key={i} className="min-w-[120px] px-2 py-2 text-left">
                    <div className="uppercase">{DAG_NAMEN[i]}</div>
                    <div className="font-normal text-slate-400">
                      {dag.getDate()} {dag.toLocaleDateString('nl-NL', { month: 'short' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gefilterdeCursisten.map((cursist) => (
                <tr key={cursist.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-800">
                    {cursist.voornaam} {cursist.achternaam}
                  </td>
                  {dagen.map((dag) => {
                    const datum = toDateKey(dag)
                    const b = vindBeschikbaarheid(cursist.id, datum)
                    const l = vindLes(cursist.id, datum)
                    return (
                      <td
                        key={datum}
                        onClick={() => openCel(cursist, datum)}
                        className="cursor-pointer px-2 py-2 align-top hover:bg-brand-blue-light/10"
                      >
                        {l ? (
                          <div
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              l.status === 'gepland'
                                ? DISCIPLINE_BADGE_CLASSES[l.discipline]
                                : l.status === 'verzet'
                                  ? 'bg-brand-yellow/60 text-brand-blue-dark line-through'
                                  : 'bg-red-100 text-red-700 line-through'
                            }`}
                          >
                            <div>
                              {l.starttijd.slice(0, 5)}-{l.eindtijd.slice(0, 5)}
                              {l.soort === 'duo_cursus' && ' (Duo)'}
                            </div>
                            <div className="text-[10px] opacity-90">{DISCIPLINE_LABELS[l.discipline]}</div>
                          </div>
                        ) : b ? (
                          <span
                            className={`text-xs font-medium ${
                              b.type === 'hele_dag_onbeschikbaar' ? 'text-red-500' : 'text-green-600'
                            }`}
                          >
                            {b.type === 'tijdvak'
                              ? `${b.starttijd?.slice(0, 5)}-${b.eindtijd?.slice(0, 5)}`
                              : BESCHIKBAAR_LABELS[b.type]}
                            {b.soort === 'duo_cursus' && ' (Duo)'}
                            {b.type !== 'hele_dag_onbeschikbaar' && (
                              <>
                                <br />
                                {DISCIPLINE_LABELS[b.discipline]}
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">–</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {gefilterdeCursisten.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    {cursisten.length === 0 ? 'Nog geen cursisten aangemeld.' : 'Geen cursisten gevonden.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 text-lg font-semibold text-slate-800">Beschikbaarheid van instructeurs</h2>

        <input
          type="text"
          value={instructeurZoekterm}
          onChange={(e) => setInstructeurZoekterm(e.target.value)}
          placeholder="Zoek op naam van instructeur..."
          className="input mb-4 max-w-sm"
        />

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="sticky left-0 z-10 min-w-[160px] bg-slate-50 px-3 py-2 text-left">Instructeur</th>
                {dagen.map((dag, i) => (
                  <th key={i} className="min-w-[120px] px-2 py-2 text-left">
                    <div className="uppercase">{DAG_NAMEN[i]}</div>
                    <div className="font-normal text-slate-400">
                      {dag.getDate()} {dag.toLocaleDateString('nl-NL', { month: 'short' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gefilterdeInstructeurs.map((instructeur) => (
                <tr key={instructeur.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-800">
                    {instructeur.voornaam} {instructeur.achternaam}
                  </td>
                  {dagen.map((dag) => {
                    const datum = toDateKey(dag)
                    const b = vindBeschikbaarheid(instructeur.id, datum)
                    const l = vindLesVoorInstructeur(instructeur.id, datum)
                    return (
                      <td
                        key={datum}
                        onClick={() => openInstructeurCel(instructeur, datum)}
                        className="cursor-pointer px-2 py-2 align-top hover:bg-brand-blue-light/10"
                      >
                        {l ? (
                          <div
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              l.status === 'gepland'
                                ? DISCIPLINE_BADGE_CLASSES[l.discipline]
                                : l.status === 'verzet'
                                  ? 'bg-brand-yellow/60 text-brand-blue-dark line-through'
                                  : 'bg-red-100 text-red-700 line-through'
                            }`}
                          >
                            <div>
                              {l.starttijd.slice(0, 5)}-{l.eindtijd.slice(0, 5)}
                            </div>
                            <div className="text-[10px] opacity-90">{DISCIPLINE_LABELS[l.discipline]}</div>
                          </div>
                        ) : b ? (
                          <span
                            className={`text-xs font-medium ${
                              b.type === 'hele_dag_onbeschikbaar' ? 'text-red-500' : 'text-green-600'
                            }`}
                          >
                            {b.type === 'tijdvak'
                              ? `${b.starttijd?.slice(0, 5)}-${b.eindtijd?.slice(0, 5)}`
                              : BESCHIKBAAR_LABELS[b.type]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">–</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {gefilterdeInstructeurs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    {instructeurs.length === 0 ? 'Nog geen instructeurs aangesteld.' : 'Geen instructeurs gevonden.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {instructeurSelectie && (
        <InstructeurCelPaneel
          selectie={instructeurSelectie}
          cursistenById={cursistenById}
          onClose={() => setInstructeurSelectie(null)}
          onChanged={async () => {
            await load()
            setInstructeurSelectie(null)
          }}
        />
      )}

      {selectie && (
        <CelPaneel
          selectie={selectie}
          labels={labels}
          tweedePersonen={tweedePersonen}
          tweedePersoonPerBoeker={tweedePersoonPerBoeker}
          instructeurs={instructeurs}
          onClose={() => setSelectie(null)}
          onChanged={async () => {
            await load()
            setSelectie(null)
          }}
        />
      )}
    </div>
  )
}
