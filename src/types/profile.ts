import type { Discipline } from '../lib/disciplines'

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
  instructeur_goedgekeurd: boolean
  aangemaakt_op: string
}
