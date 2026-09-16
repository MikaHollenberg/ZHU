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
