import { PERIODE_TYPE_LABELS, periodeLabel, verschuifPeriode, vorigePeriode } from '../lib/periode'
import type { Periode, PeriodeType } from '../lib/periode'

const PRIMAIRE_TYPES: PeriodeType[] = ['week', 'maand', 'jaar', 'alles']
const VERGELIJK_TYPES: PeriodeType[] = ['week', 'maand', 'jaar']

function TypeChips({
  actief,
  opties,
  onChange,
}: {
  actief: PeriodeType
  opties: PeriodeType[]
  onChange: (type: PeriodeType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opties.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={actief === type}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${
            actief === type ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {PERIODE_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  )
}

function PeriodeNav({ periode, onChange }: { periode: Periode; onChange: (periode: Periode) => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(verschuifPeriode(periode, -1))}
        aria-label="Vorige periode"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-brand-blue transition-colors duration-150 hover:bg-brand-blue-light/20 active:scale-95"
      >
        ‹
      </button>
      <span className="text-sm font-semibold capitalize text-slate-800">{periodeLabel(periode)}</span>
      <button
        type="button"
        onClick={() => onChange(verschuifPeriode(periode, 1))}
        aria-label="Volgende periode"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-brand-blue transition-colors duration-150 hover:bg-brand-blue-light/20 active:scale-95"
      >
        ›
      </button>
    </div>
  )
}

export function PeriodeKiezer({
  periode,
  onChange,
  vergelijkPeriode,
  onVergelijkPeriodeChange,
}: {
  periode: Periode
  onChange: (periode: Periode) => void
  /** null = vergelijken staat uit. */
  vergelijkPeriode: Periode | null
  onVergelijkPeriodeChange: (periode: Periode | null) => void
}) {
  const wisselType = (type: PeriodeType) => {
    if (type === periode.type) return
    onChange({ type, anker: new Date() })
  }

  const toggleVergelijken = (aan: boolean) => {
    onVergelijkPeriodeChange(aan ? vorigePeriode(periode) : null)
  }

  const wisselVergelijkType = (type: PeriodeType) => {
    if (!vergelijkPeriode || type === vergelijkPeriode.type) return
    onVergelijkPeriodeChange({ type, anker: new Date(periode.anker) })
  }

  return (
    <div className="card mb-5 flex flex-col gap-3 px-4 py-3.5">
      <TypeChips actief={periode.type} opties={PRIMAIRE_TYPES} onChange={wisselType} />

      {periode.type !== 'alles' && (
        <div className="border-t border-slate-100 pt-3">
          <PeriodeNav periode={periode} onChange={onChange} />
        </div>
      )}

      {periode.type !== 'alles' && (
        <label className="flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={vergelijkPeriode !== null}
            onChange={(e) => toggleVergelijken(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/40"
          />
          Vergelijk met een andere periode
        </label>
      )}

      {vergelijkPeriode && (
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Vergelijken met</p>
          <TypeChips actief={vergelijkPeriode.type} opties={VERGELIJK_TYPES} onChange={wisselVergelijkType} />
          <PeriodeNav periode={vergelijkPeriode} onChange={onVergelijkPeriodeChange} />
        </div>
      )}
    </div>
  )
}
