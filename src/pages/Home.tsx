import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePendingAanvragen } from '../lib/usePendingAanvragen'
import { DISCIPLINE_LABELS } from '../lib/disciplines'
import { DUO_CURSUS_TYPE_LABELS } from '../lib/duoCursusType'
import { dagAfkorting, dagNummer } from '../lib/datum'
import { HeroLesCard } from '../components/HeroLesCard'
import { QuickActionCard } from '../components/QuickActionCard'
import { StatTile } from '../components/StatTile'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { Loader } from '../components/Loader'
import { stuurLesMail } from '../lib/notificaties'
import {
  BookIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  TagIcon,
  UsersIcon,
  XIcon,
} from '../components/icons'
import type { Les } from '../types/lesson'

interface CursistNaam {
  cursist_id: string
  voornaam: string
  achternaam: string
}

interface LesMetPartner extends Les {
  tweede_persoon: { voornaam: string; achternaam: string; teamnaam: string | null } | null
}

function InstructeurStatusIcon({
  les,
  pop,
}: {
  les: Pick<Les, 'instructeur_id' | 'instructeur_aanvraag_id'>
  /** Speelt de vinkje-pop af — alleen waar voor de les die zojuist is goedgekeurd. */
  pop?: boolean
}) {
  if (les.instructeur_id) {
    return (
      <span
        title="Instructeur gekoppeld"
        className={`inline-flex text-status-bevestigd ${pop ? 'animate-badge-pop' : ''}`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    )
  }
  if (les.instructeur_aanvraag_id) {
    return (
      <span title="Aanvraag in behandeling" className="inline-flex text-status-wachtend">
        <ClockIcon className="h-3.5 w-3.5" />
      </span>
    )
  }
  return (
    <span title="Nog geen instructeur" className="inline-flex text-slate-400">
      <XIcon className="h-3.5 w-3.5" />
    </span>
  )
}

function Greeting({ voornaam }: { voornaam?: string }) {
  const vandaag = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-blue capitalize">{vandaag}</p>
      <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-brand-blue-dark">
        Welkom terug{voornaam ? `, ${voornaam}` : ''}
      </h1>
    </div>
  )
}

function CursistHome() {
  const { user, profile } = useAuth()
  const [volgendeLes, setVolgendeLes] = useState<LesMetPartner | null>(null)
  const [lessenDezeMaand, setLessenDezeMaand] = useState(0)
  const [aantalGegeven, setAantalGegeven] = useState(0)
  const [weekOntbreekt, setWeekOntbreekt] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const vandaag = new Date()
    const vandaagStr = vandaag.toISOString().slice(0, 10)
    const maandStart = new Date(vandaag.getFullYear(), vandaag.getMonth(), 1).toISOString().slice(0, 10)
    const maandEind = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 0).toISOString().slice(0, 10)
    const morgen = new Date(vandaag)
    morgen.setDate(morgen.getDate() + 1)
    const overEenWeek = new Date(vandaag)
    overEenWeek.setDate(overEenWeek.getDate() + 7)

    Promise.all([
      supabase
        .from('lessen')
        .select('*, tweede_persoon:tweede_persoon(voornaam, achternaam, teamnaam)')
        .eq('cursist_id', user.id)
        .eq('status', 'gepland')
        .gte('datum', vandaagStr)
        .order('datum', { ascending: true })
        .order('starttijd', { ascending: true })
        .limit(1),
      supabase
        .from('lessen')
        .select('id', { count: 'exact', head: true })
        .eq('cursist_id', user.id)
        .eq('status', 'gepland')
        .gte('datum', maandStart)
        .lte('datum', maandEind),
      supabase
        .from('beschikbaarheid')
        .select('id', { count: 'exact', head: true })
        .eq('cursist_id', user.id)
        .gte('datum', morgen.toISOString().slice(0, 10))
        .lte('datum', overEenWeek.toISOString().slice(0, 10)),
      supabase
        .from('lessen')
        .select('id', { count: 'exact', head: true })
        .eq('cursist_id', user.id)
        .eq('status', 'gepland')
        .lt('datum', vandaagStr),
    ]).then(([lesRes, maandRes, weekRes, gegevenRes]) => {
      setVolgendeLes((lesRes.data?.[0] as unknown as LesMetPartner) ?? null)
      setLessenDezeMaand(maandRes.count ?? 0)
      setWeekOntbreekt((weekRes.count ?? 0) === 0)
      setAantalGegeven(gegevenRes.count ?? 0)
      setLoading(false)
    })
  }, [user])

  const milestoneLabel = useMemo(() => {
    if (!volgendeLes) return undefined
    const lesNummer = aantalGegeven + 1
    const isMijlpaal = lesNummer === 5 || lesNummer === 10 || lesNummer % 25 === 0
    return isMijlpaal ? `Dit is je ${lesNummer}e les!` : undefined
  }, [volgendeLes, aantalGegeven])

  const duoPartnerTekst = useMemo(() => {
    if (!volgendeLes || volgendeLes.soort !== 'duo_cursus') return undefined
    if (!volgendeLes.tweede_persoon) return 'Duo-cursus'
    const teamnaamTekst = volgendeLes.tweede_persoon.teamnaam ? ` "${volgendeLes.tweede_persoon.teamnaam}"` : ''
    return `Duo-cursus${teamnaamTekst} met ${volgendeLes.tweede_persoon.voornaam} ${volgendeLes.tweede_persoon.achternaam}`
  }, [volgendeLes])

  const voorkeurTekst = useMemo(() => {
    if (!profile?.standaard_discipline || !profile?.standaard_soort) return null
    const discipline = DISCIPLINE_LABELS[profile.standaard_discipline]
    if (profile.standaard_soort === 'priveles') return `${discipline} · Privéles`
    const vorm = profile.standaard_duo_cursus_type ? ` (${DUO_CURSUS_TYPE_LABELS[profile.standaard_duo_cursus_type]})` : ''
    return `${discipline} · Duo-cursus${vorm}`
  }, [profile])

  if (loading) return <Loader />

  return (
    <div className="stagger-in">
      {weekOntbreekt && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-brand-blue-light/25 px-4 py-3 text-sm text-brand-blue-dark">
          <CalendarIcon className="h-4 w-4 flex-none" />
          Je hebt voor de komende week nog geen beschikbaarheid doorgegeven.{' '}
          <Link to="/beschikbaarheid" className="font-semibold underline">
            Nu doorgeven
          </Link>
        </p>
      )}

      <HeroLesCard
        les={volgendeLes}
        label="Jouw volgende les"
        metaText={duoPartnerTekst}
        milestoneLabel={milestoneLabel}
        emptyTitle="Nog geen les gepland"
        emptySub="Geef je beschikbaarheid door, dan plant de zeilschool binnenkort een les voor je in."
        emptyCtaLabel="Beschikbaarheid doorgeven"
        emptyCtaTo="/beschikbaarheid"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <QuickActionCard to="/beschikbaarheid" label="Beschikbaarheid doorgeven" icon={CalendarIcon} />
        <QuickActionCard to="/mijn-lessen" label="Mijn lessen bekijken" icon={BookIcon} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <p className="inline-flex w-fit flex-wrap items-center gap-2 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-xs text-slate-500">
          Jouw voorkeur:{' '}
          <strong className="font-semibold text-slate-700">{voorkeurTekst ?? 'nog niet ingesteld'}</strong>
          <Link to="/beschikbaarheid" className="font-semibold text-brand-blue-dark underline">
            {voorkeurTekst ? 'wijzigen' : 'instellen'}
          </Link>
        </p>
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-xs text-slate-500">
          Lessen deze maand: <strong className="font-semibold text-slate-700">{lessenDezeMaand}</strong>
        </p>
      </div>
    </div>
  )
}

function InstructeurHome() {
  const { user, profile } = useAuth()
  const pendingCount = usePendingAanvragen(user, profile)
  const [volgendeLes, setVolgendeLes] = useState<Les | null>(null)
  const [cursistNaam, setCursistNaam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const vandaag = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase
        .from('lessen')
        .select('*')
        .eq('instructeur_id', user.id)
        .eq('status', 'gepland')
        .gte('datum', vandaag)
        .order('datum', { ascending: true })
        .order('starttijd', { ascending: true })
        .limit(1),
      supabase.rpc('lesgever_mijn_cursisten'),
    ]).then(([lesRes, namenRes]) => {
      const les = lesRes.data?.[0] ?? null
      setVolgendeLes(les)
      if (les) {
        const namen = (namenRes.data ?? []) as CursistNaam[]
        const naam = namen.find((n) => n.cursist_id === les.cursist_id)
        setCursistNaam(naam ? `${naam.voornaam} ${naam.achternaam}` : null)
      }
      setLoading(false)
    })
  }, [user])

  if (loading) return <Loader />

  return (
    <div className="stagger-in">
      {profile && !profile.instructeur_goedgekeurd && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-status-wachtend-bg px-4 py-3 text-sm text-status-wachtend">
          <ClockIcon className="h-4 w-4 flex-none" />
          Je account moet nog door de beheerder worden goedgekeurd voordat je een les kunt claimen.
        </p>
      )}

      {pendingCount > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-brand-blue-light/25 px-4 py-3 text-sm text-brand-blue-dark">
          <ClockIcon className="h-4 w-4 flex-none" />
          Je hebt {pendingCount} {pendingCount === 1 ? 'aanvraag' : 'aanvragen'} die nog wacht
          {pendingCount === 1 ? '' : 'en'} op goedkeuring van de beheerder.{' '}
          <Link to="/lesgeven" className="font-semibold underline">
            Bekijk in Lesgeven
          </Link>
        </p>
      )}

      <HeroLesCard
        les={volgendeLes}
        label="Jouw volgende les om te geven"
        metaText={cursistNaam ? `Cursist: ${cursistNaam}` : undefined}
        emptyTitle="Nog geen les om te geven"
        emptySub="Meld je aan voor een openstaande les, of geef eerst je beschikbaarheid door."
        emptyCtaLabel="Naar Lesgeven"
        emptyCtaTo="/lesgeven"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <QuickActionCard to="/beschikbaarheid" label="Beschikbaarheid doorgeven" icon={CalendarIcon} />
        <QuickActionCard to="/lesgeven" label="Naar Lesgeven" icon={CompassIcon} />
        <QuickActionCard to="/statistieken" label="Bekijk statistieken" icon={ChartBarIcon} />
      </div>
    </div>
  )
}

function BeheerderHome() {
  const [actieveCursisten, setActieveCursisten] = useState(0)
  const [actieveInstructeurs, setActieveInstructeurs] = useState(0)
  const [komendeWeek, setKomendeWeek] = useState<LesMetPartner[]>([])
  const [aanvragen, setAanvragen] = useState<Les[]>([])
  const [cursistNamen, setCursistNamen] = useState<Record<string, string>>({})
  const [instructeurNamen, setInstructeurNamen] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [goedkeurenId, setGoedkeurenId] = useState<string | null>(null)
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const load = () => {
    const vandaag = new Date()
    const vandaagStr = vandaag.toISOString().slice(0, 10)
    const overEenWeek = new Date(vandaag)
    overEenWeek.setDate(overEenWeek.getDate() + 6)
    const overEenWeekStr = overEenWeek.toISOString().slice(0, 10)

    return Promise.all([
      supabase.from('profiles').select('id, voornaam, achternaam').eq('rol', 'cursist').eq('gearchiveerd', false),
      supabase.from('profiles').select('id, voornaam, achternaam').eq('rol', 'instructeur').eq('gearchiveerd', false),
      supabase
        .from('lessen')
        .select('*, tweede_persoon:tweede_persoon(voornaam, achternaam, teamnaam)')
        .eq('status', 'gepland')
        .gte('datum', vandaagStr)
        .lte('datum', overEenWeekStr)
        .order('datum', { ascending: true })
        .order('starttijd', { ascending: true }),
      supabase
        .from('lessen')
        .select('*')
        .not('instructeur_aanvraag_id', 'is', null)
        .is('instructeur_id', null)
        .order('datum', { ascending: true }),
    ]).then(([cursistRes, instructeurRes, lessenRes, aanvraagRes]) => {
      const cursistNamenMap: Record<string, string> = {}
      for (const c of cursistRes.data ?? []) {
        cursistNamenMap[c.id] = `${c.voornaam} ${c.achternaam}`
      }
      const instructeurNamenMap: Record<string, string> = {}
      for (const i of instructeurRes.data ?? []) {
        instructeurNamenMap[i.id] = `${i.voornaam} ${i.achternaam}`
      }
      setCursistNamen(cursistNamenMap)
      setInstructeurNamen(instructeurNamenMap)
      setActieveCursisten(cursistRes.data?.length ?? 0)
      setActieveInstructeurs(instructeurRes.data?.length ?? 0)
      setKomendeWeek((lessenRes.data ?? []) as unknown as LesMetPartner[])
      setAanvragen(aanvraagRes.data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Klokje voor "Nu op het water" — elke minuut opnieuw checken wie er
  // volgens het rooster middenin een les zit, zonder de hele pagina te
  // hoeven verversen.
  const [nu, setNu] = useState(() => new Date())
  useEffect(() => {
    const interval = window.setInterval(() => setNu(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const opHetWaterNu = useMemo(() => {
    const vandaagStr = nu.toISOString().slice(0, 10)
    const nuInMinuten = nu.getHours() * 60 + nu.getMinutes()
    return komendeWeek.filter((les) => {
      if (les.datum !== vandaagStr) return false
      const [sh, sm] = les.starttijd.slice(0, 5).split(':').map(Number)
      const [eh, em] = les.eindtijd.slice(0, 5).split(':').map(Number)
      return nuInMinuten >= sh * 60 + sm && nuInMinuten < eh * 60 + em
    })
  }, [komendeWeek, nu])

  const handleGoedkeuren = async (les: Les) => {
    if (!les.instructeur_aanvraag_id) return
    setGoedkeurenId(les.id)
    await supabase
      .from('lessen')
      .update({ instructeur_id: les.instructeur_aanvraag_id, instructeur_aanvraag_id: null })
      .eq('id', les.id)
    await load()
    setGoedkeurenId(null)
    setJustConfirmedId(les.id)
    setToastMessage('Instructeur gekoppeld')
    window.setTimeout(() => setJustConfirmedId(null), 900)
    window.setTimeout(() => setToastMessage(null), 2700)
    stuurLesMail('aanvraag_goedgekeurd', les.id)
  }

  if (loading) return <Loader />

  return (
    <>
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-lg animate-toast-in"
        >
          <CheckIcon className="h-4 w-4 flex-none" />
          {toastMessage}
        </div>
      )}

      <div className="stagger-in">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Actieve cursisten" value={String(actieveCursisten)} />
          <StatTile label="Actieve instructeurs" value={String(actieveInstructeurs)} />
          <StatTile label="Lessen deze week" value={String(komendeWeek.length)} />
          <StatTile label="Aanvragen" value={String(aanvragen.length)} badge={aanvragen.length} />
        </div>

        {opHetWaterNu.length > 0 && (
          <div className="card mb-6 px-4 py-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-bevestigd opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-bevestigd" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800">Nu op het water</h2>
            </div>
            <ul className="space-y-2">
              {opHetWaterNu.map((les) => (
                <li
                  key={les.id}
                  className="flex flex-wrap items-center gap-2.5 rounded-xl bg-brand-blue-light/10 px-3 py-2 text-sm"
                >
                  <DisciplineBadge discipline={les.discipline} />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                    {les.soort === 'duo_cursus'
                      ? `Duo-cursus${les.tweede_persoon ? ` — ${les.tweede_persoon.voornaam} ${les.tweede_persoon.achternaam}` : ''}`
                      : cursistNamen[les.cursist_id] ?? 'Cursist'}
                  </span>
                  {les.instructeur_id && instructeurNamen[les.instructeur_id] && (
                    <span className="flex-none text-xs text-slate-400">met {instructeurNamen[les.instructeur_id]}</span>
                  )}
                  <span className="flex-none text-xs text-slate-400">tot {les.eindtijd.slice(0, 5)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aanvragen.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-slate-800">Wacht op goedkeuring</h2>
            <ul className="space-y-2">
              {aanvragen.map((a) => (
                <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-slate-800">
                      {dagAfkorting(a.datum)} {dagNummer(a.datum)} · {a.starttijd.slice(0, 5)}-{a.eindtijd.slice(0, 5)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {instructeurNamen[a.instructeur_aanvraag_id ?? ''] ?? 'Instructeur'} meldt zich aan
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <DisciplineBadge discipline={a.discipline} />
                    <button
                      type="button"
                      disabled={goedkeurenId === a.id}
                      onClick={() => handleGoedkeuren(a)}
                      className="btn-accent"
                    >
                      {goedkeurenId === a.id ? 'Bezig...' : 'Goedkeuren'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mb-3 text-base font-semibold text-slate-800">Komende week</h2>
        {komendeWeek.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-400">
            Geen lessen gepland in de komende week.
          </p>
        ) : (
          <ul className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
            {komendeWeek.slice(0, 5).map((les) => {
              const isVandaag = les.datum === new Date().toISOString().slice(0, 10)
              return (
                <li
                  key={les.id}
                  className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${isVandaag ? 'bg-brand-yellow/10' : ''}`}
                >
                  <div
                    className={`flex h-9 w-9 flex-none flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none ${
                      isVandaag ? 'bg-brand-yellow text-brand-blue-dark' : 'bg-brand-blue-light/25 text-brand-blue-dark'
                    }`}
                  >
                    <span>{isVandaag ? 'NU' : dagAfkorting(les.datum)}</span>
                    <span className="text-xs">{dagNummer(les.datum)}</span>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {les.soort === 'duo_cursus'
                      ? `Duo-cursus${les.tweede_persoon ? ` — ${les.tweede_persoon.voornaam} ${les.tweede_persoon.achternaam}` : ''}`
                      : cursistNamen[les.cursist_id] ?? 'Cursist'}
                  </p>
                  <DisciplineBadge discipline={les.discipline} />
                  <InstructeurStatusIcon les={les} pop={les.id === justConfirmedId} />
                  <span className="flex-none text-sm text-slate-400">{les.starttijd.slice(0, 5)}</span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard to="/beheer/cursisten" label="Cursisten" icon={UsersIcon} />
          <QuickActionCard to="/beheer/beschikbaarheid" label="Rooster" icon={CalendarIcon} />
          <QuickActionCard to="/beheer/labels" label="Labels" icon={TagIcon} />
          <QuickActionCard to="/beheer/statistieken" label="Statistieken" icon={ChartBarIcon} />
        </div>
      </div>
    </>
  )
}

export function Home() {
  const { profile } = useAuth()

  return (
    <div id="tour-home" className="mx-auto max-w-4xl scroll-mt-4">
      <Greeting voornaam={profile?.voornaam} />
      {profile?.rol === 'beheerder' ? (
        <BeheerderHome />
      ) : profile?.rol === 'instructeur' ? (
        <InstructeurHome />
      ) : (
        <CursistHome />
      )}
    </div>
  )
}
