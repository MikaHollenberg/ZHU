export type DuoCursusType = 'vijf_keer_twee_uur' | 'twee_daagse'

export const DUO_CURSUS_TYPE_LABELS: Record<DuoCursusType, string> = {
  vijf_keer_twee_uur: '5x2 uur',
  twee_daagse: '2-daagse cursus',
}

// Korte variant voor krappe ruimtes zoals roostercellen.
export const DUO_CURSUS_TYPE_SHORT_LABELS: Record<DuoCursusType, string> = {
  vijf_keer_twee_uur: '5x2',
  twee_daagse: '2-daags',
}

export const DUO_CURSUS_TYPES = Object.keys(DUO_CURSUS_TYPE_LABELS) as DuoCursusType[]
