import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '../types/profile'

// Aantal openstaande instructeur-aanvragen die op actie wachten: voor de
// beheerder alle aanvragen die nog goedgekeurd moeten worden, voor de
// instructeur zijn eigen aanvragen die nog niet goedgekeurd zijn. Gebruikt
// door de navigatie-badge (Layout.tsx) en de startpagina (Home.tsx).
export function usePendingAanvragen(user: User | null, profile: Profile | null) {
  const [pendingCount, setPendingCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (!user || !profile || profile.gearchiveerd) {
      setPendingCount(0)
      return
    }
    let cancelled = false
    const fetchPending = async () => {
      if (profile.rol === 'beheerder') {
        const { count } = await supabase
          .from('lessen')
          .select('id', { count: 'exact', head: true })
          .not('instructeur_aanvraag_id', 'is', null)
          .is('instructeur_id', null)
        if (!cancelled) setPendingCount(count ?? 0)
      } else if (profile.rol === 'instructeur') {
        const { count } = await supabase
          .from('lessen')
          .select('id', { count: 'exact', head: true })
          .eq('instructeur_aanvraag_id', user.id)
          .is('instructeur_id', null)
        if (!cancelled) setPendingCount(count ?? 0)
      } else {
        setPendingCount(0)
      }
    }
    fetchPending()
    return () => {
      cancelled = true
    }
  }, [user, profile, location.pathname])

  return pendingCount
}
