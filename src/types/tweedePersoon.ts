export interface TweedePersoon {
  id: string
  boeker_id: string
  voornaam: string
  achternaam: string
  email: string
  telefoonnummer: string | null
  geboortedatum: string | null
  geboorteplaats: string | null
  teamnaam: string | null
  aangemaakt_op: string
}

export interface TweedePersoonInvoer {
  voornaam: string
  achternaam: string
  email: string
  telefoonnummer: string
  geboortedatum: string
  geboorteplaats: string
  teamnaam: string
}

export const LEEG_TWEEDE_PERSOON: TweedePersoonInvoer = {
  voornaam: '',
  achternaam: '',
  email: '',
  telefoonnummer: '',
  geboortedatum: '',
  geboorteplaats: '',
  teamnaam: '',
}
