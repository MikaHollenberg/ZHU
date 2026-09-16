-- Opruimen: drie verouderde overloads van plan_les bleven bestaan uit
-- eerdere migraties (create or replace vervangt alleen exact dezelfde
-- signature, niet oudere varianten met minder parameters). De app roept
-- altijd alle 9 parameters aan, dus deze oudere versies zijn dode code —
-- maar wel nog los aanroepbaar via de REST-RPC, met een mutable search_path
-- en zonder de nieuwste validatie (bijv. duo_cursus_type-check). Opruimen.
drop function if exists public.plan_les(uuid, date, time, time, uuid);
drop function if exists public.plan_les(uuid, date, time, time, uuid, les_soort, uuid);
drop function if exists public.plan_les(uuid, date, time, time, uuid, les_soort, uuid, discipline);

-- EXECUTE stond via de impliciete PUBLIC-grant nog open voor iedereen,
-- ook al was expliciet van anon/authenticated gerevoked (PUBLIC-grants
-- werken los van rol-specifieke revokes). Nu wel echt dicht.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_role_escalation() from public;
