-- ============================================================
-- Priveles-portal Zeilschool — Fase 1 database-opzet
-- Voer dit script eenmalig uit in de Supabase SQL editor
-- (Project → SQL Editor → New query → plak dit bestand → Run)
-- ============================================================

-- ------------------------------------------------------------
-- Types
-- ------------------------------------------------------------
create type user_role as enum ('cursist', 'beheerder', 'instructeur');
create type beschikbaarheid_type as enum ('hele_dag_beschikbaar', 'hele_dag_onbeschikbaar', 'tijdvak');
create type beschikbaarheid_status as enum ('open', 'ingepland');
create type les_status as enum ('gepland', 'verzet', 'geannuleerd');
create type label_type as enum ('verzetten', 'annuleren', 'beide');
create type les_soort as enum ('priveles', 'duo_cursus');
create type discipline as enum ('polyvalk', 'fox22', 'windsurf');

-- ------------------------------------------------------------
-- Tabel: profiles (cursisten + beheerder)
-- Gekoppeld 1-op-1 aan auth.users
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  voornaam text not null,
  achternaam text not null,
  email text not null,
  telefoonnummer text,
  geboortedatum date,
  geboorteplaats text,
  rol user_role not null default 'cursist',
  gearchiveerd boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helperfunctie: check of de ingelogde gebruiker beheerder is.
-- security definer + vaste search_path zodat de functie de RLS
-- op profiles zelf omzeilt (voorkomt oneindige recursie) en niet
-- gekaapt kan worden door een ander schema.
create or replace function public.is_beheerder()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'beheerder'
  );
$$;

create policy "Cursist ziet eigen profiel"
  on public.profiles for select
  using (auth.uid() = id or public.is_beheerder());

-- Helperfunctie: check of de ingelogde gebruiker gearchiveerd is.
create or replace function public.is_gearchiveerd()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select gearchiveerd from public.profiles where id = auth.uid()), false);
$$;

-- Helperfunctie: check of de ingelogde gebruiker instructeur is.
create or replace function public.is_instructeur()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'instructeur'
  );
$$;

-- Een gearchiveerde cursist kan zijn eigen profiel niet meer bewerken.
create policy "Cursist bewerkt eigen profiel"
  on public.profiles for update
  using ((auth.uid() = id and not public.is_gearchiveerd()) or public.is_beheerder());

-- Voorkom dat een cursist zichzelf tot beheerder promoveert via de update-policy hierboven.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is NULL wanneer dit via de SQL Editor / service role draait
  -- (geen ingelogde gebruiker) — alleen dan mag de rol vrij wijzigen.
  if new.rol <> old.rol and auth.uid() is not null and not public.is_beheerder() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;

create trigger enforce_role_immutable
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Automatisch een profiel aanmaken zodra iemand zich registreert via Supabase Auth.
-- De gegevens komen uit options.data bij supabase.auth.signUp() in de app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, voornaam, achternaam, email, telefoonnummer, geboortedatum, geboorteplaats)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'voornaam', ''),
    coalesce(new.raw_user_meta_data ->> 'achternaam', ''),
    new.email,
    new.raw_user_meta_data ->> 'telefoonnummer',
    nullif(new.raw_user_meta_data ->> 'geboortedatum', '')::date,
    new.raw_user_meta_data ->> 'geboorteplaats'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Tabel: tweede_persoon
-- Gegevens van een eventuele tweede persoon bij een duo-cursus.
-- Deze persoon krijgt geen eigen account; de boeker blijft het
-- aanspreekpunt.
-- ------------------------------------------------------------
-- Eén vaste duo-partner per boeker: wordt hergebruikt/voorgevuld bij
-- elke duo-cursus in plaats van steeds opnieuw ingevuld te worden.
create table public.tweede_persoon (
  id uuid primary key default gen_random_uuid(),
  boeker_id uuid not null references public.profiles (id) on delete cascade,
  voornaam text not null,
  achternaam text not null,
  email text not null,
  telefoonnummer text,
  geboortedatum date,
  geboorteplaats text,
  aangemaakt_op timestamptz not null default now(),
  constraint tweede_persoon_boeker_id_unique unique (boeker_id)
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
-- Tabel: beschikbaarheid
-- ------------------------------------------------------------
create table public.beschikbaarheid (
  id uuid primary key default gen_random_uuid(),
  cursist_id uuid not null references public.profiles (id) on delete cascade,
  datum date not null,
  type beschikbaarheid_type not null,
  starttijd time,
  eindtijd time,
  status beschikbaarheid_status not null default 'open',
  soort les_soort not null default 'priveles',
  tweede_persoon_id uuid references public.tweede_persoon (id),
  discipline discipline not null default 'polyvalk',
  aangemaakt_op timestamptz not null default now(),
  -- Een tijdvak moet minimaal 2 uur duren.
  constraint tijdvak_tijden_check check (
    (type = 'tijdvak' and starttijd is not null and eindtijd is not null and eindtijd - starttijd >= interval '2 hours')
    or (type <> 'tijdvak' and starttijd is null and eindtijd is null)
  ),
  constraint beschikbaarheid_cursist_datum_unique unique (cursist_id, datum),
  constraint beschikbaarheid_duo_check check (
    (soort = 'duo_cursus' and tweede_persoon_id is not null)
    or (soort = 'priveles' and tweede_persoon_id is null)
  )
);

alter table public.beschikbaarheid enable row level security;

create policy "Cursist ziet eigen beschikbaarheid"
  on public.beschikbaarheid for select
  using (auth.uid() = cursist_id or public.is_beheerder());

-- Een gearchiveerde cursist kan geen beschikbaarheid meer toevoegen.
create policy "Cursist voegt eigen beschikbaarheid toe"
  on public.beschikbaarheid for insert
  with check ((auth.uid() = cursist_id and not public.is_gearchiveerd()) or public.is_beheerder());

-- Een cursist mag alleen nog eigen open beschikbaarheid wijzigen/verwijderen
-- (niet meer zodra er een les op is ingepland, en niet meer zodra gearchiveerd).
-- Beheerder blijft alles mogen.
create policy "Cursist wijzigt eigen beschikbaarheid"
  on public.beschikbaarheid for update
  using ((auth.uid() = cursist_id and status = 'open' and not public.is_gearchiveerd()) or public.is_beheerder());

create policy "Cursist verwijdert eigen beschikbaarheid"
  on public.beschikbaarheid for delete
  using ((auth.uid() = cursist_id and status = 'open' and not public.is_gearchiveerd()) or public.is_beheerder());

-- ------------------------------------------------------------
-- Tabel: labels (redenen voor verzetten/annuleren, uitbreidbaar)
-- ------------------------------------------------------------
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  type label_type not null default 'beide',
  aangemaakt_op timestamptz not null default now()
);

alter table public.labels enable row level security;

create policy "Ingelogde gebruikers lezen labels"
  on public.labels for select
  using (auth.role() = 'authenticated');

create policy "Beheerder beheert labels"
  on public.labels for all
  using (public.is_beheerder())
  with check (public.is_beheerder());

insert into public.labels (naam, type) values
  ('Te weinig wind', 'beide'),
  ('Teveel wind', 'beide'),
  ('Onweer', 'beide'),
  ('Ziekte', 'beide'),
  ('Overig', 'beide');

-- ------------------------------------------------------------
-- Tabel: lessen
-- ------------------------------------------------------------
create table public.lessen (
  id uuid primary key default gen_random_uuid(),
  cursist_id uuid not null references public.profiles (id) on delete cascade,
  datum date not null,
  starttijd time not null,
  eindtijd time not null,
  status les_status not null default 'gepland',
  label_id uuid references public.labels (id),
  oorspronkelijke_les_id uuid references public.lessen (id),
  beschikbaarheid_id uuid references public.beschikbaarheid (id),
  soort les_soort not null default 'priveles',
  tweede_persoon_id uuid references public.tweede_persoon (id),
  instructeur_id uuid references public.profiles (id),
  discipline discipline not null default 'polyvalk',
  aangemaakt_op timestamptz not null default now(),
  -- Een les moet minimaal 2 uur duren.
  constraint lessen_duur_check check (eindtijd - starttijd >= interval '2 hours'),
  constraint lessen_duo_check check (
    (soort = 'duo_cursus' and tweede_persoon_id is not null)
    or (soort = 'priveles' and tweede_persoon_id is null)
  )
);

alter table public.lessen enable row level security;

create policy "Cursist ziet eigen lessen"
  on public.lessen for select
  using (auth.uid() = cursist_id or public.is_beheerder());

create policy "Beheerder plant lessen in"
  on public.lessen for insert
  with check (public.is_beheerder());

create policy "Beheerder wijzigt lessen"
  on public.lessen for update
  using (public.is_beheerder());

create policy "Beheerder verwijdert lessen"
  on public.lessen for delete
  using (public.is_beheerder());

-- Instructeur ziet lessen die aan hem gekoppeld zijn, of nog openstaan
-- om zich voor aan te melden.
create policy "Instructeur ziet relevante lessen"
  on public.lessen for select
  using (
    instructeur_id = auth.uid()
    or (instructeur_id is null and status = 'gepland' and public.is_instructeur())
  );

-- ------------------------------------------------------------
-- Functie: instructeur meldt zich aan/af voor een les
-- ------------------------------------------------------------
create or replace function public.meld_aan_als_instructeur(p_les_id uuid)
returns public.lessen
language plpgsql
security definer
set search_path = public
as $$
declare
  v_les public.lessen;
begin
  if not public.is_instructeur() then
    raise exception 'Alleen instructeurs kunnen zich aanmelden voor een les';
  end if;

  select * into v_les from public.lessen where id = p_les_id;
  if not found then
    raise exception 'Les niet gevonden';
  end if;
  if v_les.instructeur_id is not null then
    raise exception 'Deze les heeft al een instructeur';
  end if;
  if v_les.status <> 'gepland' then
    raise exception 'Deze les staat niet meer open';
  end if;

  update public.lessen set instructeur_id = auth.uid() where id = p_les_id
  returning * into v_les;

  return v_les;
end;
$$;

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
  set instructeur_id = null
  where id = p_les_id and instructeur_id = auth.uid()
  returning * into v_les;

  if not found then
    raise exception 'Je bent niet gekoppeld aan deze les';
  end if;

  return v_les;
end;
$$;

-- Privacybeperkte naamgegevens: een instructeur mag alleen de naam
-- zien van cursisten waar hij daadwerkelijk een les mee geeft.
create or replace function public.lesgever_mijn_cursisten()
returns table(cursist_id uuid, voornaam text, achternaam text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct p.id, p.voornaam, p.achternaam
  from public.profiles p
  join public.lessen l on l.cursist_id = p.id
  where l.instructeur_id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Functie: les inplannen (beheerder)
-- Maakt de les aan en zet de gekoppelde beschikbaarheid in dezelfde
-- transactie op 'ingepland', zodat dit nooit uit sync raakt.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Functie: les verzetten (beheerder)
-- Zet de oude les op 'verzet' (met reden), maakt een nieuwe geplande les
-- aan op de nieuwe datum/tijd en geeft de oorspronkelijke beschikbaarheid
-- weer vrij.
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

-- ------------------------------------------------------------
-- Functie: les annuleren (beheerder)
-- Zet de les op 'geannuleerd' (met reden) en geeft de gekoppelde
-- beschikbaarheid weer vrij.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Indexen voor de meest gebruikte lookups
-- ------------------------------------------------------------
create index idx_beschikbaarheid_cursist on public.beschikbaarheid (cursist_id);
create index idx_beschikbaarheid_datum on public.beschikbaarheid (datum);
create index idx_lessen_cursist on public.lessen (cursist_id);
create index idx_lessen_datum on public.lessen (datum);

-- ------------------------------------------------------------
-- Eerste beheerder instellen
-- Voer dit los uit NADAT je zelf hebt geregistreerd via de app,
-- met je eigen e-mailadres:
--
-- update public.profiles set rol = 'beheerder' where email = 'jouw-email@voorbeeld.nl';
-- ------------------------------------------------------------
