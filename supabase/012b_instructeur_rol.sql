-- ============================================================
-- Priveles-portal Zeilschool — instructeursrol, stap B
-- Voer dit uit NADAT 012a_instructeur_rol_enum.sql is gelukt.
-- ============================================================

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

-- Koppeling tussen een les en de instructeur die hem geeft.
alter table public.lessen add column if not exists instructeur_id uuid references public.profiles (id);

-- Instructeur ziet lessen die aan hem gekoppeld zijn, of nog openstaan
-- om zich voor aan te melden. (Beheerder en cursist-toegang blijven
-- via de bestaande policies lopen; policies worden met OR gecombineerd.)
create policy "Instructeur ziet relevante lessen"
  on public.lessen for select
  using (
    instructeur_id = auth.uid()
    or (instructeur_id is null and status = 'gepland' and public.is_instructeur())
  );

-- Instructeur meldt zich aan voor een openstaande les.
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

-- Instructeur meldt zich weer af van een les die hij zelf gaf.
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
-- zien van cursisten waar hij daadwerkelijk een les mee geeft — geen
-- andere profielgegevens (e-mail, telefoon, geboortedatum, etc.).
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
