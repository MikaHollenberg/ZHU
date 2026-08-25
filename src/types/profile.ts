import type { Discipline } from '../lib/disciplines'
import type { DuoCursusType } from '../lib/duoCursusType'
import type { LesSoort } from './availability'

export type UserRole = 'cursist' | 'beheerder' | 'instructeur'

export interface Profile {
  id: string
  voornaam: string
  achternaam: string
  email: string
  telefoonnummer: string | null
  geboortedatum: string | null
  geboorteplaats: string | null
  rol: UserRole
  gearchiveerd: boolean
  standaard_discipline: Discipline | null
  standaard_soort: LesSoort | null
  standaard_duo_cursus_type: DuoCursusType | null
  instructeur_goedgekeurd: boolean
  aangemaakt_op: string
}
