-- ============================================================
-- Priveles-portal Zeilschool — bugfix
-- verzet_les nam de instructeur-koppeling niet over naar de nieuwe les.
-- Voer dit uit in de SQL Editor.
-- ============================================================

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
    soort, tweede_persoon_id, instructeur_id
  )
  values (
    v_oude.cursist_id, p_nieuwe_datum, p_nieuwe_starttijd, p_nieuwe_eindtijd, 'gepland', p_les_id,
    v_oude.soort, v_oude.tweede_persoon_id, v_oude.instructeur_id
  )
  returning * into v_nieuwe;

  if v_oude.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_oude.beschikbaarheid_id;
  end if;

  return v_nieuwe;
end;
$$;
