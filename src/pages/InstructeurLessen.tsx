import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DisciplineBadge } from '../components/DisciplineBadge'
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

export function InstructeurLessen() {
  const { user, profile } = useAuth()
  const goedgekeurd = profile?.instructeur_goedgekeurd ?? false
  const [openstaand, setOpenstaand] = useState<Les[]>([])
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

    const [openRes, eigenRes, namenRes] = await Promise.all([
      supabase
        .from('lessen')
        .select('*')
        .is('instructeur_id', null)
        .eq('status', 'gepland')
        .gte('datum', vandaag)
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
      <h1 className="mb-6 text-2xl font-semibold text-brand-blue-dark">Lesgeven</h1>

      {!goedgekeurd && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Je account moet nog door de beheerder worden goedgekeurd voordat je een les kunt claimen.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Laden...</p>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Mijn lessen</h2>
          {eigenToekomstig.length === 0 ? (
            <p className="mb-8 text-slate-500">Je bent nog aan geen enkele les gekoppeld.</p>
          ) : (
            <ul className="mb-8 space-y-2">
              {eigenToekomstig.map((les) => (
                <li
                  key={les.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                    <p className="text-sm text-slate-500">
                      {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · {cursistNaam(les)}
                    </p>
                    <div className="mt-1">
                      <DisciplineBadge discipline={les.discipline} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting === les.id}
                    onClick={() => handleAfmelden(les.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Afmelden
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 text-lg font-semibold text-slate-800">Openstaande lessen</h2>
          {openstaand.length === 0 ? (
            <p className="text-slate-500">Geen openstaande lessen op dit moment.</p>
          ) : (
            <ul className="space-y-2">
              {openstaand.map((les) => (
                <li
                  key={les.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium capitalize text-slate-800">{formatDatum(les.datum)}</p>
                    <p className="text-sm text-slate-500">
                      {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} · {cursistNaam(les)}
                    </p>
                    <div className="mt-1">
                      <DisciplineBadge discipline={les.discipline} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting === les.id || !goedgekeurd}
                    onClick={() => handleAanmelden(les.id)}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
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
