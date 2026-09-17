import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Melding } from '../types/melding'
import type { Profile } from '../types/profile'

const POLL_INTERVAL_MS = 60_000
const MAX_MELDINGEN = 50

/**
 * Meldingen-postvak voor de beheerder. Eén keer aanroepen in Layout.tsx zodat
 * zowel de desktop- als mobiele bel-knop dezelfde data delen i.p.v. allebei
 * los te pollen.
 */
export function useMeldingen(profile: Profile | null) {
  const [meldingen, setMeldingen] = useState<Melding[]>([])
  const isBeheerder = profile?.rol === 'beheerder' && !profile.gearchiveerd

  const vernieuw = useCallback(async () => {
    if (!isBeheerder) return
    const { data } = await supabase
      .from('meldingen')
      .select('*')
      .order('aangemaakt_op', { ascending: false })
      .limit(MAX_MELDINGEN)
    setMeldingen((data as Melding[] | null) ?? [])
  }, [isBeheerder])

  useEffect(() => {
    if (!isBeheerder) {
      setMeldingen([])
      return
    }
    vernieuw()
    const interval = window.setInterval(vernieuw, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [isBeheerder, vernieuw])

  const markeerGelezen = useCallback(async (id: string, gelezen: boolean) => {
    setMeldingen((prev) => prev.map((m) => (m.id === id ? { ...m, gelezen } : m)))
    await supabase.from('meldingen').update({ gelezen }).eq('id', id)
  }, [])

  const verwijder = useCallback(async (id: string) => {
    setMeldingen((prev) => prev.filter((m) => m.id !== id))
    await supabase.from('meldingen').delete().eq('id', id)
  }, [])

  const ongelezenAantal = meldingen.filter((m) => !m.gelezen).length

  return { meldingen, ongelezenAantal, vernieuw, markeerGelezen, verwijder }
}
