export type MeldingType =
  | 'nieuwe_registratie'
  | 'nieuwe_beschikbaarheid'
  | 'les_ingepland'
  | 'les_verzet'
  | 'les_geannuleerd'
  | 'instructeur_aanvraag'

export interface Melding {
  id: string
  type: MeldingType
  titel: string
  omschrijving: string | null
  link: string | null
  gelezen: boolean
  aangemaakt_op: string
}
