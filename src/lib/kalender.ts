export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const dag = (d.getDay() + 6) % 7 // maandag = 0
  d.setDate(d.getDate() - dag)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekDagen(referenceDate: Date): Date[] {
  const start = startOfWeek(referenceDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export interface KalenderWeek {
  weekNummer: number
  dagen: Date[]
}

export function getMaandWeken(jaar: number, maand: number): KalenderWeek[] {
  const eerste = new Date(jaar, maand, 1)
  const laatste = new Date(jaar, maand + 1, 0)

  const start = startOfWeek(eerste)
  const eind = startOfWeek(laatste)

  const weken: KalenderWeek[] = []
  const cursor = new Date(start)
  while (cursor <= eind) {
    const dagen = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      return d
    })
    weken.push({ weekNummer: isoWeekNumber(cursor), dagen })
    cursor.setDate(cursor.getDate() + 7)
  }
  return weken
}
