-- ============================================================
-- Priveles-portal Zeilschool — vaste duo-partner per cursist
-- Een cursist heeft voortaan maximaal één opgeslagen tweede persoon,
-- die bij elke duo-cursus wordt hergebruikt (voorgevuld) in plaats van
-- steeds opnieuw ingevuld te moeten worden.
-- Voer dit uit in de SQL Editor.
-- ============================================================

alter table public.tweede_persoon
  add constraint tweede_persoon_boeker_id_unique unique (boeker_id);
