-- ============================================================
-- Priveles-portal Zeilschool — cursisten archiveren
-- Voer dit uit in de SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists gearchiveerd boolean not null default false;

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

-- Een gearchiveerde cursist kan zijn eigen profiel niet meer bewerken.
drop policy if exists "Cursist bewerkt eigen profiel" on public.profiles;
create policy "Cursist bewerkt eigen profiel"
  on public.profiles for update
  using ((auth.uid() = id and not public.is_gearchiveerd()) or public.is_beheerder());

-- Een gearchiveerde cursist kan geen beschikbaarheid meer toevoegen/wijzigen/verwijderen.
drop policy if exists "Cursist voegt eigen beschikbaarheid toe" on public.beschikbaarheid;
create policy "Cursist voegt eigen beschikbaarheid toe"
  on public.beschikbaarheid for insert
  with check ((auth.uid() = cursist_id and not public.is_gearchiveerd()) or public.is_beheerder());

drop policy if exists "Cursist wijzigt eigen beschikbaarheid" on public.beschikbaarheid;
create policy "Cursist wijzigt eigen beschikbaarheid"
  on public.beschikbaarheid for update
  using ((auth.uid() = cursist_id and status = 'open' and not public.is_gearchiveerd()) or public.is_beheerder());

drop policy if exists "Cursist verwijdert eigen beschikbaarheid" on public.beschikbaarheid;
create policy "Cursist verwijdert eigen beschikbaarheid"
  on public.beschikbaarheid for delete
  using ((auth.uid() = cursist_id and status = 'open' and not public.is_gearchiveerd()) or public.is_beheerder());
