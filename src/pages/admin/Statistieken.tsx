import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DISCIPLINES } from '../../lib/disciplines'
import { lesUren, formatUren } from '../../lib/stats'
import { StatTile } from '../../components/StatTile'
import { DisciplineBreakdown } from '../../components/DisciplineBreakdown'
import type { Les } from '../../types/lesson'

interface InstructeurRow {
  id: string
  voornaam: string
  achternaam: string
}

export function AdminStatistieken() {
  const [lessen, setLessen] = useState<Les[]>([])
  const [instructeurs, setInstructeurs] = useState<InstructeurRow[]>([])
  const [actieveCursisten, setActieveCursisten] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [lessenRes, instructeurRes, cursistRes] = await Promise.all([
        supabase.from('lessen').select('*'),
        supabase
          .from('profiles')
          .select('id, voornaam, achternaam')
          .eq('rol', 'instructeur')
          .eq('gearchiveerd', false),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('rol', 'cursist')
          .eq('gearchiveerd', false),
      ])
      setLessen(lessenRes.data ?? [])
      setInstructeurs(instructeurRes.data ?? [])
      setActieveCursisten(cursistRes.count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const vandaag = new Date().toISOString().slice(0, 10)
    const gegeven = lessen.filter((l) => l.status === 'gepland' && l.datum <= vandaag)
    const toekomstig = lessen.filter((l) => l.status === 'gepland' && l.datum > vandaag)
    const verzet = lessen.filter((l) => l.status === 'verzet')
    const geannuleerd = lessen.filter((l) => l.status === 'geannuleerd')

    const totaalUren = gegeven.reduce((som, l) => som + lesUren(l), 0)
    const duoCount = gegeven.filter((l) => l.soort === 'duo_cursus').length

    const perDiscipline = DISCIPLINES.map((d) => {
      const vanDiscipline = gegeven.filter((l) => l.discipline === d)
      return {
        discipline: d,
        aantal: vanDiscipline.length,
        uren: vanDiscipline.reduce((som, l) => som + lesUren(l), 0),
      }
    }).filter((r) => r.aantal > 0)

    const perInstructeur = instructeurs
      .map((i) => {
        const vanInstructeur = gegeven.filter((l) => l.instructeur_id === i.id)
        return {
          instructeur: i,
          aantal: vanInstructeur.length,
          uren: vanInstructeur.reduce((som, l) => som + lesUren(l), 0),
        }
      })
      .filter((r) => r.aantal > 0)
      .sort((a, b) => b.aantal - a.aantal)

    return { gegeven, toekomstig, verzet, geannuleerd, totaalUren, duoCount, perDiscipline, perInstructeur }
  }, [lessen, instructeurs])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue" />
        Laden...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Statistieken</h1>
      <p className="mb-6 text-sm text-slate-500">Overzicht van alle gegeven lessen op de zeilschool.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Gegeven lessen" value={String(stats.gegeven.length)} />
        <StatTile label="Lesuren" value={formatUren(stats.totaalUren)} />
        <StatTile label="Actieve cursisten" value={String(actieveCursisten)} />
        <StatTile label="Actieve instructeurs" value={String(instructeurs.length)} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <DisciplineBreakdown rows={stats.perDiscipline} />

        <div className="card flex flex-col gap-4 px-5 py-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Privéles vs. duo-cursus</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Privélessen</span>
              <span className="font-medium text-slate-800">{stats.gegeven.length - stats.duoCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Duo-cursussen</span>
              <span className="font-medium text-slate-800">{stats.duoCount}</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Planning</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Toekomstig gepland</span>
              <span className="font-medium text-status-bevestigd">{stats.toekomstig.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Verzet</span>
              <span className="font-medium text-slate-500">{stats.verzet.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Geannuleerd</span>
              <span className="font-medium text-status-geannuleerd">{stats.geannuleerd.length}</span>
            </div>
          </div>
        </div>
      </div>

      {stats.perInstructeur.length > 0 && (
        <div className="card overflow-x-auto px-5 py-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Per instructeur</h3>
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-2 pr-4 font-medium">Naam</th>
                <th className="pb-2 pr-4 font-medium">Lessen</th>
                <th className="pb-2 font-medium">Uren</th>
              </tr>
            </thead>
            <tbody>
              {stats.perInstructeur.map((r) => (
                <tr key={r.instructeur.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-800">
                    {r.instructeur.voornaam} {r.instructeur.achternaam}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{r.aantal}</td>
                  <td className="py-2 text-slate-600">{formatUren(r.uren)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
