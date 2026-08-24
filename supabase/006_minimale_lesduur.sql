-- ============================================================
-- Priveles-portal Zeilschool — minimale duur voor een tijdvak
-- Voer dit uit in de SQL Editor. Een opgegeven tijdvak moet minimaal
-- 2 uur duren (voorkomt te korte, onbruikbare beschikbaarheid).
-- ============================================================

alter table public.beschikbaarheid drop constraint if exists tijdvak_tijden_check;

alter table public.beschikbaarheid add constraint tijdvak_tijden_check check (
  (type = 'tijdvak' and starttijd is not null and eindtijd is not null and eindtijd - starttijd >= interval '2 hours')
  or (type <> 'tijdvak' and starttijd is null and eindtijd is null)
);
