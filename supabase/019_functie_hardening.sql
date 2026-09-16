-- Vaste search_path op de les-RPC's (voorkomt search_path-kaping — een
-- kwaadwillende zou anders een object in een ander schema kunnen aanmaken
-- dat een onbedoelde functie/operator laat resolven binnen deze functies).
alter function public.plan_les(uuid, date, time, time, uuid, les_soort, uuid, discipline, duo_cursus_type) set search_path = public;
alter function public.verzet_les(uuid, date, time, time, uuid) set search_path = public;
alter function public.annuleer_les(uuid, uuid) set search_path = public;

-- Trigger-only functies (draaien automatisch via een trigger, nooit
-- rechtstreeks aangeroepen door de app) horen niet als publieke RPC
-- aanroepbaar te zijn. Dit heeft geen effect op de triggers zelf.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.prevent_role_escalation() from anon, authenticated;
