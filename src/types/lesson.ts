import type { LesSoort } from './availability'

export type LesStatus = 'gepland' | 'verzet' | 'geannuleerd'
export type { LesSoort }

export interface Les {
  id: string
  cursist_id: string
  datum: string
  starttijd: string
  eindtijd: string
  status: LesStatus
  label_id: string | null
  oorspronkelijke_les_id: string | null
  beschikbaarheid_id: string | null
  soort: LesSoort
  tweede_persoon_id: string | null
  aangemaakt_op: string
}

export interface Label {
  id: string
  naam: string
  type: 'verzetten' | 'annuleren' | 'beide'
}
