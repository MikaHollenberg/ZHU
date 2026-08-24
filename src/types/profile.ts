export type UserRole = 'cursist' | 'beheerder'

export interface Profile {
  id: string
  voornaam: string
  achternaam: string
  email: string
  telefoonnummer: string | null
  geboortedatum: string | null
  geboorteplaats: string | null
  rol: UserRole
  aangemaakt_op: string
}
