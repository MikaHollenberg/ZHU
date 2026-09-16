import { DISCIPLINE_BAR_CLASSES, DISCIPLINE_LABELS } from '../lib/disciplines'
import type { Discipline } from '../lib/disciplines'
import { formatUren } from '../lib/stats'

type Rij = { discipline: Discipline; aantal: number; uren: number }

export function DisciplineBreakdown({ rows }: { rows: Rij[] }) {
  const max = Math.max(1, ...rows.map((r) => r.aantal))

  return (
    <div className="card flex h-full flex-col gap-3 px-5 py-4">
      <h3 className="text-sm font-semibold text-slate-700">Per discipline</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Nog geen lessen om te tonen.</p>
      ) : (
        rows.map((r) => (
          <div key={r.discipline} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700">{DISCIPLINE_LABELS[r.discipline]}</span>
              <span className="flex-none text-slate-500">
                {r.aantal} {r.aantal === 1 ? 'les' : 'lessen'} · {formatUren(r.uren)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${DISCIPLINE_BAR_CLASSES[r.discipline]}`}
                style={{ width: `${(r.aantal / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
