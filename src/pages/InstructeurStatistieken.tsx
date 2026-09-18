import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DISCIPLINES } from '../lib/disciplines'
import { lesPersonen, lesUren, formatUren } from '../lib/stats'
import { lesInPeriode } from '../lib/periode'
import type { Periode } from '../lib/periode'
import { StatTile } from '../components/StatTile'
import { DisciplineBreakdown } from '../components/DisciplineBreakdown'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { PeriodeKiezer } from '../components/PeriodeKiezer'
import { CalendarPlusIcon } from '../components/icons'
import { Loader } from '../components/Loader'
import type { Les } from '../types/lesson'

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function InstructeurStatistieken() {
  const { user } = useAuth()
  const [lessen, setLessen] = useState<Les[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<Periode>({ type: 'alles', anker: new Date() })
  const [vergelijkPeriode, setVergelijkPeriode] = useState<Periode | null>(null)

  useEffect(() => {
    if (!user) return
    const vandaag = new Date().toISOString().slice(0, 10)
    supabase
      .from('lessen')
      .select('*')
      .eq('instructeur_id', user.id)
      .eq('status', 'gepland')
      .lte('datum', vandaag)
      .order('datum', { ascending: false })
      .then(({ data }) => {
        setLessen(data ?? [])
        setLoading(false)
      })
  }, [user])

  const berekenStats = (lessenLijst: Les[]) => {
    const totaalUren = lessenLijst.reduce((som, l) => som + lesUren(l), 0)
    const totaalPersonen = lessenLijst.reduce((som, l) => som + lesPersonen(l), 0)
    const uniekeCursisten = new Set(lessenLijst.map((l) => l.cursist_id)).size
    const duoCount = lessenLijst.filter((l) => l.soort === 'duo_cursus').length
    const perDiscipline = DISCIPLINES.map((d) => {
      const vanDiscipline = lessenLijst.filter((l) => l.discipline === d)
      return {
        discipline: d,
        aantal: vanDiscipline.length,
        uren: vanDiscipline.reduce((som, l) => som + lesUren(l), 0),
      }
    }).filter((r) => r.aantal > 0)

    return { totaalUren, totaalPersonen, uniekeCursisten, perDiscipline, duoCount, aantal: lessenLijst.length }
  }

  const lessenInPeriode = useMemo(() => lessen.filter((l) => lesInPeriode(l.datum, periode)), [lessen, periode])
  const stats = useMemo(() => berekenStats(lessenInPeriode), [lessenInPeriode])

  const vergelijkStats = useMemo(() => {
    if (!vergelijkPeriode) return null
    return berekenStats(lessen.filter((l) => lesInPeriode(l.datum, vergelijkPeriode)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessen, vergelijkPeriode])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Mijn statistieken</h1>
      <p className="mb-6 text-sm text-slate-500">Een overzicht van de lessen die je hebt gegeven.</p>

      {loading ? (
        <Loader />
      ) : lessen.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-slate-400">
          <CalendarPlusIcon className="h-5 w-5 flex-none" /> Je hebt nog geen lessen gegeven.
        </p>
      ) : (
        <>
          <PeriodeKiezer
            periode={periode}
            onChange={setPeriode}
            vergelijkPeriode={vergelijkPeriode}
            onVergelijkPeriodeChange={setVergelijkPeriode}
          />

          {lessenInPeriode.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-slate-400">
              Geen lessen in deze periode.
            </p>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  label="Gegeven lessen"
                  value={String(stats.aantal)}
                  vergelijking={vergelijkStats ? { huidig: stats.aantal, vorig: vergelijkStats.aantal } : undefined}
                />
                <StatTile
                  label="Lesuren"
                  value={formatUren(stats.totaalUren)}
                  vergelijking={
                    vergelijkStats
                      ? {
                          huidig: Math.round(stats.totaalUren * 10) / 10,
                          vorig: Math.round(vergelijkStats.totaalUren * 10) / 10,
                        }
                      : undefined
                  }
                />
                <StatTile label="Cursisten begeleid" value={String(stats.uniekeCursisten)} />
                <StatTile
                  label="Personen lesgegeven"
                  value={String(stats.totaalPersonen)}
                  sub={stats.duoCount > 0 ? `waarvan ${stats.duoCount} duo-cursus${stats.duoCount === 1 ? '' : 'sen'}` : undefined}
                />
              </div>

              <div className="mb-8">
                <DisciplineBreakdown rows={stats.perDiscipline} />
              </div>

              <h2 className="mb-3 text-base font-semibold text-slate-800">Gegeven lessen</h2>
              <ul className="space-y-2">
                {lessenInPeriode.map((les) => (
                  <li key={les.id} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                      <p className="text-sm text-slate-500">
                        {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · {formatUren(lesUren(les))}
                      </p>
                    </div>
                    <DisciplineBadge discipline={les.discipline} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
