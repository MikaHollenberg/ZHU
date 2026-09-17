import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS, STATUS_STYLES } from '../lib/lesStatus'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { CalendarPlusIcon, CheckIcon, ClockIcon, XIcon } from '../components/icons'
import { Loader } from '../components/Loader'
import type { Les, LesStatus } from '../types/lesson'

interface LesMetLabel extends Les {
  label: { naam: string } | null
  tweede_persoon: { voornaam: string; achternaam: string } | null
}

const STATUS_ICON: Record<LesStatus, typeof CheckIcon> = {
  gepland: CheckIcon,
  verzet: ClockIcon,
  geannuleerd: XIcon,
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
              ? `Duo-cursus${les.tweede_persoon ? ` met ${les.tweede_persoon.voornaam} ${les.tweede_persoon.achternaam}` : ''}`
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
    </li>
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

  useEffect(() => {
    if (!user) return
    supabase
      .from('lessen')
      .select('*, label:labels(naam), tweede_persoon:tweede_persoon(voornaam, achternaam)')
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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Mijn lessen</h1>
      <p className="mb-6 text-sm text-slate-500">Een overzicht van al je geboekte priveslessen.</p>

      {loading ? (
        <Loader />
      ) : (
        <>
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
