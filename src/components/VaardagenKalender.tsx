import { useMemo } from 'react'
import { toDateKey } from '../lib/kalender'

const MAAND_NAMEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
// Alleen om de dinsdag/donderdag/zaterdag over te slaan, net als GitHub's contributiegrafiek.
const DAG_LABELS: Record<number, string> = { 0: 'ma', 2: 'wo', 4: 'vr' }

// Bouwt een jaar op als kolommen van 7 dagen (maandag boven, zondag onder),
// met lege cellen vóór 1 januari zodat de weekdagen overal op dezelfde rij staan.
function buildJaarGrid(jaar: number): (string | null)[][] {
  const start = new Date(jaar, 0, 1)
  const eind = new Date(jaar, 11, 31)
  const totaalDagen = Math.round((eind.getTime() - start.getTime()) / 86_400_000) + 1
  const startIso = (start.getDay() + 6) % 7 // 0 = maandag
  const kolommen = Math.ceil((startIso + totaalDagen) / 7)
  const grid: (string | null)[][] = Array.from({ length: kolommen }, () => Array(7).fill(null))
  for (let i = 0; i < totaalDagen; i++) {
    const cellIndex = startIso + i
    const kolom = Math.floor(cellIndex / 7)
    const rij = cellIndex % 7
    grid[kolom][rij] = toDateKey(new Date(jaar, 0, 1 + i))
  }
  return grid
}

export function VaardagenKalender({ jaar, datums }: { jaar: number; datums: string[] }) {
  const datumSet = useMemo(() => new Set(datums), [datums])
  const vandaag = useMemo(() => toDateKey(new Date()), [])
  const grid = useMemo(() => buildJaarGrid(jaar), [jaar])

  const maandLabels = useMemo(
    () =>
      grid.map((kolom) => {
        for (const dag of kolom) {
          if (!dag) continue
          const d = new Date(`${dag}T00:00:00`)
          if (d.getDate() === 1) return MAAND_NAMEN[d.getMonth()]
        }
        return ''
      }),
    [grid],
  )

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        {datumSet.size} {datumSet.size === 1 ? 'vaardag' : 'vaardagen'} dit jaar
      </p>
      <div className="overflow-x-auto pb-1" aria-hidden="true">
        <div className="inline-flex gap-[3px]">
          <div className="mr-1 flex flex-col gap-[3px] pt-[15px]">
            {Array.from({ length: 7 }, (_, rij) => (
              <span key={rij} className="flex h-[11px] items-center text-[9px] leading-none text-slate-400">
                {DAG_LABELS[rij] ?? ''}
              </span>
            ))}
          </div>
          {grid.map((kolom, kolomIndex) => (
            <div key={kolomIndex} className="flex flex-col gap-[3px]">
              <span className="block h-[12px] text-[9px] leading-none text-slate-400">
                {maandLabels[kolomIndex]}
              </span>
              {kolom.map((dag, rij) => {
                if (!dag) return <span key={rij} className="block h-[11px] w-[11px]" />
                const heeftLes = datumSet.has(dag)
                const isToekomst = dag > vandaag
                return (
                  <span
                    key={rij}
                    title={dag}
                    className={`block h-[11px] w-[11px] rounded-[2px] ${
                      heeftLes ? 'bg-brand-blue' : isToekomst ? 'bg-slate-50' : 'bg-slate-100'
                    }`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
