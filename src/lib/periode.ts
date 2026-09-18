import { isoWeekNumber, startOfWeek, toDateKey } from './kalender'

export type PeriodeType = 'week' | 'maand' | 'jaar' | 'alles'

export const PERIODE_TYPE_LABELS: Record<PeriodeType, string> = {
  week: 'Week',
  maand: 'Maand',
  jaar: 'Jaar',
  alles: 'Alles',
}

export interface Periode {
  type: PeriodeType
  /** Eén dag binnen de periode — bepaalt welke week/maand/jaar bedoeld is. */
  anker: Date
}

/** Begin (inclusief) en eind (exclusief) als datumsleutels, of null bij 'alles' (geen filter). */
export function periodeBereik(periode: Periode): { start: string | null; eindExclusief: string | null } {
  const { type, anker } = periode

  if (type === 'week') {
    const start = startOfWeek(anker)
    const eind = new Date(start)
    eind.setDate(eind.getDate() + 7)
    return { start: toDateKey(start), eindExclusief: toDateKey(eind) }
  }

  if (type === 'maand') {
    const start = new Date(anker.getFullYear(), anker.getMonth(), 1)
    const eind = new Date(anker.getFullYear(), anker.getMonth() + 1, 1)
    return { start: toDateKey(start), eindExclusief: toDateKey(eind) }
  }

  if (type === 'jaar') {
    const start = new Date(anker.getFullYear(), 0, 1)
    const eind = new Date(anker.getFullYear() + 1, 0, 1)
    return { start: toDateKey(start), eindExclusief: toDateKey(eind) }
  }

  return { start: null, eindExclusief: null }
}

export function verschuifPeriode(periode: Periode, delta: number): Periode {
  const anker = new Date(periode.anker)
  if (periode.type === 'week') anker.setDate(anker.getDate() + delta * 7)
  else if (periode.type === 'maand') anker.setMonth(anker.getMonth() + delta)
  else if (periode.type === 'jaar') anker.setFullYear(anker.getFullYear() + delta)
  return { ...periode, anker }
}

/** De vorige periode van hetzelfde type — voor de vergelijk-functie. */
export function vorigePeriode(periode: Periode): Periode {
  return verschuifPeriode(periode, -1)
}

export function periodeLabel(periode: Periode): string {
  const { type, anker } = periode
  if (type === 'week') return `Week ${isoWeekNumber(anker)} · ${anker.getFullYear()}`
  if (type === 'maand') return anker.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  if (type === 'jaar') return String(anker.getFullYear())
  return 'Alle tijd'
}

export function lesInPeriode(datum: string, periode: Periode): boolean {
  const { start, eindExclusief } = periodeBereik(periode)
  if (!start || !eindExclusief) return true
  return datum >= start && datum < eindExclusief
}
