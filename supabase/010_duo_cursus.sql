-- ============================================================
-- Priveles-portal Zeilschool — duo-cursus (2 personen per les)
-- Voer dit uit in de SQL Editor.
--
-- Ontwerpkeuze: de cursist (boeker) geeft de keuze privéles/duo-cursus en
-- de gegevens van een eventuele tweede persoon door bij het doorgeven van
-- beschikbaarheid (dat is in deze app het "boekmoment"). Wanneer de
-- beheerder vervolgens een les inplant, worden deze gegevens overgenomen
-- op de les zelf. De beheerder kan dit ook zelf invullen/overschrijven
-- als er nog geen beschikbaarheid met deze keuze bestaat.
-- ============================================================

create type les_soort as enum ('priveles', 'duo_cursus');

-- ------------------------------------------------------------
-- Tabel: tweede_persoon
-- ------------------------------------------------------------
create table public.tweede_persoon (
  id uuid primary key default gen_random_uuid(),
  boeker_id uuid not null references public.profiles (id) on delete cascade,
  voornaam text not null,
  achternaam text not null,
  email text not null,
  telefoonnummer text,
  geboortedatum date,
  geboorteplaats text,
  aangemaakt_op timestamptz not null default now()
);

alter table public.tweede_persoon enable row level security;

-- Alleen de boeker zelf en de beheerder mogen deze gegevens zien — nooit andere cursisten.
create policy "Boeker ziet eigen tweede personen"
  on public.tweede_persoon for select
  using (auth.uid() = boeker_id or public.is_beheerder());

create policy "Boeker voegt eigen tweede persoon toe"
  on public.tweede_persoon for insert
  with check ((auth.uid() = boeker_id and not public.is_gearchiveerd()) or public.is_beheerder());

create policy "Boeker wijzigt eigen tweede persoon"
  on public.tweede_persoon for update
  using ((auth.uid() = boeker_id and not public.is_gearchiveerd()) or public.is_beheerder());

create policy "Boeker verwijdert eigen tweede persoon"
  on public.tweede_persoon for delete
  using ((auth.uid() = boeker_id and not public.is_gearchiveerd()) or public.is_beheerder());

-- ------------------------------------------------------------
-- Beschikbaarheid: soort + tweede persoon
-- ------------------------------------------------------------
alter table public.beschikbaarheid add column soort les_soort not null default 'priveles';
alter table public.beschikbaarheid add column tweede_persoon_id uuid references public.tweede_persoon (id);

alter table public.beschikbaarheid add constraint beschikbaarheid_duo_check check (
  (soort = 'duo_cursus' and tweede_persoon_id is not null)
  or (soort = 'priveles' and tweede_persoon_id is null)
);

-- ------------------------------------------------------------
-- Lessen: soort + tweede persoon
-- ------------------------------------------------------------
alter table public.lessen add column soort les_soort not null default 'priveles';
alter table public.lessen add column tweede_persoon_id uuid references public.tweede_persoon (id);

alter table public.lessen add constraint lessen_duo_check check (
  (soort = 'duo_cursus' and tweede_persoon_id is not null)
  or (soort = 'priveles' and tweede_persoon_id is null)
);

-- ------------------------------------------------------------
-- plan_les: nu ook soort + tweede_persoon_id overnemen.
-- ------------------------------------------------------------
create or replace function public.plan_les(
  p_cursist_id uuid,
  p_datum date,
  p_starttijd time,
  p_eindtijd time,
  p_beschikbaarheid_id uuid default null,
  p_soort les_soort default 'priveles',
  p_tweede_persoon_id uuid default null
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

  insert into public.lessen (cursist_id, datum, starttijd, eindtijd, status, beschikbaarheid_id, soort, tweede_persoon_id)
  values (p_cursist_id, p_datum, p_starttijd, p_eindtijd, 'gepland', p_beschikbaarheid_id, p_soort, p_tweede_persoon_id)
  returning * into v_les;

  if p_beschikbaarheid_id is not null then
    update public.beschikbaarheid
    set status = 'ingepland'
    where id = p_beschikbaarheid_id;
  end if;

  return v_les;
end;
$$;

-- ------------------------------------------------------------
-- verzet_les: soort + tweede_persoon_id blijven behouden bij verzetten.
-- ------------------------------------------------------------
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

  insert into public.lessen (cursist_id, datum, starttijd, eindtijd, status, oorspronkelijke_les_id, soort, tweede_persoon_id)
  values (v_oude.cursist_id, p_nieuwe_datum, p_nieuwe_starttijd, p_nieuwe_eindtijd, 'gepland', p_les_id, v_oude.soort, v_oude.tweede_persoon_id)
  returning * into v_nieuwe;

  if v_oude.beschikbaarheid_id is not null then
    update public.beschikbaarheid set status = 'open' where id = v_oude.beschikbaarheid_id;
  end if;

  return v_nieuwe;
end;
$$;
