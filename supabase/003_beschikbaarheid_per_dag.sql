-- ============================================================
-- Priveles-portal Zeilschool — Fase 2 aanvulling 2
-- Voer dit uit NA supabase/002_beschikbaarheid_en_inplannen.sql
-- ============================================================

-- De nieuwe kalenderweergave werkt met maximaal één beschikbaarheid-rij
-- per cursist per dag (je klikt een dag aan en kiest een van de opties).
alter table public.beschikbaarheid
  add constraint beschikbaarheid_cursist_datum_unique unique (cursist_id, datum);
