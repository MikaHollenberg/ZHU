-- ============================================================
-- Priveles-portal Zeilschool — Fase 2/3 uitbreiding: roosteroverzicht
-- Voer dit uit NA de eerdere migraties, eenmalig, in de SQL Editor.
-- ============================================================

-- Koppeling tussen een les en de beschikbaarheid waarop hij is ingepland,
-- zodat we bij verzetten/annuleren de beschikbaarheid weer kunnen vrijgeven.
alter table public.lessen
  add column if not exists beschikbaarheid_id uuid references public.beschikbaarheid (id);

-- plan_les: nu ook beschikbaarheid_id opslaan op de les zelf.
create or replace function public.plan_les(
  p_cursist_id uuid,
  p_datum date,
  p_starttijd time,
  p_eindtijd time,
  p_beschikbaarheid_id uuid default null
)
returns public.lessen
language plpgsql
as $$
declare
  v_les public.lessen;
begin
  if not public.is_beheerder() then
    raise exception 'Alleen de beheerder mag lessen inplannen';
  end if;

  insert into public.lessen (cursist_id, datum, starttijd, eindtijd, status, beschikbaarheid_id)
  values (p_cursist_id, p_datum, p_starttijd, p_eindtijd, 'gepland', p_beschikbaarheid_id)
  returning * into v_les;

  if p_beschikbaarheid_id is not null then
    update public.beschikbaarheid
    set status = 'ingepland'
    where id = p_beschikbaarheid_id;
  end if;

  return v_les;
end;
$$;

-- Les verzetten: zet de oude les op 'verzet' (met reden) en maakt een
-- nieuwe geplande les aan op de nieuwe datum/tijd, met verwijzing naar de
-- oorspronkelijke les. Geeft de oorspronkelijke beschikbaarheid weer vrij.
create or replace function public.verzet_les(
  p_les_id uuid,
  p_nieuwe_datum date,
  p_nieuwe_starttijd time,
  p_nieuwe_eindtijd time,
  p_label_id uuid
)
returns public.lessen
language plpgsql
as $$
declare
  v_oude public.lessen;
  v_nieuwe public.lessen;
begin
  if not public.is_beheerder() then
    raise exception 'Alleen de beheerder mag lessen verzetten';
  end if;

  select * into v_oude from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;

  update public.lessen
  set status = 'verzet', label_id = p_label_id
  where id = p_les_id;

  insert into public.lessen (cursist_id, datum, starttijd, eindtijd, status, oorspronkelijke_les_id)
  values (v_oude.cursist_id, p_nieuwe_datum, p_nieuwe_starttijd, p_nieuwe_eindtijd, 'gepland', p_les_id)
  returning * into v_nieuwe;

  if v_oude.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_oude.beschikbaarheid_id;
  end if;

  return v_nieuwe;
end;
$$;

-- Les annuleren: zet de les op 'geannuleerd' (met reden) en geeft de
-- gekoppelde beschikbaarheid weer vrij.
create or replace function public.annuleer_les(
  p_les_id uuid,
  p_label_id uuid
)
returns public.lessen
language plpgsql
as $$
declare
  v_les public.lessen;
begin
  if not public.is_beheerder() then
    raise exception 'Alleen de beheerder mag lessen annuleren';
  end if;

  update public.lessen
  set status = 'geannuleerd', label_id = p_label_id
  where id = p_les_id
  returning * into v_les;

  if v_les.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_les.beschikbaarheid_id;
  end if;

  return v_les;
end;
$$;
