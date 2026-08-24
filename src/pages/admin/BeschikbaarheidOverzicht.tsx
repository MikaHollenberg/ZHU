import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MINIMALE_TIJDVAK_MINUTEN, TIJD_OPTIES, tijdNaarMinuten } from '../../lib/tijd'
import { getWeekDagen, isoWeekNumber, startOfWeek, toDateKey } from '../../lib/kalender'
import { STATUS_LABELS } from '../../lib/lesStatus'
import type { Beschikbaarheid, BeschikbaarheidType } from '../../types/availability'
import type { Label, Les } from '../../types/lesson'
import type { Profile } from '../../types/profile'

interface LesMetLabel extends Les {
  label: { naam: string } | null
}

const BESCHIKBAAR_LABELS: Record<BeschikbaarheidType, string> = {
  hele_dag_beschikbaar: 'Hele dag beschikbaar',
  hele_dag_onbeschikbaar: 'Hele dag onbeschikbaar',
  tijdvak: 'Tijdvak',
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

function CelPaneel({
  selectie,
  labels,
  onClose,
  onChanged,
}: {
  selectie: CelSelectie
  labels: Label[]
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

  const handleInplannen = async () => {
    if (tijdNaarMinuten(eind) - tijdNaarMinuten(start) < MINIMALE_TIJDVAK_MINUTEN) {
      setError('Een les moet minimaal 2 uur duren.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('plan_les', {
      p_cursist_id: cursist.id,
      p_datum: datum,
      p_starttijd: start,
      p_eindtijd: eind,
      p_beschikbaarheid_id:
        beschikbaarheid && beschikbaarheid.type !== 'hele_dag_onbeschikbaar' ? beschikbaarheid.id : null,
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
            <p className="mb-2 text-sm text-slate-600">
              {les.starttijd.slice(0, 5)} - {les.eindtijd.slice(0, 5)} ({STATUS_LABELS[les.status]})
            </p>
            {les.label && <p className="mb-3 text-sm text-slate-500">Reden: {les.label.naam}</p>}
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
            <div className="grid grid-cols-2 gap-4">
              <TijdSelect label="Van" value={start} onChange={handleStartChange} />
              <TijdSelect label="Tot" value={eind} onChange={setEind} opties={eindOpties} />
            </div>
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

export function AdminBeschikbaarheid() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [cursisten, setCursisten] = useState<Profile[]>([])
  const [beschikbaarheid, setBeschikbaarheid] = useState<Beschikbaarheid[]>([])
  const [lessen, setLessen] = useState<LesMetLabel[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectie, setSelectie] = useState<CelSelectie | null>(null)

  const dagen = useMemo(() => getWeekDagen(weekStart), [weekStart])
  const weekNummer = useMemo(() => isoWeekNumber(weekStart), [weekStart])

  const load = async () => {
    setLoading(true)
    setError(null)
    const eerste = toDateKey(dagen[0])
    const laatste = toDateKey(dagen[6])

    const [cursistenRes, beschikbaarheidRes, lessenRes, labelsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('rol', 'cursist').order('achternaam', { ascending: true }),
      supabase.from('beschikbaarheid').select('*').gte('datum', eerste).lte('datum', laatste),
      supabase.from('lessen').select('*, label:labels(naam)').gte('datum', eerste).lte('datum', laatste),
      supabase.from('labels').select('*'),
    ])

    if (cursistenRes.error) setError(cursistenRes.error.message)
    setCursisten(cursistenRes.data ?? [])
    setBeschikbaarheid(beschikbaarheidRes.data ?? [])
    setLessen((lessenRes.data ?? []) as unknown as LesMetLabel[])
    setLabels(labelsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const shiftWeek = (delta: number) => {
    setSelectie(null)
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
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
              {cursisten.map((cursist) => (
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
                                ? 'bg-brand-blue text-white'
                                : l.status === 'verzet'
                                  ? 'bg-brand-yellow/60 text-brand-blue-dark line-through'
                                  : 'bg-red-100 text-red-700 line-through'
                            }`}
                          >
                            {l.starttijd.slice(0, 5)}-{l.eindtijd.slice(0, 5)}
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
              {cursisten.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    Nog geen cursisten aangemeld.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectie && (
        <CelPaneel
          selectie={selectie}
          labels={labels}
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
