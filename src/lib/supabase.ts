import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Ontbrekende Supabase-configuratie. Vul VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in .env.local in.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
