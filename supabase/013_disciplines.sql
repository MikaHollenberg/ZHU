-- ============================================================
-- Priveles-portal Zeilschool — disciplines (boottypes) met kleur
-- Voer dit uit in de SQL Editor.
-- ============================================================

create type discipline as enum ('polyvalk', 'fox22', 'windsurf');

alter table public.beschikbaarheid add column discipline discipline not null default 'polyvalk';
alter table public.lessen add column discipline discipline not null default 'polyvalk';

-- plan_les: nu ook discipline overnemen.
create or replace function public.plan_les(
  p_cursist_id uuid,
  p_datum date,
  p_starttijd time,
  p_eindtijd time,
  p_beschikbaarheid_id uuid default null,
  p_soort les_soort default 'priveles',
  p_tweede_persoon_id uuid default null,
  p_discipline discipline default 'polyvalk'
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

  if p_eindtijd - p_starttijd < interval '2 hours' then
    raise exception 'Een les moet minimaal 2 uur duren';
  end if;

  if p_soort = 'duo_cursus' and p_tweede_persoon_id is null then
    raise exception 'Bij een duo-cursus is een tweede persoon verplicht';
  end if;

  insert into public.lessen (
    cursist_id, datum, starttijd, eindtijd, status, beschikbaarheid_id,
    soort, tweede_persoon_id, discipline
  )
  values (
    p_cursist_id, p_datum, p_starttijd, p_eindtijd, 'gepland', p_beschikbaarheid_id,
    p_soort, p_tweede_persoon_id, p_discipline
  )
  returning * into v_les;

  if p_beschikbaarheid_id is not null then
    update public.beschikbaarheid
    set status = 'ingepland'
    where id = p_beschikbaarheid_id;
  end if;

  return v_les;
end;
$$;

-- verzet_les: discipline blijft behouden bij verzetten.
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

  if p_nieuwe_eindtijd - p_nieuwe_starttijd < interval '2 hours' then
    raise exception 'Een les moet minimaal 2 uur duren';
  end if;

  select * into v_oude from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;

  update public.lessen
  set status = 'verzet', label_id = p_label_id
  where id = p_les_id;

  insert into public.lessen (
    cursist_id, datum, starttijd, eindtijd, status, oorspronkelijke_les_id,
    soort, tweede_persoon_id, instructeur_id, discipline
  )
  values (
    v_oude.cursist_id, p_nieuwe_datum, p_nieuwe_starttijd, p_nieuwe_eindtijd, 'gepland', p_les_id,
    v_oude.soort, v_oude.tweede_persoon_id, v_oude.instructeur_id, v_oude.discipline
  )
  returning * into v_nieuwe;

  if v_oude.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_oude.beschikbaarheid_id;
  end if;

  return v_nieuwe;
end;
$$;
