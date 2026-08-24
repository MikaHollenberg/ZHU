import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS, STATUS_STYLES } from '../lib/lesStatus'
import { DisciplineBadge } from '../components/DisciplineBadge'
import type { Les } from '../types/lesson'

interface LesMetLabel extends Les {
  label: { naam: string } | null
  tweede_persoon: { voornaam: string; achternaam: string } | null
}

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function LesItem({ les }: { les: LesMetLabel }) {
  return (
    <li className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
          <p className="text-sm text-slate-500">
            {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)}
          </p>
          <p className="text-sm text-slate-500">
            {les.soort === 'duo_cursus'
              ? `Duo-cursus${les.tweede_persoon ? ` met ${les.tweede_persoon.voornaam} ${les.tweede_persoon.achternaam}` : ''}`
              : 'Privéles'}
          </p>
          <div className="mt-1">
            <DisciplineBadge discipline={les.discipline} />
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[les.status]}`}>
          {STATUS_LABELS[les.status]}
        </span>
      </div>
      {les.status !== 'gepland' && les.label && (
        <p className="mt-2 text-sm text-slate-500">Reden: {les.label.naam}</p>
      )}
    </li>
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
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Mijn lessen</h1>

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Toekomstige lessen</h2>
          {toekomstig.length === 0 ? (
            <p className="mb-8 text-slate-500">Nog geen lessen ingepland.</p>
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
              <h2 className="mb-3 text-lg font-semibold text-slate-800">Eerdere lessen</h2>
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
