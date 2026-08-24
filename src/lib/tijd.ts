const START_MINUTEN = 9 * 60 + 30 // 09:30
const EIND_MINUTEN = 21 * 60 // 21:00
const STAP = 30

export const TIJD_OPTIES = Array.from(
  { length: (EIND_MINUTEN - START_MINUTEN) / STAP + 1 },
  (_, i) => {
    const totaalMinuten = START_MINUTEN + i * STAP
    const uur = Math.floor(totaalMinuten / 60)
    const minuut = totaalMinuten % 60
    return `${String(uur).padStart(2, '0')}:${String(minuut).padStart(2, '0')}`
  },
)

export const MINIMALE_TIJDVAK_MINUTEN = 120

export function tijdNaarMinuten(tijd: string): number {
  const [uur, minuut] = tijd.split(':').map(Number)
  return uur * 60 + minuut
}
