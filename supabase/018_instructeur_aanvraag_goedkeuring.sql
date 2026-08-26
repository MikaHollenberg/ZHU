-- ============================================================
-- Priveles-portal Zeilschool — instructeur-aanvraag per les moet
-- door de beheerder worden goedgekeurd voordat de instructeur
-- daadwerkelijk aan de les gekoppeld wordt (instructeur_id).
-- Een instructeur die "Aanmelden" klikt zet nu alleen nog
-- instructeur_aanvraag_id — pas na goedkeuring door de beheerder
-- wordt dat de echte instructeur_id.
-- Voer dit uit in de SQL Editor.
-- ============================================================

alter table public.lessen add column if not exists instructeur_aanvraag_id uuid references public.profiles (id);

-- meld_aan_als_instructeur: zet nu een aanvraag i.p.v. direct de koppeling.
create or replace function public.meld_aan_als_instructeur(p_les_id uuid)
returns public.lessen
language plpgsql
security definer
set search_path = public
as $$
declare
  v_les public.lessen;
  v_goedgekeurd boolean;
begin
  if not public.is_instructeur() then
    raise exception 'Alleen instructeurs kunnen zich aanmelden voor een les';
  end if;

  select instructeur_goedgekeurd into v_goedgekeurd from public.profiles where id = auth.uid();
  if not coalesce(v_goedgekeurd, false) then
    raise exception 'Je account moet eerst door de beheerder worden goedgekeurd voordat je een les kunt claimen';
  end if;

  select * into v_les from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;
  if v_les.instructeur_id is not null then
    raise exception 'Deze les heeft al een instructeur';
  end if;
  if v_les.instructeur_aanvraag_id is not null then
    raise exception 'Deze les heeft al een aanvraag in behandeling';
  end if;
  if v_les.status <> 'gepland' then
    raise exception 'Deze les staat niet meer open';
  end if;

  update public.lessen set instructeur_aanvraag_id = auth.uid() where id = p_les_id
  returning * into v_les;

  return v_les;
end;
$$;

-- meld_af_als_instructeur: trekt zowel een openstaande aanvraag als een
-- bevestigde koppeling in, van de ingelogde instructeur zelf.
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
    raise exception 'Alleen instructeurs kunnen zich afmelden';
  end if;

  update public.lessen
  set
    instructeur_id = case when instructeur_id = auth.uid() then null else instructeur_id end,
    instructeur_aanvraag_id = case when instructeur_aanvraag_id = auth.uid() then null else instructeur_aanvraag_id end
  where id = p_les_id and (instructeur_id = auth.uid() or instructeur_aanvraag_id = auth.uid())
  returning * into v_les;

  if not found then
    raise exception 'Je bent niet gekoppeld aan deze les';
  end if;

  return v_les;
end;
$$;
