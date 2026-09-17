-- ============================================================
-- Migratie 021: meldingen (notificatie-postvak voor de beheerder)
-- ============================================================
-- Eén tabel met een rij per gebeurtenis waar de beheerder van op de hoogte
-- moet zijn: nieuwe registratie, nieuwe beschikbaarheid, les ingepland/
-- verzet/geannuleerd, instructeur die zich aanmeldt voor een les. Alle rijen
-- worden geschreven door SECURITY DEFINER-triggerfuncties hieronder — nooit
-- rechtstreeks vanuit de frontend — zodat een cursist of instructeur nooit
-- zelf een melding kan plaatsen, ook al triggert hún eigen actie de melding.

create table public.meldingen (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  titel text not null,
  omschrijving text,
  link text,
  gelezen boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

alter table public.meldingen enable row level security;

create policy "Beheerder leest meldingen"
  on public.meldingen for select
  using (public.is_beheerder());

create policy "Beheerder markeert meldingen gelezen/ongelezen"
  on public.meldingen for update
  using (public.is_beheerder())
  with check (public.is_beheerder());

create policy "Beheerder verwijdert meldingen"
  on public.meldingen for delete
  using (public.is_beheerder());

create index idx_meldingen_gelezen on public.meldingen (gelezen, aangemaakt_op desc);

-- ------------------------------------------------------------
-- Trigger: nieuwe registratie
-- ------------------------------------------------------------
create or replace function public.trg_meld_nieuwe_registratie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.meldingen (type, titel, omschrijving, link)
  values (
    'nieuwe_registratie',
    'Nieuwe registratie',
    trim(new.voornaam || ' ' || new.achternaam) || ' heeft een account aangemaakt (' ||
      case new.rol when 'instructeur' then 'instructeur' else 'cursist' end || ')',
    '/beheer/cursisten'
  );
  return new;
end;
$$;

create trigger on_profiles_nieuwe_registratie
  after insert on public.profiles
  for each row execute function public.trg_meld_nieuwe_registratie();

revoke execute on function public.trg_meld_nieuwe_registratie() from public, anon, authenticated;

-- ------------------------------------------------------------
-- Trigger: nieuwe beschikbaarheid doorgegeven
-- Vuurt alleen op een echte nieuwe rij (upsert-updates op een bestaande dag
-- lopen via de update-trigger van Postgres, niet deze insert-trigger).
-- ------------------------------------------------------------
create or replace function public.trg_meld_nieuwe_beschikbaarheid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_naam text;
begin
  select trim(voornaam || ' ' || achternaam) into v_naam from public.profiles where id = new.cursist_id;

  insert into public.meldingen (type, titel, omschrijving, link)
  values (
    'nieuwe_beschikbaarheid',
    'Nieuwe beschikbaarheid',
    coalesce(v_naam, 'Iemand') || ' heeft beschikbaarheid doorgegeven voor ' || to_char(new.datum, 'DD-MM-YYYY'),
    '/beheer/beschikbaarheid'
  );
  return new;
end;
$$;

create trigger on_beschikbaarheid_nieuw
  after insert on public.beschikbaarheid
  for each row execute function public.trg_meld_nieuwe_beschikbaarheid();

revoke execute on function public.trg_meld_nieuwe_beschikbaarheid() from public, anon, authenticated;

-- ------------------------------------------------------------
-- Trigger: les ingepland / verzet / geannuleerd / instructeur-aanvraag
-- Eén trigger op lessen die INSERT en UPDATE onderscheidt via TG_OP en de
-- oude/nieuwe kolomwaarden, zodat plan_les/verzet_les/annuleer_les en
-- meld_aan_als_instructeur niet allemaal zelf een melding hoeven te
-- schrijven (en dus ook niet allemaal security definer hoeven te worden).
-- ------------------------------------------------------------
create or replace function public.trg_meld_les_wijziging()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_naam text;
  v_wanneer text;
begin
  select trim(voornaam || ' ' || achternaam) into v_naam from public.profiles where id = new.cursist_id;
  v_wanneer := to_char(new.datum, 'DD-MM-YYYY') || ' ' || to_char(new.starttijd, 'HH24:MI');

  if tg_op = 'INSERT' and new.oorspronkelijke_les_id is null then
    insert into public.meldingen (type, titel, omschrijving, link)
    values (
      'les_ingepland',
      'Les ingepland',
      coalesce(v_naam, 'Cursist') || ' — ' || v_wanneer,
      '/beheer/beschikbaarheid'
    );
  elsif tg_op = 'INSERT' and new.oorspronkelijke_les_id is not null then
    insert into public.meldingen (type, titel, omschrijving, link)
    values (
      'les_verzet',
      'Les verzet',
      coalesce(v_naam, 'Cursist') || ' — nu ' || v_wanneer,
      '/beheer/beschikbaarheid'
    );
  elsif tg_op = 'UPDATE' and new.status = 'geannuleerd' and old.status <> 'geannuleerd' then
    insert into public.meldingen (type, titel, omschrijving, link)
    values (
      'les_geannuleerd',
      'Les geannuleerd',
      coalesce(v_naam, 'Cursist') || ' — ' || v_wanneer,
      '/beheer/beschikbaarheid'
    );
  elsif tg_op = 'UPDATE' and new.instructeur_aanvraag_id is not null and old.instructeur_aanvraag_id is null then
    insert into public.meldingen (type, titel, omschrijving, link)
    values (
      'instructeur_aanvraag',
      'Instructeur meldt zich aan',
      (select trim(voornaam || ' ' || achternaam) from public.profiles where id = new.instructeur_aanvraag_id) ||
        ' wil lesgeven op ' || v_wanneer,
      '/'
    );
  end if;

  return new;
end;
$$;

create trigger on_lessen_wijziging
  after insert or update on public.lessen
  for each row execute function public.trg_meld_les_wijziging();

revoke execute on function public.trg_meld_les_wijziging() from public, anon, authenticated;
