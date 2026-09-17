import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MINIMALE_TIJDVAK_MINUTEN, TIJD_OPTIES, tijdNaarMinuten } from '../lib/tijd'
import { getMaandWeken, toDateKey } from '../lib/kalender'
import { DISCIPLINE_LABELS, DISCIPLINES } from '../lib/disciplines'
import type { Discipline } from '../lib/disciplines'
import { DUO_CURSUS_TYPE_LABELS, DUO_CURSUS_TYPES } from '../lib/duoCursusType'
import type { DuoCursusType } from '../lib/duoCursusType'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { CalendarIcon, CalendarPlusIcon, CheckIcon, ChevronRightIcon, CompassIcon, UsersIcon } from '../components/icons'
import { Loader } from '../components/Loader'
import { OnboardingTour } from '../components/OnboardingTour'
import type { TourStep } from '../components/OnboardingTour'
import type { Beschikbaarheid, BeschikbaarheidType, LesSoort } from '../types/availability'
import { LEEG_TWEEDE_PERSOON } from '../types/tweedePersoon'
import type { TweedePersoon, TweedePersoonInvoer } from '../types/tweedePersoon'

const TOUR_OPGESLAGEN_KEY = 'zhu_tour_beschikbaarheid_v1'

function bouwTourStappen({ isInstructeur, metDuoStap }: { isInstructeur: boolean; metDuoStap: boolean }): TourStep[] {
  const stappen: TourStep[] = [
    {
      title: 'Welkom bij Beschikbaarheid',
      body: isInstructeur
        ? 'Hier geef je door op welke dagen je kunt lesgeven. We lopen in een paar korte stapjes samen door deze pagina — dat duurt ongeveer een halve minuut.'
        : 'Hier geef je door op welke dagen je kunt zeilen. Wij plannen daarna zelf een les voor je in. We lopen in een paar korte stapjes samen door deze pagina — dat duurt ongeveer een minuut.',
      icon: CompassIcon,
    },
  ]

  if (!isInstructeur) {
    stappen.push(
      {
        title: 'Kies jouw discipline',
        body: 'Kies hier welke vorm van zeilen je wilt doen: Polyvalk, Fox22 of Windsurf. Je stelt dit maar één keer in — het portal onthoudt je keuze voortaan vanzelf. Weet je niet zeker wat het beste bij je past? Neem gerust contact met ons op via info@zeilschooluitgeest.nl, dan adviseren we je graag welke discipline goed bij je past.',
        targetId: 'tour-discipline',
        icon: CompassIcon,
      },
      {
        title: 'Kies jouw lesvorm',
        body: 'Daarna kies je je lesvorm: een privéles (alleen voor jou) of een duo-cursus samen met een vaste partner, in 5 keer 2 uur of een 2-daagse cursus. Ook deze keuze wordt onthouden. Twijfel je tussen privéles en duo-cursus, of tussen de duo-vormen? Bel of mail ons gerust via info@zeilschooluitgeest.nl — we denken graag met je mee.',
        targetId: 'tour-lesvorm',
        icon: UsersIcon,
      },
    )

    if (metDuoStap) {
      stappen.push({
        title: 'Gegevens van je duo-partner',
        body: 'Omdat je voor een duo-cursus hebt gekozen, vul je hier eenmalig de gegevens van je vaste partner in. Dat hoef je maar één keer te doen — het portal gebruikt deze gegevens daarna automatisch bij elke duo-les.',
        targetId: 'tour-duo-partner',
        icon: UsersIcon,
      })
    }
  }

  stappen.push(
    {
      title: 'Geef je dagen door',
      body: isInstructeur
        ? 'Hieronder zie je de komende dagen, per week. Tik op een dag om aan te geven of je die dag de hele dag kunt lesgeven, helemaal niet kunt, of alleen tijdens een bepaald tijdvak (minimaal 2 uur).'
        : 'Hieronder zie je de komende dagen, per week. Tik op een dag om aan te geven of je die dag de hele dag kunt, helemaal niet kunt, of alleen tijdens een bepaald tijdvak (minimaal 2 uur).',
      targetId: 'tour-kalender',
      icon: CalendarIcon,
    },
    {
      title: 'Dat is alles!',
      body: isInstructeur
        ? 'Zodra je dagen hebt doorgegeven, kun je je bij "Lesgeven" aanmelden voor openstaande lessen op die dagen. Twijfel je later nog ergens over? Klik dan bovenaan op "Rondleiding opnieuw starten".'
        : 'Zodra je dagen hebt doorgegeven, plant de zeilschool daar een les voor je in. Je ziet die les daarna terug bij "Mijn lessen". Twijfel je later nog ergens over? Klik dan bovenaan op "Rondleiding opnieuw starten".',
      icon: CheckIcon,
    },
  )

  return stappen
}

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
  if (entry.soort !== 'duo_cursus') return basis
  const vorm = entry.duo_cursus_type ? ` (${DUO_CURSUS_TYPE_LABELS[entry.duo_cursus_type]})` : ''
  return `${basis} · Duo-cursus${vorm}`
}

function vandaag() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function Availability() {
  const { user, profile, refreshProfile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
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
  const [standaardSoort, setStandaardSoort] = useState<LesSoort>('priveles')
  const [standaardDuoCursusType, setStandaardDuoCursusType] = useState<DuoCursusType>('vijf_keer_twee_uur')
  const [vormOpslaan, setVormOpslaan] = useState(false)
  const [duoPartner, setDuoPartner] = useState<TweedePersoonInvoer>(LEEG_TWEEDE_PERSOON)
  const [duoPartnerOpslaan, setDuoPartnerOpslaan] = useState(false)

  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  const [editingDatum, setEditingDatum] = useState<string | null>(null)
  const [editType, setEditType] = useState<BeschikbaarheidType>('hele_dag_beschikbaar')
  const [editStart, setEditStart] = useState('17:00')
  const [editEind, setEditEind] = useState('19:00')
  const [editSoort, setEditSoort] = useState<LesSoort>('priveles')
  const [editDuoCursusType, setEditDuoCursusType] = useState<DuoCursusType>('vijf_keer_twee_uur')
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

  useEffect(() => {
    setStandaardSoort(profile?.standaard_soort ?? 'priveles')
    setStandaardDuoCursusType(profile?.standaard_duo_cursus_type ?? 'vijf_keer_twee_uur')
  }, [profile?.standaard_soort, profile?.standaard_duo_cursus_type])

  useEffect(() => {
    setDuoPartner(
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
  }, [eigenTweedePersoon])

  const tourSteps = useMemo(
    () => bouwTourStappen({ isInstructeur, metDuoStap: standaardSoort === 'duo_cursus' }),
    [isInstructeur, standaardSoort],
  )

  // Rondleiding automatisch tonen voor wie 'm nog niet heeft gezien — met een korte
  // vertraging zodat de pagina al is opgebouwd voordat de spotlight iets meet.
  useEffect(() => {
    let gezien = true
    try {
      gezien = window.localStorage.getItem(TOUR_OPGESLAGEN_KEY) === '1'
    } catch {
      // localStorage niet beschikbaar (bijv. privénavigatie) — dan geen automatische rondleiding.
      return
    }
    if (gezien) return
    const timer = window.setTimeout(() => setTourOpen(true), 500)
    return () => window.clearTimeout(timer)
  }, [])

  // De "Rondleiding opnieuw starten"-knop in de zijbalk navigeert hierheen met dit
  // signaal in de router-state — werkt dus ook vanaf een andere pagina.
  useEffect(() => {
    const state = location.state as { openTour?: boolean } | null
    if (!state?.openTour) return
    setTourStep(0)
    setTourOpen(true)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const sluitTour = () => {
    setTourOpen(false)
    setTourStep(0)
    try {
      window.localStorage.setItem(TOUR_OPGESLAGEN_KEY, '1')
    } catch {
      // negeren — dan verschijnt de rondleiding een volgende keer opnieuw, niet erg.
    }
  }

  const volgendeTourStap = () => {
    if (tourStep >= tourSteps.length - 1) {
      sluitTour()
      return
    }
    setTourStep((s) => s + 1)
  }

  const vorigeTourStap = () => setTourStep((s) => Math.max(0, s - 1))

  const handleStandaardDisciplineChange = async (waarde: Discipline) => {
    if (!user) return
    setStandaardDiscipline(waarde)
    setDisciplineOpslaan(true)
    await supabase.from('profiles').update({ standaard_discipline: waarde }).eq('id', user.id)
    await refreshProfile()
    setDisciplineOpslaan(false)
  }

  const handleStandaardVormChange = async (waarde: 'priveles' | DuoCursusType) => {
    if (!user) return
    const soort: LesSoort = waarde === 'priveles' ? 'priveles' : 'duo_cursus'
    setStandaardSoort(soort)
    if (waarde !== 'priveles') setStandaardDuoCursusType(waarde)
    setVormOpslaan(true)
    await supabase
      .from('profiles')
      .update({
        standaard_soort: soort,
        ...(waarde !== 'priveles' ? { standaard_duo_cursus_type: waarde } : {}),
      })
      .eq('id', user.id)
    await refreshProfile()
    setVormOpslaan(false)
  }

  const duoPartnerVeldWijzig = (veld: keyof TweedePersoonInvoer, waarde: string) => {
    setDuoPartner((prev) => ({ ...prev, [veld]: waarde }))
  }

  const handleDuoPartnerOpslaan = async () => {
    if (!user) return
    const { voornaam, achternaam, email, geboortedatum, geboorteplaats } = duoPartner
    if (!voornaam.trim() || !achternaam.trim() || !email.trim() || !geboortedatum || !geboorteplaats.trim()) {
      setError('Vul alle gegevens van je duo-partner in.')
      return
    }
    setError(null)
    setDuoPartnerOpslaan(true)
    const { data: persoon, error: persoonError } = await supabase
      .from('tweede_persoon')
      .upsert(
        {
          boeker_id: user.id,
          voornaam: voornaam.trim(),
          achternaam: achternaam.trim(),
          email: email.trim(),
          telefoonnummer: duoPartner.telefoonnummer.trim() || null,
          geboortedatum: geboortedatum || null,
          geboorteplaats: geboorteplaats.trim() || null,
        },
        { onConflict: 'boeker_id' },
      )
      .select()
      .single()
    setDuoPartnerOpslaan(false)
    if (persoonError) {
      setError(persoonError.message)
      return
    }
    setEigenTweedePersoon(persoon)
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
    setEditSoort(entry?.soort ?? standaardSoort)
    setEditDuoCursusType(entry?.duo_cursus_type ?? standaardDuoCursusType)
    setEditDiscipline(entry?.discipline ?? standaardDiscipline)
  }

  const handleSave = async (key: string) => {
    if (!user) return
    if (editType === 'tijdvak' && tijdNaarMinuten(editEind) - tijdNaarMinuten(editStart) < MINIMALE_TIJDVAK_MINUTEN) {
      setError('Een tijdvak moet minimaal 2 uur duren.')
      return
    }

    if (editType !== 'hele_dag_onbeschikbaar' && editSoort === 'duo_cursus' && !eigenTweedePersoon) {
      setError('Vul eerst de gegevens van je duo-partner in bij "Jouw lesvorm" bovenaan.')
      return
    }

    setError(null)
    setSubmitting(true)

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
        tweede_persoon_id: soort === 'duo_cursus' ? (eigenTweedePersoon?.id ?? null) : null,
        discipline: editDiscipline,
        duo_cursus_type: soort === 'duo_cursus' ? editDuoCursusType : null,
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Beschikbaarheid</h1>
      <p className="mb-6 text-sm text-slate-500">Geef door wanneer je kunt, wij plannen de rest in.</p>

      <div className="card mb-5 flex items-center justify-between px-3 py-2.5">
        <button
          type="button"
          onClick={() => shiftMaand(-1)}
          aria-label="Vorige maand"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-brand-blue transition-colors duration-150 hover:bg-brand-blue-light/20 active:scale-95"
        >
          ‹
        </button>
        <span className="text-base font-semibold capitalize text-slate-800">
          {new Date(maand.jaar, maand.maand, 1).toLocaleDateString('nl-NL', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          type="button"
          onClick={() => shiftMaand(1)}
          aria-label="Volgende maand"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-brand-blue transition-colors duration-150 hover:bg-brand-blue-light/20 active:scale-95"
        >
          ›
        </button>
      </div>

      {!isInstructeur && (
        <div className="card mb-5 space-y-4 px-4 py-4">
          <label id="tour-discipline" className="block scroll-mt-4">
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
            <p className="mt-1 text-xs text-slate-500">
              {disciplineOpslaan ? 'Bezig met opslaan...' : 'Wordt onthouden en automatisch gebruikt bij het doorgeven van beschikbaarheid.'}
            </p>
          </label>

          <label id="tour-lesvorm" className="block scroll-mt-4">
            <span className="mb-1 block text-sm font-medium text-slate-700">Jouw lesvorm</span>
            <select
              value={standaardSoort === 'priveles' ? 'priveles' : standaardDuoCursusType}
              onChange={(e) => handleStandaardVormChange(e.target.value as 'priveles' | DuoCursusType)}
              className="input"
            >
              <option value="priveles">{SOORT_LABELS.priveles}</option>
              {DUO_CURSUS_TYPES.map((t) => (
                <option key={t} value={t}>
                  Duo-cursus – {DUO_CURSUS_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {vormOpslaan ? 'Bezig met opslaan...' : 'Wordt onthouden en automatisch gebruikt bij het doorgeven van beschikbaarheid.'}
            </p>
          </label>

          {standaardSoort === 'duo_cursus' && (
            <div id="tour-duo-partner" className="space-y-3 rounded-xl bg-brand-blue-light/10 p-3.5 scroll-mt-4">
              <p className="text-sm font-medium text-slate-700">Gegevens duo-partner</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Voornaam *</span>
                  <input
                    required
                    type="text"
                    value={duoPartner.voornaam}
                    onChange={(e) => duoPartnerVeldWijzig('voornaam', e.target.value)}
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Achternaam *</span>
                  <input
                    required
                    type="text"
                    value={duoPartner.achternaam}
                    onChange={(e) => duoPartnerVeldWijzig('achternaam', e.target.value)}
                    className="input"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-700">E-mailadres *</span>
                <input
                  required
                  type="email"
                  value={duoPartner.email}
                  onChange={(e) => duoPartnerVeldWijzig('email', e.target.value)}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-700">Telefoonnummer</span>
                <input
                  type="tel"
                  value={duoPartner.telefoonnummer}
                  onChange={(e) => duoPartnerVeldWijzig('telefoonnummer', e.target.value)}
                  className="input"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Geboortedatum *</span>
                  <input
                    required
                    type="date"
                    value={duoPartner.geboortedatum}
                    onChange={(e) => duoPartnerVeldWijzig('geboortedatum', e.target.value)}
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm text-slate-700">Geboorteplaats *</span>
                  <input
                    required
                    type="text"
                    value={duoPartner.geboorteplaats}
                    onChange={(e) => duoPartnerVeldWijzig('geboorteplaats', e.target.value)}
                    className="input"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={duoPartnerOpslaan}
                  onClick={handleDuoPartnerOpslaan}
                  className="btn-accent"
                >
                  {duoPartnerOpslaan ? 'Bezig...' : 'Opslaan'}
                </button>
                {eigenTweedePersoon && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <CheckIcon className="h-3.5 w-3.5 text-status-bevestigd" /> Onthouden
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <Loader />
      ) : (
        <div id="tour-kalender" className="scroll-mt-4">
          {weken.map((week) => (
            <div key={week.weekNummer} className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Week {week.weekNummer}
              </p>
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
                      className={`card overflow-hidden ${isEditing ? 'ring-2 ring-brand-blue/40' : ''} ${
                        isPast ? 'opacity-50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        disabled={isPast || isLocked}
                        onClick={() => openEditor(key, entry)}
                        className="group flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 hover:bg-brand-blue-light/10 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <div className="min-w-0">
                          <p className="font-medium capitalize text-slate-800">
                            {dag.toLocaleDateString('nl-NL', { weekday: 'long' })}{' '}
                            <span className="font-normal text-slate-500">
                              {dag.getDate()} {dag.toLocaleDateString('nl-NL', { month: 'short' })}
                            </span>
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
                            {entry ? (
                              <span className="text-slate-500">{samenvatting(entry)}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <CalendarPlusIcon className="h-3.5 w-3.5" /> Nog niets doorgegeven
                              </span>
                            )}
                            {!isInstructeur && entry && entry.type !== 'hele_dag_onbeschikbaar' && (
                              <DisciplineBadge discipline={entry.discipline} />
                            )}
                          </p>
                        </div>
                        {isLocked ? (
                          <span className="badge bg-status-bevestigd-bg text-status-bevestigd">
                            <CheckIcon className="h-3.5 w-3.5" /> Ingepland
                          </span>
                        ) : (
                          !isPast && (
                            <ChevronRightIcon className="h-4 w-4 flex-none text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-blue" />
                          )
                        )}
                      </button>

                      {isEditing && (
                        <div className="space-y-4 border-t border-slate-100 bg-white px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(TYPE_LABELS) as BeschikbaarheidType[]).map((optie) => (
                              <label
                                key={optie}
                                className="cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-150 has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-blue/40"
                              >
                                <input
                                  type="radio"
                                  name={`type-${key}`}
                                  value={optie}
                                  checked={editType === optie}
                                  onChange={() => setEditType(optie)}
                                  className="sr-only"
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
                            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                              Lesvorm: <span className="font-medium text-slate-700">{SOORT_LABELS[editSoort]}</span>
                              {editSoort === 'duo_cursus' && ` (${DUO_CURSUS_TYPE_LABELS[editDuoCursusType]})`}
                              {' — pas dit aan bij "Jouw lesvorm" bovenaan.'}
                            </p>
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
                                className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline"
                              >
                                Wissen
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingDatum(null)}
                              className="ml-auto text-sm text-slate-500 transition-colors hover:text-slate-700 hover:underline"
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
          ))}
        </div>
      )}

      {tourOpen && (
        <OnboardingTour steps={tourSteps} step={tourStep} onNext={volgendeTourStap} onPrev={vorigeTourStap} onSkip={sluitTour} />
      )}
    </div>
  )
}
