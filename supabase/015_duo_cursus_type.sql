-- ============================================================
-- Priveles-portal Zeilschool — duo-cursus opsplitsen in twee vormen
-- (5x2 uur / 2-daagse cursus). Blijft onder de bestaande 'duo_cursus'
-- soort vallen, dus de tweede-persoon-gegevens blijven ongewijzigd
-- werken. Voer dit uit in de SQL Editor.
-- ============================================================

create type duo_cursus_type as enum ('vijf_keer_twee_uur', 'twee_daagse');

-- ------------------------------------------------------------
-- beschikbaarheid: cursist geeft de vorm door zodra soort = duo_cursus.
-- ------------------------------------------------------------
alter table public.beschikbaarheid add column if not exists duo_cursus_type duo_cursus_type;

-- Bestaande duo-cursus-rijen (van vóór deze wijziging) hebben nog geen
-- vorm gekozen — die zetten we op '5x2 uur' zodat de nieuwe check
-- hieronder niet faalt op bestaande data.
update public.beschikbaarheid set duo_cursus_type = 'vijf_keer_twee_uur'
  where soort = 'duo_cursus' and duo_cursus_type is null;

alter table public.beschikbaarheid add constraint beschikbaarheid_duo_cursus_type_check check (
  (soort = 'duo_cursus' and duo_cursus_type is not null)
  or (soort = 'priveles' and duo_cursus_type is null)
);

-- ------------------------------------------------------------
-- lessen: vorm wordt overgenomen zodra ingepland (net als discipline).
-- ------------------------------------------------------------
alter table public.lessen add column if not exists duo_cursus_type duo_cursus_type;

update public.lessen set duo_cursus_type = 'vijf_keer_twee_uur'
  where soort = 'duo_cursus' and duo_cursus_type is null;

alter table public.lessen add constraint lessen_duo_cursus_type_check check (
  (soort = 'duo_cursus' and duo_cursus_type is not null)
  or (soort = 'priveles' and duo_cursus_type is null)
);

-- plan_les: nu ook duo_cursus_type overnemen.
create or replace function public.plan_les(
  p_cursist_id uuid,
  p_datum date,
  p_starttijd time,
  p_eindtijd time,
  p_beschikbaarheid_id uuid default null,
  p_soort les_soort default 'priveles',
  p_tweede_persoon_id uuid default null,
  p_discipline discipline default 'polyvalk',
  p_duo_cursus_type duo_cursus_type default null
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

  if p_soort = 'duo_cursus' and p_duo_cursus_type is null then
    raise exception 'Bij een duo-cursus is de vorm (5x2 uur of 2-daagse) verplicht';
  end if;

  insert into public.lessen (
    cursist_id, datum, starttijd, eindtijd, status, beschikbaarheid_id,
    soort, tweede_persoon_id, discipline, duo_cursus_type
  )
  values (
    p_cursist_id, p_datum, p_starttijd, p_eindtijd, 'gepland', p_beschikbaarheid_id,
    p_soort, p_tweede_persoon_id, p_discipline, p_duo_cursus_type
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

-- verzet_les: duo_cursus_type blijft behouden bij verzetten.
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
    soort, tweede_persoon_id, instructeur_id, discipline, duo_cursus_type
  )
  values (
    v_oude.cursist_id, p_nieuwe_datum, p_nieuwe_starttijd, p_nieuwe_eindtijd, 'gepland', p_les_id,
    v_oude.soort, v_oude.tweede_persoon_id, v_oude.instructeur_id, v_oude.discipline, v_oude.duo_cursus_type
  )
  returning * into v_nieuwe;

  if v_oude.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_oude.beschikbaarheid_id;
  end if;

  return v_nieuwe;
end;
$$;
