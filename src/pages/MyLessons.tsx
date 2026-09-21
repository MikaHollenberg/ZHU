import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS, STATUS_STYLES } from '../lib/lesStatus'
import { lesUren, formatUren } from '../lib/stats'
import { haalHistorischWeer } from '../lib/weer'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { VaardagenKalender } from '../components/VaardagenKalender'
import { CalendarPlusIcon, ChatBubbleIcon, CheckIcon, ClockIcon, XIcon } from '../components/icons'
import { Loader } from '../components/Loader'
import type { Les, LesStatus } from '../types/lesson'

interface LesMetLabel extends Les {
  label: { naam: string } | null
  tweede_persoon: { voornaam: string; achternaam: string; teamnaam: string | null } | null
}

const STATUS_ICON: Record<LesStatus, typeof CheckIcon> = {
  gepland: CheckIcon,
  verzet: ClockIcon,
  geannuleerd: XIcon,
}

// Drempel voor de Stormvaarder-badge: minimaal dit aantal voltooide lessen met
// minimaal deze windkracht (Beaufort) dit jaar.
const STORM_DREMPEL_BFT = 5
const STORM_MIN_LESSEN = 3

const DAGNAMEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']

function dagNaam(datum: string) {
  return DAGNAMEN[new Date(`${datum}T00:00:00`).getDay()]
}

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function LesItem({ les }: { les: LesMetLabel }) {
  const StatusIcon = STATUS_ICON[les.status]
  const [vraagOpen, setVraagOpen] = useState(false)

  return (
    <li className="card px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
          <p className="text-sm text-slate-500">
            {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)}
          </p>
          <p className="text-sm text-slate-500">
            {les.soort === 'duo_cursus'
              ? `Duo-cursus${les.tweede_persoon?.teamnaam ? ` "${les.tweede_persoon.teamnaam}"` : ''}${
                  les.tweede_persoon ? ` met ${les.tweede_persoon.voornaam} ${les.tweede_persoon.achternaam}` : ''
                }`
              : 'Privéles'}
          </p>
          <div className="mt-1.5">
            <DisciplineBadge discipline={les.discipline} />
          </div>
        </div>
        <span className={`badge flex-none ${STATUS_STYLES[les.status]}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABELS[les.status]}
        </span>
      </div>
      {les.status !== 'gepland' && les.label && (
        <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-500">Reden: {les.label.naam}</p>
      )}

      <div className="relative mt-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setVraagOpen((open) => !open)}
          aria-expanded={vraagOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:border-brand-blue hover:bg-brand-blue-light/10 hover:text-brand-blue-dark"
        >
          <ChatBubbleIcon className="h-3.5 w-3.5" />
          Vraag over deze les?
        </button>

        {vraagOpen && (
          <div
            role="status"
            className="absolute left-0 top-full z-20 mt-3 w-72 max-w-[calc(100vw-4rem)] rounded-2xl bg-slate-800 p-4 text-sm leading-relaxed text-white shadow-xl animate-toast-in"
          >
            <span aria-hidden="true" className="absolute -top-1.5 left-5 h-3.5 w-3.5 rotate-45 rounded-sm bg-slate-800" />
            <button
              type="button"
              onClick={() => setVraagOpen(false)}
              aria-label="Sluiten"
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-3 w-3" />
            </button>
            <p className="pr-5">
              Heb je een vraag over deze les, of wil je iets aanpassen? Mail ons gerust op{' '}
              <a href="mailto:info@zeilschooluitgeest.nl" className="font-semibold text-brand-blue-light underline">
                info@zeilschooluitgeest.nl
              </a>{' '}
              — we helpen je graag verder.
            </p>
          </div>
        )}
      </div>
    </li>
  )
}

interface SeizoenStats {
  aantalLessen: number
  totaalUren: number
  meestVoorkomendeDag: string | null
  gemiddeldeWind: number | null
  stormvaarder: boolean
}

function SeizoenOverzicht({ jaar, stats, datums }: { jaar: number; stats: SeizoenStats; datums: string[] }) {
  return (
    <div className="card mb-6 overflow-hidden">
      <div className="bg-gradient-to-br from-brand-blue to-brand-blue-dark px-5 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue-light/80">Jouw zeilseizoen {jaar}</p>
        <p className="mt-1 text-3xl font-extrabold">{formatUren(stats.totaalUren)}</p>
        <p className="text-sm text-brand-blue-light/90">
          op het water, in {stats.aantalLessen} {stats.aantalLessen === 1 ? 'les' : 'lessen'}
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-100 px-5 py-3.5 text-sm">
        <div>
          <p className="text-xs text-slate-400">Vaakst op</p>
          <p className="font-semibold capitalize text-slate-700">{stats.meestVoorkomendeDag ?? '–'}</p>
        </div>
        <div className="pl-4">
          <p className="text-xs text-slate-400">Gemiddelde wind</p>
          <p className="font-semibold text-slate-700">
            {stats.gemiddeldeWind !== null ? `${stats.gemiddeldeWind.toFixed(1)} Bft` : '–'}
          </p>
        </div>
      </div>
      {stats.stormvaarder && (
        <div className="border-t border-slate-100 px-5 py-3.5">
          <span className="relative inline-flex">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-brand-yellow-dark animate-ring-pulse"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-brand-yellow-dark animate-ring-pulse [animation-delay:200ms]"
            />
            <span className="badge relative bg-brand-yellow text-brand-blue-dark animate-milestone-pop">
              🎉 Stormvaarder — {STORM_MIN_LESSEN}+ lessen met stevige wind
            </span>
          </span>
        </div>
      )}
      <div className="border-t border-slate-100 px-5 py-3.5">
        <VaardagenKalender jaar={jaar} datums={datums} />
      </div>
    </div>
  )
}

function LegeStaat({ tekst }: { tekst: string }) {
  return (
    <p className="mb-8 flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-slate-400">
      <CalendarPlusIcon className="h-5 w-5 flex-none" /> {tekst}
    </p>
  )
}

export function MyLessons() {
  const { user } = useAuth()
  const [lessen, setLessen] = useState<LesMetLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [toonVerleden, setToonVerleden] = useState(false)

  const [windPerDatum, setWindPerDatum] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user) return
    supabase
      .from('lessen')
      .select('*, label:labels(naam), tweede_persoon:tweede_persoon(voornaam, achternaam, teamnaam)')
      .eq('cursist_id', user.id)
      .order('datum', { ascending: true })
      .then(({ data }) => {
        setLessen((data ?? []) as unknown as LesMetLabel[])
        setLoading(false)
      })
  }, [user])

  const vandaag = new Date().toISOString().slice(0, 10)
  const toekomstig = lessen.filter((l) => l.datum >= vandaag)
  const verleden = lessen.filter((l) => l.datum < vandaag).sort((a, b) => (a.datum < b.datum ? 1 : -1))

  const ditJaar = new Date().getFullYear()
  const gegevenDitJaar = useMemo(
    () =>
      lessen.filter(
        (l) =>
          l.status === 'gepland' && l.datum <= vandaag && new Date(`${l.datum}T00:00:00`).getFullYear() === ditJaar,
      ),
    [lessen, vandaag, ditJaar],
  )
  const gegevenDitJaarDatums = gegevenDitJaar.map((l) => l.datum).join('|')

  useEffect(() => {
    if (gegevenDitJaar.length === 0) return
    const datums = gegevenDitJaar.map((l) => l.datum).sort()
    const eindExclusief = new Date(`${datums[datums.length - 1]}T00:00:00`)
    eindExclusief.setDate(eindExclusief.getDate() + 1)
    haalHistorischWeer(datums[0], eindExclusief.toISOString().slice(0, 10)).then((perDatum) => {
      const map: Record<string, number> = {}
      for (const [datum, weer] of Object.entries(perDatum)) {
        map[datum] = weer.windBft
      }
      setWindPerDatum(map)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gegevenDitJaarDatums])

  const seizoen: SeizoenStats | null = useMemo(() => {
    if (gegevenDitJaar.length === 0) return null

    const totaalUren = gegevenDitJaar.reduce((som, l) => som + lesUren(l), 0)

    const dagTelling: Record<string, number> = {}
    for (const l of gegevenDitJaar) {
      const dag = dagNaam(l.datum)
      dagTelling[dag] = (dagTelling[dag] ?? 0) + 1
    }
    const meestVoorkomendeDag = Object.entries(dagTelling).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const windWaarden = gegevenDitJaar
      .map((l) => windPerDatum[l.datum])
      .filter((w): w is number => w !== undefined)
    const gemiddeldeWind = windWaarden.length > 0 ? windWaarden.reduce((s, w) => s + w, 0) / windWaarden.length : null
    const stormLessen = windWaarden.filter((w) => w >= STORM_DREMPEL_BFT).length

    return {
      aantalLessen: gegevenDitJaar.length,
      totaalUren,
      meestVoorkomendeDag,
      gemiddeldeWind,
      stormvaarder: stormLessen >= STORM_MIN_LESSEN,
    }
  }, [gegevenDitJaar, windPerDatum])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Mijn lessen</h1>
      <p className="mb-6 text-sm text-slate-500">Een overzicht van al je geboekte priveslessen.</p>

      {loading ? (
        <Loader />
      ) : (
        <>
          {seizoen && (
            <SeizoenOverzicht jaar={ditJaar} stats={seizoen} datums={gegevenDitJaar.map((l) => l.datum)} />
          )}

          <h2 className="mb-3 text-base font-semibold text-slate-800">Toekomstige lessen</h2>
          {toekomstig.length === 0 ? (
            <LegeStaat tekst="Nog geen lessen ingepland." />
          ) : (
            <ul className="mb-8 space-y-2">
              {toekomstig.map((les) => (
                <LesItem key={les.id} les={les} />
              ))}
            </ul>
          )}

          {!toonVerleden && (
            <button type="button" onClick={() => setToonVerleden(true)} className="btn-accent mb-4">
              Bekijk eerdere lessen
            </button>
          )}

          {toonVerleden && (
            <>
              <h2 className="mb-3 text-base font-semibold text-slate-800">Eerdere lessen</h2>
              {verleden.length === 0 ? (
                <p className="text-slate-500">Nog geen eerdere lessen.</p>
              ) : (
                <ul className="space-y-2">
                  {verleden.map((les) => (
                    <LesItem key={les.id} les={les} />
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
