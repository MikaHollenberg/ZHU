import type { Discipline } from '../lib/disciplines'
import type { DuoCursusType } from '../lib/duoCursusType'

export type BeschikbaarheidType = 'hele_dag_beschikbaar' | 'hele_dag_onbeschikbaar' | 'tijdvak'
export type BeschikbaarheidStatus = 'open' | 'ingepland'
export type LesSoort = 'priveles' | 'duo_cursus'

export interface Beschikbaarheid {
  id: string
  cursist_id: string
  datum: string
  type: BeschikbaarheidType
  starttijd: string | null
  eindtijd: string | null
  status: BeschikbaarheidStatus
  soort: LesSoort
  tweede_persoon_id: string | null
  discipline: Discipline
  duo_cursus_type: DuoCursusType | null
  aangemaakt_op: string
}
