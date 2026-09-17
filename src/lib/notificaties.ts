import { supabase } from './supabase'

type LesMailEvent = 'les_ingepland' | 'les_verzet' | 'les_geannuleerd' | 'aanvraag_goedgekeurd'

/**
 * Vraagt de send-lesmail Edge Function aan om een cursist/instructeur te
 * mailen over een les-wijziging. Bewust fire-and-forget: een mislukte mail
 * (bijv. omdat er nog geen e-maildienst is gekoppeld) mag de eigenlijke
 * les-actie nooit blokkeren of een foutmelding aan de beheerder tonen — die
 * is via de RPC al gewoon gelukt.
 */
export function stuurLesMail(event: LesMailEvent, lesId: string) {
  supabase.functions.invoke('send-lesmail', { body: { event, les_id: lesId } }).catch((err) => {
    console.warn('Kon les-mail niet versturen:', err)
  })
}
