-- ============================================================
-- Priveles-portal Zeilschool — Fase 2 aanvulling
-- Voer dit uit NA supabase/schema.sql, eenmalig, in de SQL Editor.
-- ============================================================

-- Een cursist mag alleen nog eigen open beschikbaarheid wijzigen/verwijderen
-- (niet meer zodra er een les op is ingepland). Beheerder blijft alles mogen.
drop policy if exists "Cursist wijzigt eigen beschikbaarheid" on public.beschikbaarheid;
create policy "Cursist wijzigt eigen beschikbaarheid"
  on public.beschikbaarheid for update
  using ((auth.uid() = cursist_id and status = 'open') or public.is_beheerder());

drop policy if exists "Cursist verwijdert eigen beschikbaarheid" on public.beschikbaarheid;
create policy "Cursist verwijdert eigen beschikbaarheid"
  on public.beschikbaarheid for delete
  using ((auth.uid() = cursist_id and status = 'open') or public.is_beheerder());

-- Functie die de beheerder gebruikt om een les in te plannen op basis van
-- een opgegeven beschikbaarheid. Maakt de les aan en zet de beschikbaarheid
-- in dezelfde transactie op 'ingepland', zodat dit nooit uit sync raakt.
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

  insert into public.lessen (cursist_id, datum, starttijd, eindtijd, status)
  values (p_cursist_id, p_datum, p_starttijd, p_eindtijd, 'gepland')
  returning * into v_les;

  if p_beschikbaarheid_id is not null then
    update public.beschikbaarheid
    set status = 'ingepland'
    where id = p_beschikbaarheid_id;
  end if;

  return v_les;
end;
$$;
