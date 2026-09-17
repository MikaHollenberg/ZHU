import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DisciplineBadge } from '../components/DisciplineBadge'
import { CalendarPlusIcon, ClockIcon } from '../components/icons'
import { Loader } from '../components/Loader'
import type { Les } from '../types/lesson'

interface CursistNaam {
  cursist_id: string
  voornaam: string
  achternaam: string
}

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function LegeStaat({ tekst }: { tekst: string }) {
  return (
    <p className="mb-8 flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-slate-400">
      <CalendarPlusIcon className="h-5 w-5 flex-none" /> {tekst}
    </p>
  )
}

export function InstructeurLessen() {
  const { user, profile } = useAuth()
  const goedgekeurd = profile?.instructeur_goedgekeurd ?? false
  const [openstaand, setOpenstaand] = useState<Les[]>([])
  const [aanvragen, setAanvragen] = useState<Les[]>([])
  const [eigen, setEigen] = useState<Les[]>([])
  const [cursistNamen, setCursistNamen] = useState<Record<string, CursistNaam>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const vandaag = new Date().toISOString().slice(0, 10)

    const [openRes, aanvraagRes, eigenRes, namenRes] = await Promise.all([
      supabase
        .from('lessen')
        .select('*')
        .is('instructeur_id', null)
        .is('instructeur_aanvraag_id', null)
        .eq('status', 'gepland')
        .gte('datum', vandaag)
        .order('datum', { ascending: true }),
      supabase
        .from('lessen')
        .select('*')
        .eq('instructeur_aanvraag_id', user.id)
        .eq('status', 'gepland')
        .order('datum', { ascending: true }),
      supabase
        .from('lessen')
        .select('*')
        .eq('instructeur_id', user.id)
        .order('datum', { ascending: true }),
      supabase.rpc('lesgever_mijn_cursisten'),
    ])

    if (openRes.error) setError(openRes.error.message)
    setOpenstaand(openRes.data ?? [])
    setAanvragen(aanvraagRes.data ?? [])
    setEigen(eigenRes.data ?? [])

    const namenMap: Record<string, CursistNaam> = {}
    for (const n of (namenRes.data ?? []) as CursistNaam[]) {
      namenMap[n.cursist_id] = n
    }
    setCursistNamen(namenMap)

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const cursistNaam = (les: Les) => {
    // Alleen de naam tonen voor lessen die al aan mij gekoppeld zijn — niet
    // "meeliften" op een naam die ik toevallig via een andere les al weet.
    if (les.instructeur_id !== user?.id) return 'Cursist'
    const n = cursistNamen[les.cursist_id]
    return n ? `${n.voornaam} ${n.achternaam}` : 'Cursist'
  }

  const handleAanmelden = async (lesId: string) => {
    setSubmitting(lesId)
    setError(null)
    const { error: rpcError } = await supabase.rpc('meld_aan_als_instructeur', { p_les_id: lesId })
    setSubmitting(null)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    await load()
  }

  const handleAfmelden = async (lesId: string) => {
    setSubmitting(lesId)
    setError(null)
    const { error: rpcError } = await supabase.rpc('meld_af_als_instructeur', { p_les_id: lesId })
    setSubmitting(null)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    await load()
  }

  const vandaag = new Date().toISOString().slice(0, 10)
  const eigenToekomstig = eigen.filter((l) => l.datum >= vandaag && l.status === 'gepland')

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-blue-dark">Lesgeven</h1>
      <p className="mb-6 text-sm text-slate-500">Je eigen lessen en openstaande lesaanvragen.</p>

      {!goedgekeurd && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-status-wachtend-bg px-4 py-3 text-sm text-status-wachtend">
          <ClockIcon className="h-4 w-4 flex-none" />
          Je account moet nog door de beheerder worden goedgekeurd voordat je een les kunt claimen.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <Loader />
      ) : (
        <>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Mijn lessen</h2>
          {eigenToekomstig.length === 0 ? (
            <LegeStaat tekst="Je bent nog aan geen enkele les gekoppeld." />
          ) : (
            <ul className="mb-8 space-y-2">
              {eigenToekomstig.map((les) => (
                <li key={les.id} className="card flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                    <p className="text-sm text-slate-500">
                      {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · {cursistNaam(les)}
                    </p>
                    <div className="mt-1.5">
                      <DisciplineBadge discipline={les.discipline} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting === les.id}
                    onClick={() => handleAfmelden(les.id)}
                    className="flex-none text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline"
                  >
                    Afmelden
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 text-base font-semibold text-slate-800">Mijn aanvragen (wacht op goedkeuring)</h2>
          {aanvragen.length === 0 ? (
            <LegeStaat tekst="Je hebt geen openstaande aanvragen." />
          ) : (
            <ul className="mb-8 space-y-2">
              {aanvragen.map((les) => (
                <li
                  key={les.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-status-wachtend/25 bg-status-wachtend-bg px-4 py-3.5 shadow-[var(--shadow-card)]"
                >
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                    <p className="flex items-center gap-1.5 text-sm text-status-wachtend">
                      <ClockIcon className="h-3.5 w-3.5 flex-none" />
                      {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · Wacht op goedkeuring
                    </p>
                    <div className="mt-1.5">
                      <DisciplineBadge discipline={les.discipline} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting === les.id}
                    onClick={() => handleAfmelden(les.id)}
                    className="flex-none text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline"
                  >
                    Intrekken
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 text-base font-semibold text-slate-800">Openstaande lessen</h2>
          {openstaand.length === 0 ? (
            <LegeStaat tekst="Geen openstaande lessen op dit moment." />
          ) : (
            <ul className="space-y-2">
              {openstaand.map((les) => (
                <li key={les.id} className="card flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                    <p className="text-sm text-slate-500">
                      {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · {cursistNaam(les)}
                    </p>
                    <div className="mt-1.5">
                      <DisciplineBadge discipline={les.discipline} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting === les.id || !goedgekeurd}
                    onClick={() => handleAanmelden(les.id)}
                    className="btn-primary flex-none"
                  >
                    {submitting === les.id ? 'Bezig...' : 'Aanmelden'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
