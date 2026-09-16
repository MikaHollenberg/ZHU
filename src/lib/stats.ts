import type { Les } from '../types/lesson'

// Aantal uren van een les, berekend uit start- en eindtijd ("HH:MM:SS").
export function lesUren(les: Pick<Les, 'starttijd' | 'eindtijd'>): number {
  const [sh, sm] = les.starttijd.slice(0, 5).split(':').map(Number)
  const [eh, em] = les.eindtijd.slice(0, 5).split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

// Aantal begeleide personen: een duo-cursus telt als 2, een privéles als 1.
export function lesPersonen(les: Pick<Les, 'soort'>): number {
  return les.soort === 'duo_cursus' ? 2 : 1
}

export function formatUren(uren: number): string {
  const afgerond = Math.round(uren * 10) / 10
  return `${afgerond.toLocaleString('nl-NL')} uur`
}
