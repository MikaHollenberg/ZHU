-- ============================================================
-- Priveles-portal Zeilschool — onthoud ook de gekozen lesvorm
-- (privéles / duo-cursus) per cursist, zodat "Jouw lesvorm" bovenaan
-- de beschikbaarheidspagina in één keer alles regelt: privéles of
-- duo-cursus (en welke vorm). Voer dit uit in de SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists standaard_soort les_soort;
