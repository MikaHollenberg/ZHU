-- ============================================================
-- Priveles-portal Zeilschool — onthoud de gekozen duo-cursusvorm
-- (5x2 uur / 2-daagse) per cursist, zodat die niet elke keer opnieuw
-- gekozen hoeft te worden bij het doorgeven van beschikbaarheid.
-- Voer dit uit in de SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists standaard_duo_cursus_type duo_cursus_type;
