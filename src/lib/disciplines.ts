export type Discipline = 'polyvalk' | 'fox22' | 'windsurf'

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  polyvalk: 'Polyvalk',
  fox22: 'Fox22',
  windsurf: 'Windsurf',
}

// Eén centrale plek voor de badge-stijl per discipline. Kleur staat nooit
// alleen — het tekstlabel (DISCIPLINE_LABELS) hoort er altijd bij, voor
// mensen die kleuren lastig kunnen onderscheiden.
export const DISCIPLINE_BADGE_CLASSES: Record<Discipline, string> = {
  polyvalk: 'bg-discipline-polyvalk text-white',
  fox22: 'bg-discipline-fox22 text-slate-900',
  windsurf: 'bg-discipline-windsurf text-white',
}

export const DISCIPLINES = Object.keys(DISCIPLINE_LABELS) as Discipline[]
