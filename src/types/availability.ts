export type BeschikbaarheidType = 'hele_dag_beschikbaar' | 'hele_dag_onbeschikbaar' | 'tijdvak'
export type BeschikbaarheidStatus = 'open' | 'ingepland'

export interface Beschikbaarheid {
  id: string
  cursist_id: string
  datum: string
  type: BeschikbaarheidType
  starttijd: string | null
  eindtijd: string | null
  status: BeschikbaarheidStatus
  aangemaakt_op: string
}
