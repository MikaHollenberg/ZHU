-- Instructeurs mochten zichzelf via meld_af_als_instructeur ook loskoppelen
-- van een al ingeplande les (instructeur_id gezet). Dat is niet meer gewenst:
-- alleen het intrekken van een nog niet goedgekeurde aanvraag mag nog zelf,
-- een ingeplande les afmelden moet via de beheerder (net als verzetten/
-- annuleren voor cursisten al werkt).
create or replace function public.meld_af_als_instructeur(p_les_id uuid)
returns public.lessen
language plpgsql
security definer
set search_path = public
as $$
declare
  v_les public.lessen;
begin
  if not public.is_instructeur() then
    raise exception 'Alleen instructeurs kunnen een aanvraag intrekken';
  end if;

  select * into v_les from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;

  if v_les.instructeur_id = auth.uid() then
    raise exception 'Je kunt jezelf niet afmelden voor een ingeplande les — neem contact op met de beheerder.';
  end if;

  if v_les.instructeur_aanvraag_id is distinct from auth.uid() then
    raise exception 'Je bent niet gekoppeld aan deze les';
  end if;

  update public.lessen
  set instructeur_aanvraag_id = null
  where id = p_les_id
  returning * into v_les;

  return v_les;
end;
$$;
