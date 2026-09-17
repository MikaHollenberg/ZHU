const DAG_AFKORTINGEN = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA']

function naarDate(datum: string) {
  return new Date(`${datum}T00:00:00`)
}

export function dagAfkorting(datum: string): string {
  return DAG_AFKORTINGEN[naarDate(datum).getDay()]
}

export function dagNummer(datum: string): number {
  return naarDate(datum).getDate()
}

// "Vandaag" / "Morgen" / "Over N dagen" — voor de "volgende les"-kaart op de startpagina.
export function countdownLabel(datum: string): string {
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const diffDagen = Math.round((naarDate(datum).getTime() - vandaag.getTime()) / 86_400_000)
  if (diffDagen <= 0) return 'Vandaag'
  if (diffDagen === 1) return 'Morgen'
  return `Over ${diffDagen} dagen`
}

// "Zojuist" / "5 min geleden" / "3 uur geleden" / "gisteren" / een korte datum
// — voor tijdstempels in de meldingen-inbox.
export function tijdGeleden(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minuten = Math.floor(diffMs / 60_000)
  if (minuten < 1) return 'Zojuist'
  if (minuten < 60) return `${minuten} min geleden`
  const uren = Math.floor(minuten / 60)
  if (uren < 24) return `${uren} uur geleden`
  const dagen = Math.floor(uren / 24)
  if (dagen === 1) return 'Gisteren'
  if (dagen < 7) return `${dagen} dagen geleden`
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
