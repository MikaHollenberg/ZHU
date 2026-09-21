-- ============================================================
-- Migratie 022: ook een melding bij het wijzigen van bestaande
-- beschikbaarheid, niet alleen bij een gloednieuwe dag.
-- ============================================================
-- Let op: plan_les/verzet_les/annuleer_les zetten beschikbaarheid.status om
-- tussen 'open' en 'ingepland' (los van de inhoud) — dat zijn systeemacties,
-- geen bewuste wijziging door de cursist/instructeur, dus die mogen geen
-- melding geven. Vandaar de inhoudelijke vergelijking hieronder: alleen een
-- melding als type/tijden/lesvorm/discipline daadwerkelijk veranderen.

create or replace function public.trg_meld_nieuwe_beschikbaarheid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_naam text;
begin
  if tg_op = 'UPDATE' then
    if new.type is not distinct from old.type
       and new.starttijd is not distinct from old.starttijd
       and new.eindtijd is not distinct from old.eindtijd
       and new.soort is not distinct from old.soort
       and new.discipline is not distinct from old.discipline
       and new.duo_cursus_type is not distinct from old.duo_cursus_type
    then
      return new;
    end if;
  end if;

  select trim(voornaam || ' ' || achternaam) into v_naam from public.profiles where id = new.cursist_id;

  insert into public.meldingen (type, titel, omschrijving, link)
  values (
    'nieuwe_beschikbaarheid',
    case when tg_op = 'UPDATE' then 'Beschikbaarheid gewijzigd' else 'Nieuwe beschikbaarheid' end,
    coalesce(v_naam, 'Iemand') ||
      (case when tg_op = 'UPDATE' then ' heeft beschikbaarheid gewijzigd voor ' else ' heeft beschikbaarheid doorgegeven voor ' end) ||
      to_char(new.datum, 'DD-MM-YYYY'),
    '/beheer/beschikbaarheid'
  );
  return new;
end;
$$;

drop trigger if exists on_beschikbaarheid_nieuw on public.beschikbaarheid;
create trigger on_beschikbaarheid_nieuw
  after insert or update on public.beschikbaarheid
  for each row execute function public.trg_meld_nieuwe_beschikbaarheid();

revoke execute on function public.trg_meld_nieuwe_beschikbaarheid() from public, anon, authenticated;
